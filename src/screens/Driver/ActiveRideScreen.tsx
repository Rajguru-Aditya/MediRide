import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getCurrentLocation } from '../../utils/location';

// Status flow
const STATUS_CONFIG: Record<string, { label: string; action: string; next: string; color: string }> = {
  accepted:  { label: '🚑 HEADING TO PICKUP',   action: 'Start Drive',     next: 'en_route',  color: '#FFB800' },
  en_route:  { label: '🚑 EN ROUTE TO PICKUP',  action: 'Mark as Arrived', next: 'arrived',   color: '#FF3B30' },
  arrived:   { label: '✅ ARRIVED AT PICKUP',    action: 'Complete Ride',   next: 'completed', color: '#34C759' },
  completed: { label: '✅ RIDE COMPLETED',       action: 'Done',            next: '',          color: '#8A8FA8' },
};

const ActiveRideScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();

  const { rideId, patientName, pickupLabel, pickupCoords } = route?.params ?? {};

  const [rideStatus, setRideStatus]         = useState<string>('accepted');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta]                       = useState<string>('Calculating...');
  const [updating, setUpdating]             = useState(false);

  const pingAnim    = useRef(new Animated.Value(1)).current;
  const watchActive = useRef(false);

  // ─── Ping animation ──────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 1,   duration: 0,    useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ─── Start GPS polling and write to Firestore ─────────────────
  useEffect(() => {
    if (!rideId) return;
    watchActive.current = true;

    const trackLocation = async () => {
      while (watchActive.current) {
        try {
          const coords: any = await getCurrentLocation();
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setDriverLocation(loc);

          // Write to Firestore — user tracking screen picks this up instantly
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

          // Calculate ETA to pickup
          if (pickupCoords) {
            const distKm = haversineKm(loc, pickupCoords);
            const minutes = Math.round((distKm / 30) * 60);
            setEta(minutes <= 1 ? 'Arriving now' : `${minutes} min`);
          }
        } catch (e) {
          console.log('GPS error:', e);
        }

        // Poll every 5 seconds
        await new Promise((res : any) => setTimeout(res, 5000));
      }
    };

    trackLocation();

    // Listen to ride status from Firestore
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
    Linking.openURL(
      `google.navigation:q=${pickupCoords.latitude},${pickupCoords.longitude}`
    );
  };

  const statusConfig = STATUS_CONFIG[rideStatus] ?? STATUS_CONFIG.accepted;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={{ flex: 1 }}>

        {/* Top Status */}
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>

          {eta !== 'Calculating...' && (
            <View style={styles.etaTopChip}>
              <Text style={styles.etaTopText}>{eta}</Text>
            </View>
          )}
        </View>

        {/* Map Area — simulated with driver dot */}
        <View style={styles.map}>
          {/* Route line */}
          <View style={styles.routeLine} />

          {/* Driver location dot with ping */}
          <View style={styles.driverPinWrapper}>
            <Animated.View
              style={[styles.ping, { transform: [{ scale: pingAnim }], opacity: 0.3 }]}
            />
            <View style={styles.driverPin} />
          </View>

          {/* Destination pin */}
          <View style={styles.destinationPin} />

          {/* Live coords display */}
          {driverLocation && (
            <View style={styles.coordsBox}>
              <Text style={styles.coordsText}>
                📍 {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {/* ETA box */}
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ETA to Pickup</Text>
            <Text style={styles.eta}>{eta}</Text>
          </View>
        </View>

        {/* Bottom Sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.handle} />

          {/* Patient info */}
          <View style={styles.patientRow}>
            <View style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {patientName ? patientName[0].toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientText}>{patientName ?? 'Patient'}</Text>
              <Text style={styles.subText}>Emergency pickup</Text>
            </View>
          </View>

          {/* Pickup address */}
          <View style={styles.infoBlock}>
            <Text style={styles.smallLabel}>Pickup Location</Text>
            <Text style={styles.value}>{pickupLabel ?? 'Fetching...'}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.callBtn}>
              <Text style={styles.callText}>📞 Call Patient</Text>
            </Pressable>

            <Pressable style={styles.navBtn} onPress={openNavigation}>
              <Text style={styles.navText}>Navigate</Text>
            </Pressable>
          </View>

          {/* Advance status CTA */}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: statusConfig.color }, updating && { opacity: 0.7 }]}
            onPress={advanceStatus}
            disabled={updating || rideStatus === 'completed'}
          >
            <Text style={styles.actionBtnText}>
              {updating ? 'Updating...' : statusConfig.action}
            </Text>
          </Pressable>

          <View style={styles.statusRow}>
            <Text style={styles.green}>● Hospital notified</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.green}>● Bed reserved</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  topBar: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 30 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  etaTopChip: { backgroundColor: 'rgba(10,15,44,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  etaTopText: { color: '#fff', fontWeight: '700' },
  map: { flex: 1, backgroundColor: '#1E2440' },
  routeLine: { position: 'absolute', top: '40%', left: '20%', width: '60%', height: 3, backgroundColor: '#FF3B30', borderRadius: 2 },
  driverPinWrapper: { position: 'absolute', bottom: 100, left: 80, alignItems: 'center', justifyContent: 'center' },
  ping: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#34C759' },
  driverPin: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#34C759', borderWidth: 3, borderColor: '#fff' },
  destinationPin: { position: 'absolute', top: 120, right: 80, width: 16, height: 16, backgroundColor: '#FF3B30', borderRadius: 8 },
  coordsBox: { position: 'absolute', top: 80, right: 16, backgroundColor: 'rgba(10,15,44,0.85)', padding: 8, borderRadius: 8 },
  coordsText: { color: '#8A8FA8', fontSize: 10 },
  etaBox: { position: 'absolute', top: 80, left: 20, backgroundColor: '#141929', padding: 12, borderRadius: 10 },
  etaLabel: { color: '#9CA3AF', fontSize: 10 },
  eta: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141929', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' },
  patientText: { color: '#fff', fontWeight: '600' },
  subText: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  infoBlock: { marginBottom: 12 },
  smallLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 2 },
  value: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  callBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, alignItems: 'center' },
  callText: { color: '#fff' },
  navBtn: { flex: 1, backgroundColor: '#1E2540', padding: 12, borderRadius: 12, alignItems: 'center' },
  navText: { color: '#fff', fontWeight: '700' },
  actionBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  green: { color: '#34C759', fontSize: 12 },
  dot: { color: 'rgba(255,255,255,0.3)' },
});