import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
  Linking,
  BackHandler
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, Navigation } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getCurrentLocation } from '../../utils/location';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0A0F2C' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8A8FA8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0F2C' }] },
  { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#1E2540' }] },
  { featureType: 'road.arterial',      elementType: 'geometry', stylers: [{ color: '#1E2540' }] },
  { featureType: 'road.highway',       elementType: 'geometry', stylers: [{ color: '#253060' }] },
  { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#060d1f' }] },
  { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',            stylers: [{ visibility: 'off' }] },
];

const STATUS_CONFIG: Record<string, { label: string; action: string; next: string; color: string }> = {
  accepted:  { label: '🚑 HEADING TO PICKUP',  action: 'Start Drive',     next: 'en_route',  color: '#FFB800' },
  en_route:  { label: '🚑 EN ROUTE TO PICKUP', action: 'Mark as Arrived', next: 'arrived',   color: '#FF3B30' },
  arrived:   { label: '✅ ARRIVED AT PICKUP',   action: 'Complete Ride',   next: 'completed', color: '#34C759' },
  completed: { label: '✅ RIDE COMPLETED',      action: 'Done',            next: '',          color: '#8A8FA8' },
};

// ─── Generate N interpolated waypoints between two coords ────────
// Adds small jitter to each step to simulate road-following movement
function generateWaypoints(
  start: { latitude: number; longitude: number },
  end:   { latitude: number; longitude: number },
  steps: number
): { latitude: number; longitude: number }[] {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Linear interpolation
    const lat = start.latitude  + (end.latitude  - start.latitude)  * t;
    const lng = start.longitude + (end.longitude - start.longitude) * t;
    // Small random jitter (±0.0003° ≈ ±30m) to look like road following
    const jitterLat = i > 0 && i < steps ? (Math.random() - 0.5) * 0.0006 : 0;
    const jitterLng = i > 0 && i < steps ? (Math.random() - 0.5) * 0.0006 : 0;
    points.push({ latitude: lat + jitterLat, longitude: lng + jitterLng });
  }
  return points;
}

const SIMULATION_STEPS    = 150;   // total waypoints from start → pickup
const STEP_INTERVAL_MS    = 2000; // move one step every 2 seconds

const ActiveRideScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const { rideId, patientName, pickupLabel, pickupCoords } = route?.params ?? {};

  const [rideStatus, setRideStatus]         = useState<string>('accepted');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta]                       = useState<string>('Calculating...');
  const [etaSeconds, setEtaSeconds]         = useState<number>(0); // countdown in seconds
  const [updating, setUpdating]             = useState(false);
  const [simReady, setSimReady]             = useState(false);
  const [simulationStarted, setSimulationStarted] = useState(false);

  const waypointsRef    = useRef<{ latitude: number; longitude: number }[]>([]);
  const stepIndexRef    = useRef(0);
  const simIntervalRef  = useRef<any>(null);
  const etaIntervalRef  = useRef<any>(null);
  const watchActive     = useRef(true);

  // ...

  useEffect(() => {
    if (!rideId) return;
  
    const unsub = firestore()
      .collection('rides')
      .doc(rideId)
      .onSnapshot(doc => {
        const data = doc.data();
        if (!data) return;
  
        setRideStatus(data.status);
        // also restore pickupCoords, etc if needed
      });
  
    return unsub;
  }, [rideId]);
  
  React.useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Exit App',
        'Do you want to exit?',
        [
          {
            text: 'Cancel',
            onPress: () => {
              // Do nothing
            },
            style: 'cancel',
          },
          { text: 'YES', onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: false }
      );
  
      return true;
    };
  
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
  
    return () => backHandler.remove();
  }, []);

  useEffect(() => {

    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, []);

  // ─── On mount: get real GPS → build waypoints → start sim ────
  useEffect(() => {
    if (!rideId || !pickupCoords) return;

    const init = async () => {
      try {
        // Get real current location as simulation start point
        const coords: any = await getCurrentLocation();
        const start = { latitude: coords.latitude, longitude: coords.longitude };

        // Generate interpolated path from driver → pickup
        const waypoints = generateWaypoints(start, pickupCoords, SIMULATION_STEPS);
        waypointsRef.current = waypoints;

        // Calculate initial ETA (seconds = steps × interval)
        const totalSeconds = SIMULATION_STEPS * (STEP_INTERVAL_MS / 1000);
        setEtaSeconds(totalSeconds);
        setEta(formatEta(totalSeconds));

        // Set initial position
        setDriverLocation(waypoints[0]);
        setSimReady(true);

        // Write initial position to Firestore
        await writeLocation(waypoints[0], rideId);

        // Fit map to show both markers
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([waypoints[0], pickupCoords], {
            edgePadding: { top: 80, right: 60, bottom: 320, left: 60 },
            animated: true,
          });
        }
      } catch (e) {
        console.log('Simulation init error:', e);
      }
    };

    init();

    // Listen to ride status
    const unsubscribe = firestore()
      .collection('rides')
      .doc(rideId)
      .onSnapshot(snap => {
        if (snap.data()?.status) setRideStatus(snap.data()!.status);
      });

    return () => {
      watchActive.current = false;
      clearInterval(simIntervalRef.current);
      clearInterval(etaIntervalRef.current);
      unsubscribe();
    };
  }, [rideId]);

  // ─── Start simulation loop once waypoints are ready ──────────
  useEffect(() => {
    if (!simReady || !pickupCoords || !simulationStarted) return;

    // Move marker every STEP_INTERVAL_MS
    simIntervalRef.current = setInterval(async () => {
      const nextIndex = stepIndexRef.current + 1;

      if (nextIndex >= waypointsRef.current.length) {
        // Reached pickup — snap to exact pickup coords
        clearInterval(simIntervalRef.current);
        clearInterval(etaIntervalRef.current);
        setDriverLocation(pickupCoords);
        setEta('Arriving now');
        await writeLocation(pickupCoords, rideId);
        return;
      }

      stepIndexRef.current = nextIndex;
      const loc = waypointsRef.current[nextIndex];
      setDriverLocation(loc);

      // Pan map smoothly
      if (mapRef.current) {
        mapRef.current.animateCamera(
          { center: loc, zoom: 15 },
          { duration: 800 }
        );
      }

      // Write to Firestore so user's screen updates too
      await writeLocation(loc, rideId);
    }, STEP_INTERVAL_MS);

    // ETA countdown — tick every second
    etaIntervalRef.current = setInterval(() => {
      setEtaSeconds(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(etaIntervalRef.current);
          setEta('Arriving now');
          return 0;
        }
        setEta(formatEta(next));
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(simIntervalRef.current);
      clearInterval(etaIntervalRef.current);
    };
  }, [simReady, simulationStarted]);

  // ─── Write location to Firestore ─────────────────────────────
  const writeLocation = async (
    loc: { latitude: number; longitude: number },
    id: string
  ) => {
    try {
      await firestore()
        .collection('rides')
        .doc(id)
        .update({
          driverLocation: {
            ...loc,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          driverName: auth().currentUser?.displayName ?? 'Driver',
        });
    } catch (e) {
      console.log('Firestore write error:', e);
    }
  };

  // ─── Format seconds → "X min Y sec" or "X min" ───────────────
  const formatEta = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins} min`;
    return `${mins}m ${secs}s`;
  };

  // ─── Advance ride status ──────────────────────────────────────
  const advanceStatus = async () => {
    const config = STATUS_CONFIG[rideStatus];
    if (!config?.next) return;

    if (rideStatus === 'arrived') {
      Alert.alert('Complete Ride?', 'Mark this ride as completed?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => doAdvance(config.next) },
      ]);
    } else {
      doAdvance(config.next);
    }
  };

  const doAdvance = async (nextStatus: string) => {
    try {
      setUpdating(true);
      if (rideStatus === 'accepted' && nextStatus === 'en_route') {
        setSimulationStarted(true);
      }
      await firestore().collection('rides').doc(rideId).update({ status: nextStatus });
      setRideStatus(nextStatus);

      if (nextStatus !== 'completed') {
        await AsyncStorage.setItem('ACTIVE_RIDE_ID', rideId);
      }

      if (nextStatus === 'completed') {
        watchActive.current = false;
        clearInterval(simIntervalRef.current);
        clearInterval(etaIntervalRef.current);
        await AsyncStorage.removeItem('ACTIVE_RIDE_ID');
        navigation.reset({ index: 0, routes: [{ name: 'DriverHome' }] });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update ride status.');
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = () => {
    if (!pickupCoords) return;
    Linking.openURL(`google.navigation:q=${pickupCoords.latitude},${pickupCoords.longitude}`);
  };

  const statusConfig = STATUS_CONFIG[rideStatus] ?? STATUS_CONFIG.accepted;

  const initialRegion = pickupCoords
    ? { ...pickupCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 19.076, longitude: 72.877, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  // Route shown on map: remaining waypoints from current step to pickup
  const remainingRoute = waypointsRef.current.slice(stepIndexRef.current);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Google Map ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Pickup marker */}
        {pickupCoords && (
          <Marker coordinate={pickupCoords} title="Patient Pickup" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupMarker}>
              <Text style={styles.markerEmoji}>📍</Text>
            </View>
          </Marker>
        )}

        {/* Driver marker — moves with simulation */}
        {driverLocation && (
          <Marker coordinate={driverLocation} title="You" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Text style={styles.markerEmoji}>🚑</Text>
            </View>
          </Marker>
        )}

        {/* Route line — shrinks as driver advances */}
        {remainingRoute.length > 1 && (
          <Polyline
            coordinates={remainingRoute}
            strokeColor="#FF3B30"
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* ── Top overlay ── */}
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.topBar}>
          <View style={[styles.statusPill, { borderColor: statusConfig.color }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          <View style={styles.etaChip}>
            <Text style={styles.etaChipText}>{eta}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom sheet ── */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.handle} />

        {/* Patient row */}
        <View style={styles.patientRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {patientName ? patientName[0].toUpperCase() : 'P'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{patientName ?? 'Patient'}</Text>
            <Text style={styles.patientSub}>Emergency pickup · {pickupLabel ?? ''}</Text>
          </View>
          <Pressable style={styles.callBtn}>
            <Phone size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.navigateBtn} onPress={openNavigation}>
            <Navigation size={16} color="#fff" />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: statusConfig.color }, updating && { opacity: 0.7 }]}
            onPress={advanceStatus}
            disabled={updating || rideStatus === 'completed'}
          >
            <Text style={styles.actionBtnText}>
              {updating ? 'Updating...' : statusConfig.action}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.green}>● Hospital notified</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.green}>● Bed reserved</Text>
        </View>
      </View>
    </View>
  );
};

// Haversine distance in km
function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude  - a.latitude)  * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude  * Math.PI) / 180) *
    Math.cos((b.latitude  * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default ActiveRideScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F2C' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,15,44,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flex: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  etaChip: { backgroundColor: 'rgba(10,15,44,0.9)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  etaChipText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pickupMarker: { backgroundColor: 'rgba(10,15,44,0.9)', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#FF3B30' },
  driverMarker: { backgroundColor: 'rgba(10,15,44,0.9)', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#34C759' },
  markerEmoji: { fontSize: 20 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141929', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 8 },
  handle: { width: 40, height: 4, backgroundColor: '#1E2540', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  patientName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  patientSub: { color: '#8A8FA8', fontSize: 12, marginTop: 2 },
  callBtn: { backgroundColor: '#34C759', padding: 10, borderRadius: 20 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  navigateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1E2540', paddingVertical: 13, borderRadius: 12, flex: 1 },
  navigateBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 4 },
  green: { color: '#34C759', fontSize: 12 },
  dot: { color: 'rgba(255,255,255,0.3)' },
});