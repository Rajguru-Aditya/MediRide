import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, Navigation } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getCurrentLocation } from '../../utils/location';

// Dark map style matching app theme
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

const ActiveRideScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const { rideId, patientName, pickupLabel, pickupCoords } = route?.params ?? {};

  const [rideStatus, setRideStatus]         = useState<string>('accepted');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta]                       = useState<string>('Calculating...');
  const [updating, setUpdating]             = useState(false);

  const watchActive = useRef(false);

  // ─── GPS polling → write to Firestore ────────────────────────
  useEffect(() => {
    if (!rideId) return;
    watchActive.current = true;

    const trackLocation = async () => {
      while (watchActive.current) {
        try {
          const coords: any = await getCurrentLocation();
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setDriverLocation(loc);

          // Write to Firestore — user's onSnapshot moves their marker
          await firestore()
            .collection('rides')
            .doc(rideId)
            .update({
              driverLocation: {
                ...loc,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              driverName: auth().currentUser?.displayName ?? 'Driver',
            });

          // ETA calculation
          if (pickupCoords) {
            const distKm = haversineKm(loc, pickupCoords);
            const minutes = Math.round((distKm / 30) * 60);
            setEta(minutes <= 1 ? 'Arriving now' : `${minutes} min`);

            // Fit both markers on map
            if (mapRef.current) {
              mapRef.current.fitToCoordinates([loc, pickupCoords], {
                edgePadding: { top: 80, right: 60, bottom: 320, left: 60 },
                animated: true,
              });
            }
          }
        } catch (e) {
          console.log('GPS poll error:', e);
        }

        // Poll every 5 seconds
        await new Promise((res: any) => setTimeout(res, 5000));
      }
    };

    trackLocation();

    // Listen to ride status changes
    const unsubscribe = firestore()
      .collection('rides')
      .doc(rideId)
      .onSnapshot(snap => {
        if (snap.data()?.status) {
          setRideStatus(snap.data()!.status);
        }
      });

    return () => {
      watchActive.current = false;
      unsubscribe();
    };
  }, [rideId]);

  // ─── Advance status ───────────────────────────────────────────
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
      await firestore().collection('rides').doc(rideId).update({ status: nextStatus });
      setRideStatus(nextStatus);

      if (nextStatus === 'completed') {
        watchActive.current = false;
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Full screen Google Map ── */}
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
        {/* Patient pickup marker */}
        {pickupCoords && (
          <Marker coordinate={pickupCoords} title="Patient Pickup" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupMarker}>
              <Text style={styles.markerEmoji}>📍</Text>
            </View>
          </Marker>
        )}

        {/* Driver's live position */}
        {driverLocation && (
          <Marker coordinate={driverLocation} title="You" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Text style={styles.markerEmoji}>🚑</Text>
            </View>
          </Marker>
        )}

        {/* Route line between driver and pickup */}
        {driverLocation && pickupCoords && (
          <Polyline
            coordinates={[driverLocation, pickupCoords]}
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

          {eta !== 'Calculating...' && (
            <View style={styles.etaChip}>
              <Text style={styles.etaChipText}>{eta}</Text>
            </View>
          )}
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

        {/* Navigate + Status action row */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.navigateBtn} onPress={openNavigation}>
            <Navigation size={16} color="#fff" />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: statusConfig.color },
              updating && { opacity: 0.7 },
            ]}
            onPress={advanceStatus}
            disabled={updating || rideStatus === 'completed'}
          >
            <Text style={styles.actionBtnText}>
              {updating ? 'Updating...' : statusConfig.action}
            </Text>
          </Pressable>
        </View>

        {/* Hospital notified row */}
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

  // ── Top overlay ──
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,15,44,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  etaChip: {
    backgroundColor: 'rgba(10,15,44,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  etaChipText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Markers ──
  pickupMarker: {
    backgroundColor: 'rgba(10,15,44,0.9)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  driverMarker: {
    backgroundColor: 'rgba(10,15,44,0.9)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  markerEmoji: { fontSize: 20 },

  // ── Bottom sheet ──
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#1E2540',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Patient row
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  patientName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  patientSub: { color: '#8A8FA8', fontSize: 12, marginTop: 2 },
  callBtn: { backgroundColor: '#34C759', padding: 10, borderRadius: 20 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E2540',
    paddingVertical: 13,
    borderRadius: 12,
    flex: 1,
  },
  navigateBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Status row
  statusRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 4 },
  green: { color: '#34C759', fontSize: 12 },
  dot: { color: 'rgba(255,255,255,0.3)' },
});