import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Phone, Clock } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type RideStatus = 'searching' | 'accepted' | 'en_route' | 'arrived' | 'completed';
type Coord = { latitude: number; longitude: number };

const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0A0F2C' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8A8FA8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0F2C' }] },
  { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#1E2540' }] },
  { featureType: 'road.highway',       elementType: 'geometry', stylers: [{ color: '#253060' }] },
  { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#060d1f' }] },
  { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
];

const STATUS_CONFIG: Record<RideStatus, { label: string; color: string; sub: string }> = {
  searching: { label: 'Finding your ambulance...', color: '#FFB800', sub: 'Please wait while we assign a driver' },
  accepted:  { label: 'Driver assigned!',          color: '#34C759', sub: 'Ambulance is on the way to you' },
  en_route:  { label: 'Ambulance en route',        color: '#FF3B30', sub: 'Your ambulance is heading to you' },
  arrived:   { label: 'Ambulance arrived!',        color: '#34C759', sub: 'Your driver is at the pickup location' },
  completed: { label: 'Ride completed',            color: '#8A8FA8', sub: 'Thank you for using RapidAid' },
};

const UserTrackingScreen = ({ navigation, route }: any) => {
  const mapRef      = useRef<MapView>(null);
  const currentUser = auth().currentUser;

  // rideId from ConfirmationScreen params, or fetched from Firestore
  const rideIdFromParams = route?.params?.rideId ?? null;

  const [rideId, setRideId]                 = useState<string | null>(rideIdFromParams);
  const [rideStatus, setRideStatus]         = useState<RideStatus>('searching');
  const [driverLocation, setDriverLocation] = useState<Coord | null>(null);
  const [pickupCoords, setPickupCoords]     = useState<Coord | null>(
    route?.params?.pickupCoords ?? null
  );
  const [driverName, setDriverName]         = useState('');
  const [eta, setEta]                       = useState('Calculating...');
  const [loading, setLoading]               = useState(!rideIdFromParams);
  const [hasActiveRide, setHasActiveRide]   = useState(true);

  // ─── If no rideId from params, find user's active ride ───────
  useEffect(() => {
    if (rideIdFromParams || !currentUser?.uid) return;

    const findRide = async () => {
      try {
        const snapshot = await firestore()
          .collection('rides')
          .where('userId', '==', currentUser.uid)
          .where('status', 'in', ['searching', 'accepted', 'en_route', 'arrived'])
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (snapshot.empty) {
          setHasActiveRide(false);
        } else {
          setRideId(snapshot.docs[0].id);
        }
      } catch (e) {
        console.log('Find ride error:', e);
      } finally {
        setLoading(false);
      }
    };

    findRide();
  }, [currentUser?.uid, rideIdFromParams]);

  // ─── Single onSnapshot listener once rideId is known ─────────
  useEffect(() => {
    if (!rideId) return;
    setLoading(false);

    const unsub = firestore()
      .collection('rides')
      .doc(rideId)
      .onSnapshot(snap => {
        if (!snap.exists) return;
        const data = snap.data();
        if (!data) return;

        // Status
        if (data.status) setRideStatus(data.status as RideStatus);

        // Pickup coords — your schema stores as pickup.latitude / pickup.longitude
        if (data.pickup?.latitude && data.pickup?.longitude) {
          setPickupCoords({
            latitude:  data.pickup.latitude,
            longitude: data.pickup.longitude,
          });
        }

        // Driver location — written by ActiveRideScreen simulation every 2s
        // Schema: driverLocation.latitude / driverLocation.longitude
        if (data.driverLocation?.latitude && data.driverLocation?.longitude) {
          const loc: Coord = {
            latitude:  data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
          };
          setDriverLocation(loc);

          // Smooth camera follow
          mapRef.current?.animateCamera(
            { center: loc, zoom: 15 },
            { duration: 800 }
          );
        }

        // Driver name
        if (data.driverName) setDriverName(data.driverName);

      }, err => console.log('Tracking listener error:', err));

    return () => unsub();
  }, [rideId]);

  // ─── Recalculate ETA whenever driver or pickup changes ────────
  useEffect(() => {
    if (!driverLocation || !pickupCoords) return;
    const distKm  = haversineKm(driverLocation, pickupCoords);
    const minutes = Math.round((distKm / 30) * 60);
    setEta(minutes <= 1 ? 'Arriving now' : `${minutes} min`);
  }, [driverLocation, pickupCoords]);

  // ─── Fit map whenever both coords are available ───────────────
  useEffect(() => {
    if (!driverLocation || !pickupCoords || !mapRef.current) return;
    mapRef.current.fitToCoordinates([driverLocation, pickupCoords], {
      edgePadding: { top: 80, right: 60, bottom: 280, left: 60 },
      animated: true,
    });
  }, [!!driverLocation, !!pickupCoords]); // only re-run when they go from null → value

  const statusConfig = STATUS_CONFIG[rideStatus] ?? STATUS_CONFIG.searching;

  const initialRegion = pickupCoords
    ? { ...pickupCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 19.076, longitude: 72.8777, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#FFB800" size="large" />
        <Text style={styles.loadingText}>Finding your ride...</Text>
      </View>
    );
  }

  if (!hasActiveRide) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noRideEmoji}>🚑</Text>
        <Text style={styles.noRideTitle}>No active booking</Text>
        <Text style={styles.noRideSubtext}>Book an ambulance to see live tracking</Text>
        <Pressable style={styles.bookBtn} onPress={() => navigation.navigate('BookAmbulance')}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Map ── */}
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
        {pickupCoords && (
          <Marker coordinate={pickupCoords} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupMarker}>
              <MapPin size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {driverLocation && (
          <Marker coordinate={driverLocation} title="Ambulance" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.ambulanceMarker}>
              <Text style={styles.ambulanceEmoji}>🚑</Text>
            </View>
          </Marker>
        )}

        {driverLocation && pickupCoords && (
          <Polyline
            coordinates={[driverLocation, pickupCoords]}
            strokeColor="#FF3B30"
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* ── Top bar ── */}
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={[styles.statusPill, { borderColor: statusConfig.color }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom sheet ── */}
      <View style={styles.sheet}>

        {/* ETA */}
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaValue}>{eta}</Text>
          </View>
          <View style={[styles.etaBadge, { backgroundColor: statusConfig.color + '22' }]}>
            <Clock size={13} color={statusConfig.color} />
            <Text style={[styles.etaBadgeText, { color: statusConfig.color }]}>
              {statusConfig.sub}
            </Text>
          </View>
        </View>

        {/* Driver card */}
        {['accepted', 'en_route', 'arrived'].includes(rideStatus) && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {driverName ? driverName[0].toUpperCase() : 'D'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName || 'Driver assigned'}</Text>
              <Text style={styles.driverSub}>Ambulance Driver · RapidAid</Text>
            </View>
            <Pressable style={styles.callBtn}>
              <Phone size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Searching spinner */}
        {rideStatus === 'searching' && (
          <View style={styles.searchingRow}>
            <ActivityIndicator color="#FFB800" size="small" />
            <Text style={styles.searchingText}>Contacting nearby drivers...</Text>
          </View>
        )}

        {/* Completed */}
        {rideStatus === 'completed' && (
          <Pressable
            style={styles.doneBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

function haversineKm(a: Coord, b: Coord): number {
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

export default UserTrackingScreen;

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0A0F2C' },
  centered:      { flex: 1, backgroundColor: '#0A0F2C', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:   { color: '#8A8FA8', fontSize: 14 },
  noRideEmoji:   { fontSize: 48 },
  noRideTitle:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  noRideSubtext: { color: '#8A8FA8', fontSize: 13 },
  bookBtn:       { backgroundColor: '#FF3B30', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  bookBtnText:   { color: '#fff', fontWeight: '700' },
  topOverlay:    { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, gap: 10 },
  backBtn:       { backgroundColor: 'rgba(10,15,44,0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  backText:      { color: '#fff', fontWeight: '600', fontSize: 13 },
  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,15,44,0.85)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusPillText:{ fontSize: 12, fontWeight: '600' },
  pickupMarker:  { backgroundColor: '#FF3B30', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  ambulanceMarker: { backgroundColor: 'rgba(10,15,44,0.9)', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#FF3B30' },
  ambulanceEmoji:{ fontSize: 20 },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141929', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  etaRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  etaLabel:      { color: '#8A8FA8', fontSize: 12 },
  etaValue:      { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  etaBadge:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, maxWidth: 160 },
  etaBadgeText:  { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  driverCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0F2C', borderRadius: 14, padding: 14, marginBottom: 14, gap: 12, borderWidth: 1, borderColor: '#1E2540' },
  driverAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  driverAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  driverName:    { color: '#fff', fontWeight: '600', fontSize: 14 },
  driverSub:     { color: '#8A8FA8', fontSize: 12, marginTop: 2 },
  callBtn:       { backgroundColor: '#34C759', padding: 10, borderRadius: 20 },
  searchingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,184,0,0.08)', borderRadius: 12, padding: 12 },
  searchingText: { color: '#FFB800', fontSize: 13 },
  doneBtn:       { backgroundColor: '#FF3B30', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  doneBtnText:   { color: '#fff', fontWeight: '700' },
});