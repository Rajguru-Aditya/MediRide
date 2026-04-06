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
import { MapPin, Phone } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type RideStatus = 'searching' | 'accepted' | 'en_route' | 'arrived' | 'completed';

type Coord = {
  latitude: number;
  longitude: number;
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0F2C' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A8FA8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0F2C' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E2540' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#253060' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060d1f' }] },
];

const STATUS_CONFIG: Record<RideStatus, { label: string; color: string; sub: string }> = {
  searching: { label: 'Finding your ambulance...', color: '#FFB800', sub: 'Searching nearby drivers' },
  accepted: { label: 'Driver assigned!', color: '#34C759', sub: 'Ambulance is on the way' },
  en_route: { label: 'Ambulance en route', color: '#FF3B30', sub: 'Heading to you' },
  arrived: { label: 'Ambulance arrived!', color: '#34C759', sub: 'Driver has reached' },
  completed: { label: 'Ride completed', color: '#8A8FA8', sub: 'Thank you' },
};

const UserTrackingScreen = ({ navigation }: any) => {
  const mapRef = useRef<MapView>(null);
  const currentUser = auth().currentUser;

  const [rideId, setRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus>('searching');
  const [driverLocation, setDriverLocation] = useState<Coord | null>(null);
  const [pickupCoords, setPickupCoords] = useState<Coord | null>(null);
  const [driverName, setDriverName] = useState('');
  const [eta, setEta] = useState('Calculating...');
  const [hasActiveRide, setHasActiveRide] = useState(true);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!currentUser?.uid) return;

  let unsubscribeRide: any;

  const fetchRide = async () => {
    const snapshot = await firestore()
      .collection('rides')
      .where('userId', '==', currentUser.uid)
      .where('status', 'in', ['accepted', 'en_route', 'arrived'])
      .limit(1)
      .get();

    if (snapshot.empty) {
      setHasActiveRide(false);
      setLoading(false);
      return;
    }

    const doc = snapshot.docs[0];
    setRideId(doc.id);
    setHasActiveRide(true);
    setLoading(false);

    // ✅ REALTIME LISTENER (THIS IS IMPORTANT)
    unsubscribeRide = firestore()
      .collection('rides')
      .doc(doc.id)
      .onSnapshot(snap => {
        if (!snap.exists) return;

        const data = snap.data();
        if (!data) return;

        const status = (data.status || 'searching') as RideStatus;
        setRideStatus(status);

        if (data.pickupLocation) {
          setPickupCoords({
            latitude: data.pickupLocation.latitude,
            longitude: data.pickupLocation.longitude,
          });
        }

        if (data.driverLocation) {
          const loc = {
            latitude: data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
          };

          setDriverLocation(loc);

          mapRef.current?.animateCamera(
            { center: loc, zoom: 15 },
            { duration: 800 }
          );
        }

        if (data.driverName) {
          setDriverName(data.driverName);
        }
      });
  };

  fetchRide();

  return () => {
    if (unsubscribeRide) unsubscribeRide();
  };
}, [currentUser?.uid]);

  useEffect(() => {
    if (!rideId) return;

    const unsubscribeRide = firestore()
      .collection('rides')
      .doc(rideId)
      .onSnapshot(snapshot => {
        if (!snapshot.exists) return;

        const data = snapshot.data();
        if (!data) return;

        const status = (data.status || 'searching') as RideStatus;
        setRideStatus(status);

        if (data.pickupLocation) {
          const pickup = {
            latitude: data.pickupLocation.latitude,
            longitude: data.pickupLocation.longitude,
          };
          setPickupCoords(pickup);
        }

        if (data.driverLocation) {
          const loc = {
            latitude: data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
          };
          setDriverLocation(loc);
        }

        if (data.driverName) {
          setDriverName(data.driverName);
        }
      });

    return () => unsubscribeRide();
  }, [rideId]);

  useEffect(() => {
    if (!driverLocation || !pickupCoords) return;

    const distKm = haversineKm(driverLocation, pickupCoords);
    const minutes = Math.max(1, Math.round((distKm / 30) * 60));
    setEta(minutes <= 1 ? 'Arriving now' : `${minutes} min`);
  }, [driverLocation, pickupCoords]);

  const statusConfig = STATUS_CONFIG[rideStatus] || STATUS_CONFIG.searching;

  const initialRegion = pickupCoords
    ? { ...pickupCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 19.076, longitude: 72.8777, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#FFB800" />
      </View>
    );
  }

  if (!hasActiveRide) {
    return (
      <View style={styles.container}>
        <Text style={styles.noRideText}>No active booking</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

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
          <Marker coordinate={pickupCoords} title="Pickup">
            <View style={styles.pickupMarker}>
              <MapPin size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver">
            <Text style={styles.ambulanceEmoji}>🚑</Text>
          </Marker>
        )}

        {driverLocation && pickupCoords && (
          <Polyline
            coordinates={[driverLocation, pickupCoords]}
            strokeColor="#FF3B30"
            strokeWidth={3}
          />
        )}
      </MapView>

      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ color: '#fff' }}>← Back</Text>
          </Pressable>

          <View style={[styles.statusPill, { borderColor: statusConfig.color }]}>
            <Text style={{ color: statusConfig.color }}>{statusConfig.label}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <Text style={styles.etaText}>{eta}</Text>
        <Text style={styles.subText}>{statusConfig.sub}</Text>

        {(rideStatus === 'accepted' || rideStatus === 'en_route' || rideStatus === 'arrived') && (
          <View style={styles.driverCard}>
            <Text style={styles.driverName}>{driverName || 'Driver'}</Text>
            <Pressable style={styles.callBtn}>
              <Phone size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {rideStatus === 'searching' && (
          <ActivityIndicator color="#FFB800" style={{ marginTop: 12 }} />
        )}
      </View>
    </View>
  );
};

function haversineKm(a: Coord, b: Coord) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
    Math.cos((b.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default UserTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F2C' },
  noRideText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 200,
    fontSize: 16,
  },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 10,
  },
  backBtn: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 10,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(10,15,44,0.9)',
  },
  pickupMarker: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 20,
  },
  ambulanceEmoji: {
    fontSize: 22,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#141929',
    padding: 20,
  },
  etaText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subText: {
    color: '#8A8FA8',
    marginTop: 4,
    fontSize: 13,
  },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  driverName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  callBtn: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 20,
  },
});