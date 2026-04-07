import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DriverNavItem from '../../components/DriverNavItem';
import DriverStatCard from '../../components/DriverStatCard';
import { Home, ClipboardList, History, User, X } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getCurrentLocation } from '../../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Condition id → label
const CONDITION_LABELS: Record<string, string> = {
  accident: 'Accident', heart: 'Heart Attack', stroke: 'Stroke',
  fire: 'Fire Injury', fracture: 'Fracture', breathing: 'Breathing Issue',
  pregnancy: 'Pregnancy', poisoning: 'Poisoning', drowning: 'Drowning',
  seizure: 'Seizure', chest: 'Chest Pain', other: 'Other',
};

const DriverHome = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline]           = useState(true);
  const [driverData, setDriverData]       = useState<any>(null);
  const [locationName, setLocationName]   = useState('Fetching...');
  const [recentRides, setRecentRides]     = useState<any[]>([]);
  const [todayStats, setTodayStats]       = useState({ rides: 0, earnings: 0, rating: 4.8 });

  // Incoming request popup state
  const [incomingRide, setIncomingRide]   = useState<any>(null);
  const [showPopup, setShowPopup]         = useState(false);
  const [countdown, setCountdown]         = useState(28);
  const pulseAnim                         = useRef(new Animated.Value(0)).current;
  const countdownRef                      = useRef<any>(null);
  const currentUser                       = auth().currentUser;

  // ─── Fetch driver profile ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = firestore()
      .collection('drivers')
      .doc(currentUser.uid)
      .onSnapshot(doc => {
        setDriverData(doc.data());
      });
    return () => unsub();
  }, [currentUser]);

  // ─── Fetch today's completed rides for stats ──────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const unsub = firestore()
      .collection('rides')
      .where('driverId', '==', currentUser.uid)
      .where('status', '==', 'completed')
      .onSnapshot(snapshot => {
        const rides = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Today's rides
        const todayRides = rides.filter((r: any) => {
          const created = r.createdAt?.toDate?.();
          return created && created >= startOfDay;
        });

        // Total earnings today
        const todayEarnings = todayRides.reduce((sum: number, r: any) => {
          // fareEstimate is a string like "₹1,200 - ₹1,800" — take the lower bound
          const match = r.fareEstimate?.match(/[\d,]+/);
          const amount = match ? parseInt(match[0].replace(',', ''), 10) : 0;
          return sum + amount;
        }, 0);

        setTodayStats(prev => ({
          ...prev,
          rides:    todayRides.length,
          earnings: todayEarnings,
        }));

        // Recent 3 rides (all time, most recent first)
        const sorted = rides
          .sort((a: any, b: any) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
          )
          .slice(0, 3);
        setRecentRides(sorted);
      });

    return () => unsub();
  }, [currentUser]);

  // ─── Listen for new searching rides (incoming request) ────────
  useEffect(() => {
    if (!isOnline) return;

    const unsub = firestore()
      .collection('rides')
      .where('status', '==', 'searching')
      .onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const ride = { id: doc.id, ...doc.data() };

          // Only show popup if not already showing this ride
          setIncomingRide((prev: any) => {
            if (prev?.id === ride.id) return prev;
            setShowPopup(true);
            setCountdown(28);
            return ride;
          });
        } else {
          setShowPopup(false);
          setIncomingRide(null);
        }
      });

    return () => unsub();
  }, [isOnline]);

  // ─── Countdown timer for popup ────────────────────────────────
  useEffect(() => {
    if (!showPopup) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setShowPopup(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [showPopup]);

  // ─── Pulse animation for popup ────────────────────────────────
  useEffect(() => {
    if (!showPopup) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [showPopup]);

  // ─── Location ─────────────────────────────────────────────────
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

      const data = await res.json(); // also better than text + parse

      setLocationName(
        data?.address?.residential ||
        data?.address?.suburb ||
        data?.address?.neighbourhood ||
        data?.address?.city ||
        'Mumbai'
      );

      await firestore()
        .collection('drivers')
        .doc(currentUser.uid)
        .set(
          {
            location: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
            isOnline,
          },
          { merge: true }
        );

    } catch {
      setLocationName('Mumbai');
    }
  };

  fetchLocation();
}, [currentUser, isOnline]);

useEffect(() => {
  const checkActiveRide = async () => {
    const rideId = await AsyncStorage.getItem('ACTIVE_RIDE_ID');

    if (rideId) {
      const rideDoc = await firestore().collection('rides').doc(rideId).get();

      if (rideDoc.data()?.status !== 'completed') {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'ActiveRide',
              params: {
                rideId,
                ...rideDoc.data(),
              },
            },
          ],
        });
      } else {
        await AsyncStorage.removeItem('ACTIVE_RIDE_ID');
      }
    }
  };

  checkActiveRide();
}, []);

  // ─── Accept incoming ride ─────────────────────────────────────
  const acceptIncoming = async () => {
    if (!incomingRide) return;
    setShowPopup(false);

    await firestore().collection('rides').doc(incomingRide.id).update({
      driverId:   currentUser?.uid ?? 'driver_unknown',
      driverName: currentUser?.displayName ?? driverData?.fullName ?? 'Driver',
      status:     'accepted',
    });

    navigation.navigate('ActiveRide', {
      rideId:       incomingRide.id,
      patientName:  incomingRide.patientName,
      pickupLabel:  incomingRide.pickup?.address ?? 'Pickup Location',
      pickupCoords: incomingRide.pickup?.latitude
        ? { latitude: incomingRide.pickup.latitude, longitude: incomingRide.pickup.longitude }
        : null,
    });
  };

  // ─── Derived display values ───────────────────────────────────
  const fullName = driverData?.fullName || currentUser?.displayName ||
    currentUser?.email?.split('@')[0] || 'Driver';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '–';
    return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

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
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
            <Text style={styles.locationText}>📍 {locationName}</Text>
          </View>
        </View>

        {/* Availability toggle */}
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

        {/* Stats — real data */}
        <View style={styles.statsRow}>
          <DriverStatCard value={String(todayStats.rides)}  label="Today's Rides" />
          <DriverStatCard
            value={todayStats.earnings > 0 ? `₹${todayStats.earnings.toLocaleString('en-IN')}` : '₹0'}
            label="Earnings"
            highlight
          />
          <DriverStatCard value={`${todayStats.rating} ⭐`} label="Rating" />
        </View>

        {/* Ambulance info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.ambulanceIcon}>
              <Text style={{ fontSize: 24 }}>🚑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleNumber}>{driverData?.vehicleNumber ?? 'MH-02 AB 1234'}</Text>
              <Text style={styles.subText}>Type: {driverData?.ambulanceType ?? 'BLS Ambulance'}</Text>
              <View style={styles.activeBadge}>
                <View style={styles.dot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity — real Firestore data */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {recentRides.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>No completed rides yet today</Text>
            </View>
          ) : (
            recentRides.map((ride: any, i: number) => (
              <View
                key={ride.id}
                style={[styles.activityItem, i < recentRides.length - 1 && styles.activityBorder]}
              >
                <View style={styles.activityIcon}>
                  <Text>🚑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>
                    {CONDITION_LABELS[ride.condition] ?? ride.condition} • {ride.patientName ?? 'Patient'}
                  </Text>
                  <Text style={styles.activitySub}>
                    {formatTime(ride.createdAt)} • {ride.drop?.distance ?? '–'}
                  </Text>
                </View>
                <Text style={styles.activityAmount}>{ride.fareEstimate?.split(' - ')[0] ?? '–'}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <DriverNavItem label="Home"     active icon={Home} />
        <DriverNavItem label="Requests" icon={ClipboardList} onPress={() => navigation.navigate('RideRequests')} />
        <DriverNavItem label="History"  icon={History}      onPress={() => navigation.navigate('RideHistory')} />
        <DriverNavItem label="Profile"  icon={User}         onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* ── Incoming Request Popup ── */}
      <Modal visible={showPopup} transparent animationType="slide" onRequestClose={() => setShowPopup(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowPopup(false)} />

          <View style={styles.popupSheet}>
            {/* Pulsing header */}
            <Animated.View
              style={[
                styles.popupHeader,
                {
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
                },
              ]}
            >
              <Text style={styles.popupEmoji}>🚨</Text>
              <Text style={styles.popupTitle}>NEW EMERGENCY REQUEST</Text>
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>
                  0:{countdown.toString().padStart(2, '0')}
                </Text>
              </View>
            </Animated.View>

            {/* Ride details */}
            <View style={styles.popupBody}>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Condition</Text>
                <Text style={styles.popupValue}>
                  {CONDITION_LABELS[incomingRide?.condition] ?? incomingRide?.condition ?? '–'}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Severity</Text>
                <Text style={[
                  styles.popupValue,
                  { color: incomingRide?.severity === 'critical' ? '#FF3B30' : incomingRide?.severity === 'moderate' ? '#FFB800' : '#34C759' }
                ]}>
                  {incomingRide?.severity?.toUpperCase() ?? '–'}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Patient</Text>
                <Text style={styles.popupValue}>
                  {incomingRide?.patientName ?? '–'}, {incomingRide?.patientAge ?? '–'} yrs
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Pickup</Text>
                <Text style={styles.popupValue} numberOfLines={1}>
                  {incomingRide?.pickup?.address ?? 'Unknown location'}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Hospital</Text>
                <Text style={styles.popupValue} numberOfLines={1}>
                  {incomingRide?.drop?.hospitalName ?? '–'}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Fare</Text>
                <Text style={[styles.popupValue, { color: '#34C759' }]}>
                  {incomingRide?.fareEstimate ?? '–'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.popupActions}>
              <Pressable style={styles.declineBtn} onPress={() => setShowPopup(false)}>
                <X size={16} color="#fff" />
                <Text style={styles.declineBtnText}>Decline</Text>
              </Pressable>

              <Pressable style={styles.acceptBtn} onPress={acceptIncoming}>
                <Text style={styles.acceptBtnText}>ACCEPT</Text>
              </Pressable>
            </View>

            <Text style={styles.penaltyWarn}>
              ⚠️ Repeated declines may result in penalties
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverHome;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 20 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  verifiedBadge: { backgroundColor: 'rgba(52,199,89,0.2)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText: { color: '#34C759', fontSize: 10 },
  locationText: { color: '#8A8FA8', fontSize: 12, marginTop: 3 },

  // Card
  card: { backgroundColor: '#141929', borderRadius: 14, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontWeight: '600' },

  // Toggle
  toggle: { width: 50, height: 26, borderRadius: 20, backgroundColor: '#1E2440', padding: 3 },
  toggleActive: { backgroundColor: '#34C759' },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  statusText: { marginTop: 10, fontWeight: '600' },
  subText: { color: '#9CA3AF', marginTop: 4, fontSize: 12 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  // Ambulance
  ambulanceIcon: { width: 60, height: 60, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vehicleNumber: { color: '#fff', fontWeight: '600' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,199,89,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759', marginRight: 4 },
  activeText: { color: '#34C759', fontSize: 10 },

  // Recent activity
  sectionTitle: { color: '#fff', fontWeight: '600', marginVertical: 10 },
  activityCard: { backgroundColor: '#141929', borderRadius: 14, marginBottom: 20 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  activityBorder: { borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },
  activityIcon: { width: 40, height: 40, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { color: '#fff', fontSize: 12, fontWeight: '600' },
  activitySub: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  activityAmount: { color: '#34C759', fontWeight: '600', fontSize: 13 },
  emptyActivity: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#8A8FA8', fontSize: 13 },

  // Bottom nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141929', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },

  // ── Popup Modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  popupSheet: {
    backgroundColor: '#141929',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  popupHeader: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  popupEmoji: { fontSize: 22 },
  popupTitle: { color: '#fff', fontWeight: '800', fontSize: 15, flex: 1, letterSpacing: 0.5 },
  countdownBadge: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countdownText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  popupBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  popupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  popupLabel: { color: '#8A8FA8', fontSize: 13, width: 70 },
  popupValue: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  popupActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 4 },
  declineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, borderRadius: 12 },
  declineBtnText: { color: '#fff', fontWeight: '600' },
  acceptBtn: { flex: 2, backgroundColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  penaltyWarn: { textAlign: 'center', color: '#FFB800', fontSize: 11, paddingBottom: 24 },
});