import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DriverNavItem from '../../components/DriverNavItem';
import DriverActivityItem from '../../components/DriverActivityItem';
import DriverStatCard from '../../components/DriverStatCard';
import { Home, ClipboardList, History, User } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getCurrentLocation } from '../../utils/location';

const DriverHome = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [isOnline, setIsOnline]         = useState(true);
  const [driverData, setDriverData]     = useState<any>(null);
  const [locationName, setLocationName] = useState<string>('Fetching...');

  const currentUser = auth().currentUser;

  // ─── Fetch driver Firestore profile ──────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    firestore()
      .collection('drivers')
      .doc(currentUser.uid)
      .get()
      .then(doc => {
        if (doc.exists) setDriverData(doc.data());
      })
      .catch(e => console.log('Driver fetch error:', e));
  }, [currentUser]);

  // ─── Fetch location + reverse geocode ────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchLocation = async () => {
      try {
        const coords: any = await getCurrentLocation();

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
          {
            headers: {
              'User-Agent': 'RapidAid/1.0 (college project)',
              'Accept': 'application/json',
            },
          }
        );
        const data = JSON.parse(await res.text());
        const area =
          data?.address?.residential ||
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          data?.address?.city_district ||
          data?.address?.city ||
          'Mumbai';

        setLocationName(area);

        // Save driver location to Firestore
        await firestore()
          .collection('drivers')
          .doc(currentUser.uid)
          .set(
            {
              location: {
                latitude:  coords.latitude,
                longitude: coords.longitude,
              },
              isOnline,
            },
            { merge: true }
          );
      } catch (err) {
        console.log('Location error:', err);
        setLocationName('Mumbai');
      }
    };

    fetchLocation();
  }, [currentUser, isOnline]);

  // ─── Derive display name ──────────────────────────────────────
  // Priority: Firestore profile → Firebase Auth displayName → email prefix
  const fullName =
    driverData?.fullName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Driver';

  const initials = fullName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{fullName}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified Driver</Text>
              </View>
            </View>
            {/* Live location under name */}
            <Text style={styles.locationText}>📍 {locationName}</Text>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Availability Status</Text>
            <Pressable
              onPress={() => setIsOnline(!isOnline)}
              style={[styles.toggle, isOnline && styles.toggleActive]}
            >
              <View style={[styles.toggleCircle, isOnline && { alignSelf: 'flex-end' }]} />
            </Pressable>
          </View>

          <Text style={[styles.statusText, { color: isOnline ? '#34C759' : '#FF3B30' }]}>
            {isOnline ? 'You are ONLINE' : 'You are OFFLINE'}
          </Text>
          <Text style={styles.subText}>12-hour shift: 8:00 AM - 8:00 PM</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <DriverStatCard value="4"      label="Today's Rides" />
          <DriverStatCard value="₹2,840" label="Earnings" highlight />
          <DriverStatCard value="4.8 ⭐" label="Rating" />
        </View>

        {/* Ambulance Info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.ambulanceIcon}>
              <Text style={{ fontSize: 24 }}>🚑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleNumber}>
                {driverData?.vehicleNumber ?? 'MH-02 AB 1234'}
              </Text>
              <Text style={styles.subText}>
                Type: {driverData?.ambulanceType ?? 'BLS Ambulance'}
              </Text>
              <View style={styles.activeBadge}>
                <View style={styles.dot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <DriverActivityItem title="Male, 32 • Heart Attack"      time="3:45 PM • 8.2 km" amount="₹1,200" />
          <DriverActivityItem title="Female, 28 • Fracture"        time="1:20 PM • 5.5 km" amount="₹800"   />
          <DriverActivityItem title="Male, 45 • Breathing Issue"   time="11:10 AM • 3.8 km" amount="₹600" />
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <DriverNavItem label="Home"     active icon={Home} />
        <DriverNavItem label="Requests" icon={ClipboardList} onPress={() => navigation.navigate('RideRequests')} />
        <DriverNavItem label="History"  icon={History}      onPress={() => navigation.navigate('RideHistory')} />
        <DriverNavItem label="Profile"  icon={User}         onPress={() => navigation.navigate('Profile')} />
      </View>
    </SafeAreaView>
  );
};

export default DriverHome;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  verifiedBadge: { backgroundColor: 'rgba(52,199,89,0.2)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText: { color: '#34C759', fontSize: 10 },
  locationText: { color: '#8A8FA8', fontSize: 12, marginTop: 3 },
  card: { backgroundColor: '#141929', borderRadius: 14, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontWeight: '600' },
  toggle: { width: 50, height: 26, borderRadius: 20, backgroundColor: '#1E2440', padding: 3 },
  toggleActive: { backgroundColor: '#34C759' },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  statusText: { marginTop: 10, fontWeight: '600' },
  subText: { color: '#9CA3AF', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ambulanceIcon: { width: 60, height: 60, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vehicleNumber: { color: '#fff', fontWeight: '600' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,199,89,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759', marginRight: 4 },
  activeText: { color: '#34C759', fontSize: 10 },
  sectionTitle: { color: '#fff', fontWeight: '600', marginVertical: 10 },
  activityCard: { backgroundColor: '#141929', borderRadius: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141929', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
});