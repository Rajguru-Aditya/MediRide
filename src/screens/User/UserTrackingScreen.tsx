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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Phone, Clock, ChevronDown } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';

console.log('MapView:', MapView);
console.log('Marker:', Marker);
console.log('SafeAreaView:', SafeAreaView);
console.log('MapPin:', MapPin);
console.log('firestore:', firestore);


// Dark map style — matches app theme
const DARK_MAP_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#0A0F2C' }] },
  { elementType: 'labels.text.fill',stylers: [{ color: '#8A8FA8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0F2C' }] },
  { featureType: 'road',            elementType: 'geometry', stylers: [{ color: '#1E2540' }] },
  { featureType: 'road.arterial',   elementType: 'geometry', stylers: [{ color: '#1E2540' }] },
  { featureType: 'road.highway',    elementType: 'geometry', stylers: [{ color: '#253060' }] },
  { featureType: 'water',           elementType: 'geometry', stylers: [{ color: '#060d1f' }] },
  { featureType: 'poi',             stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',         stylers: [{ visibility: 'off' }] },
];

// Status display config
const STATUS_CONFIG: Record<string, { label: string; color: string; sub: string }> = {
  searching:  { label: 'Finding your ambulance...',  color: '#FFB800', sub: 'Please wait while we assign a driver' },
  accepted:   { label: 'Driver assigned!',           color: '#34C759', sub: 'Ambulance is on the way to you' },
  en_route:   { label: 'Ambulance en route',         color: '#FF3B30', sub: 'Your ambulance is heading to you' },
  arrived:    { label: 'Ambulance arrived!',         color: '#34C759', sub: 'Your driver is at the pickup location' },
  completed:  { label: 'Ride completed',             color: '#8A8FA8', sub: 'Thank you for using RapidAid' },
};

const UserTrackingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // rideId comes from ConfirmationScreen after booking is created
  const { rideId, pickupCoords, pickupLabel } = route.params ?? {};

  const [rideStatus, setRideStatus]         = useState<string>('searching');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverName, setDriverName]         = useState<string>('');
  const [eta, setEta]                       = useState<string>('Calculating...');
  const [sheetExpanded, setSheetExpanded]   = useState(false);

  // ─── Listen to ride document in real time ────────────────────────
  useEffect(() => {
    if (!rideId) return;

    const unsubscribe = firestore()
      .collection('rides')
      .doc(rideId)
      .onSnapshot(snapshot => {
        if (!snapshot.exists) return;

        const data = snapshot.data()!;

        // Update status
        if (data.status) setRideStatus(data.status);

        // Update driver location — this is what moves the marker
        if (data.driverLocation) {
          const loc = {
            latitude:  data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
          };
          setDriverLocation(loc);

          // Rough ETA: calculate straight-line distance, assume 30km/h avg speed
          if (pickupCoords) {
            const distKm = haversineKm(loc, pickupCoords);
            const minutes = Math.round((distKm / 30) * 60);
            setEta(minutes <= 1 ? 'Arriving now' : `${minutes} min`);
          }

          // Pan map to keep both markers visible
          if (pickupCoords && mapRef.current) {
            mapRef.current.fitToCoordinates([loc, pickupCoords], {
              edgePadding: { top: 80, right: 60, bottom: 320, left: 60 },
              animated: true,
            });
          }
        }

        // Driver name if assigned
        if (data.driverName) setDriverName(data.driverName);
      }, error => {
        console.log('Tracking listener error:', error);
      });

    return () => unsubscribe();
  }, [rideId]);

  const statusConfig = STATUS_CONFIG[rideStatus] ?? STATUS_CONFIG.searching;

  // Initial map region — center on pickup if no driver yet
  const initialRegion = pickupCoords
    ? { ...pickupCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 19.0760, longitude: 72.8777, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Full screen map ── */}
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
        {/* Pickup location marker */}
        {pickupCoords && (
          <Marker coordinate={pickupCoords} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupMarker}>
              <MapPin size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Driver / ambulance marker */}
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Ambulance" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.ambulanceMarker}>
              <Text style={styles.ambulanceEmoji}>🚑</Text>
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

      {/* ── Top bar overlay ── */}
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Live status pill */}
          <View style={[styles.statusPill, { borderColor: statusConfig.color }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom info sheet ── */}
      <View style={[styles.sheet, sheetExpanded && styles.sheetExpanded]}>

        {/* Drag handle */}
        <Pressable
          style={styles.dragHandle}
          onPress={() => setSheetExpanded(v => !v)}
        >
          <View style={styles.handleBar} />
        </Pressable>

        {/* ETA row */}
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaValue}>{eta}</Text>
          </View>
          <View style={[styles.etaBadge, { backgroundColor: statusConfig.color + '22' }]}>
            <Clock size={14} color={statusConfig.color} />
            <Text style={[styles.etaBadgeText, { color: statusConfig.color }]}>
              {statusConfig.sub}
            </Text>
          </View>
        </View>

        {/* Driver info — only show when assigned */}
        {(rideStatus === 'accepted' || rideStatus === 'en_route' || rideStatus === 'arrived') && (
          <View style={styles.driverCard}>
            {/* Avatar */}
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {driverName ? driverName[0].toUpperCase() : 'D'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName || 'Driver assigned'}</Text>
              <Text style={styles.driverSub}>Ambulance Driver · RapidAid</Text>
            </View>

            {/* Call button */}
            <Pressable style={styles.callBtn}>
              <Phone size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Searching state — spinner */}
        {rideStatus === 'searching' && (
          <View style={styles.searchingRow}>
            <ActivityIndicator color="#FFB800" size="small" />
            <Text style={styles.searchingText}>
              Contacting nearby drivers...
            </Text>
          </View>
        )}

        {/* Pickup address */}
        <View style={styles.addressRow}>
          <View style={styles.addressDot} />
          <Text style={styles.addressText} numberOfLines={1}>
            {pickupLabel ?? 'Your pickup location'}
          </Text>
        </View>

        {/* Completed state CTA */}
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

// ─── Haversine distance (km) between two coords ───────────────────
function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude  - a.latitude)  * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
    Math.cos((b.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         style={{ flex: 1 }}
//         provider={PROVIDER_GOOGLE}
//         initialRegion={{
//           latitude: 19.0760,
//           longitude: 72.8777,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       />
//     </View>
//   );
// }

export default UserTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F2C' },

  // ── Top overlay ──
  topOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    backgroundColor: 'rgba(10,15,44,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,15,44,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 12, fontWeight: '600' },

  // ── Markers ──
  pickupMarker: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  ambulanceMarker: {
    backgroundColor: 'rgba(10,15,44,0.9)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  ambulanceEmoji: { fontSize: 20 },

  // ── Bottom sheet ──
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#141929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 8,
    minHeight: 200,
  },
  sheetExpanded: { minHeight: 360 },
  dragHandle: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 40, height: 4, backgroundColor: '#1E2540', borderRadius: 2 },

  // ETA
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  etaLabel: { color: '#8A8FA8', fontSize: 12 },
  etaValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: 160,
  },
  etaBadgeText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },

  // Driver card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0F2C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E2540',
  },
  driverAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FF3B30',
    justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  driverName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  driverSub: { color: '#8A8FA8', fontSize: 12, marginTop: 2 },
  callBtn: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 20,
  },

  // Searching
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  searchingText: { color: '#FFB800', fontSize: 13 },

  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2, borderColor: 'rgba(255,59,48,0.3)',
  },
  addressText: { color: '#8A8FA8', fontSize: 13, flex: 1 },

  // Done button
  doneBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  doneBtnText: { color: '#fff', fontWeight: '700' },
});