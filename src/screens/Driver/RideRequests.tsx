import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from '@react-native-firebase/firestore';

const Detail = ({ label, value }: any) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const Divider = () => (
  <View style={styles.divider} />
);

const RideRequests = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(28);
  const [ride, setRide] = useState<any>(null);

  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Detect firebase data change to get ride
  useEffect(() => {
    const q = query(
      collection(db, 'rides'),
      where('status', '==', 'searching')
    );
  
    const unsubscribe = onSnapshot(q, snapshot => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
  
        setRide({
          id: docSnap.id,
          ...docSnap.data(),
        });
      } else {
        // 🔥 IMPORTANT: clear ride if none
        setRide(null);
      }
    });
  
    return unsubscribe;
  }, []);

  // Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const acceptRide = async () => {
    if (!ride) return;
  
    await updateDoc(doc(db, 'rides', ride.id), {
      driverId: 'driver_123',
      status: 'accepted',
    });
  
    navigation.replace('ActiveRide');
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />
  
        <View style={styles.empty}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
            No active ride requests right now
          </Text>
  
          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>
            Waiting for new emergencies...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top,
            paddingBottom: 180,
          }}
        >
          {/* Alert Banner */}
          <View style={styles.bannerWrapper}>
            <View style={styles.banner}>
              <Animated.View
                style={[
                  styles.bannerPulse,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.5],
                    }),
                  },
                ]}
              />

              <View style={styles.bannerContent}>
                <View style={styles.bannerRow}>
                  <Text style={styles.bannerEmoji}>🚨</Text>
                  <Text style={styles.bannerText}>
                    NEW EMERGENCY REQUEST
                  </Text>
                </View>

                <Text style={styles.timer}>
                  Expires in 0:{timeLeft.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
          </View>

          {/* Request Card */}
          <View style={styles.card}>
            {/* Type */}
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 22 }}>🚗</Text>
              </View>

              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>Accident</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Detail label="Severity:" value="🔴 Critical" />
              <Detail label="Patient:" value="Male, 34 years" />

              <Divider />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Pickup:</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>
                    Andheri East, Near D-Mart
                  </Text>
                  <Text style={styles.distance}>
                    1.2 km away from you
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Drop:</Text>
                <Text style={styles.value}>
                  Kokilaben Hospital, Andheri West
                </Text>
              </View>

              <Divider />

              <View style={styles.rowBetween}>
                <Text style={styles.label}>Estimated Fare:</Text>
                <Text style={styles.price}>₹1,400 - ₹1,800</Text>
              </View>
            </View>
          </View>

          {/* Map Preview */}
          <View style={styles.map}>
            <Text style={styles.mapLabel}>📍 Route Preview</Text>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable
            style={styles.accept}
            onPress={acceptRide}
          >
            <Text style={styles.acceptText}>ACCEPT REQUEST</Text>
          </Pressable>

          <Pressable
            style={styles.decline}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>

          <Text style={styles.warning}>
            ⚠️ 3 declines remaining before penalty applies
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RideRequests;


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },

  bannerWrapper: { paddingHorizontal: 20 },

  banner: {
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
  },

  bannerPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },

  bannerContent: { position: 'relative' },

  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  bannerEmoji: { fontSize: 20 },

  bannerText: { color: '#fff', fontWeight: '700' },

  timer: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#141929',
    margin: 20,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,59,48,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeBadge: {
    backgroundColor: 'rgba(255,59,48,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  typeText: { color: '#FF3B30', fontWeight: '600' },

  details: { marginTop: 16 },

  detailRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  label: { color: '#9CA3AF', width: 80 },

  value: { color: '#fff', flex: 1 },

  distance: { color: '#34C759', marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 10,
  },

  price: { color: '#34C759', fontWeight: '700' },

  map: {
    marginHorizontal: 20,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#1E2440',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapLabel: { color: '#fff', fontSize: 12 },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0F2C',
    padding: 16,
  },

  accept: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  acceptText: { color: '#fff', fontWeight: '700' },

  decline: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  declineText: { color: '#fff' },

  warning: {
    textAlign: 'center',
    marginTop: 8,
    color: '#FFB800',
    fontSize: 12,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});