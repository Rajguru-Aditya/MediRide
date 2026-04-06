import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Animated,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Bell,
  Ambulance,
  Heart,
  Activity,
  Truck,
  Star,
  Bed,
  Home,
  Calendar,
  Navigation,
  User,
  ChevronRight,
} from 'lucide-react-native';
import NavItem from '../../components/NavItem';
import { getCurrentLocation } from '../../utils/location';
import firestore from '@react-native-firebase/firestore';

const HomeScreen = ({ navigation, user }: any) => {
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>('Fetching...');

  // Pulse rings — 3 layers for depth
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // ─── Fetch Firestore user ────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    firestore()
      .collection('users')
      .doc(user.uid)
      .get()
      .then(doc => setUserData(doc.data()))
      .catch(e => console.log('User fetch error:', e));
  }, [user]);

  // ─── Location + reverse geocode ─────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const fetchLocation = async () => {
      try {
        const coords: any = await getCurrentLocation();

        // Reverse geocode using OpenStreetMap Nominatim (no API key needed)
        // User-Agent is required by Nominatim's usage policy, else it returns HTML
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
          {
            headers: {
              'User-Agent': 'RapidAid/1.0 (college project)',
              'Accept': 'application/json',
            },
          }
        );
        const text = await res.text(); // read as text first to debug
        const data = JSON.parse(text);

        console.log("Location: ", data)
        const suburb =
          data?.address?.residential ||
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          data?.address?.city_district ||
          data?.address?.city ||
          'Mumbai';
        setLocationName(suburb);

        // Save to Firestore
        await firestore()
          .collection('users')
          .doc(user.uid)
          .update({
            location: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          });
      } catch (err) {
        console.log('Location error:', err);
        setLocationName('Mumbai');
      }
    };

    fetchLocation();
  }, [user]);

  // ─── SOS Pulse animation ─────────────────────────────────────────
  useEffect(() => {
    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    makePulse(ring1, 0).start();
    makePulse(ring2, 600).start();
    makePulse(ring3, 1200).start();
  }, []);

  const pulseStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.45, 0.2, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.7],
        }),
      },
    ],
  });

  // ─── Static data ─────────────────────────────────────────────────
  const ambulanceTypes = [
    {
      icon: Ambulance,
      name: 'BLS Ambulance',
      description: 'Basic Life Support',
      price: '₹1,200 - ₹1,800',
    },
    {
      icon: Heart,
      name: 'ALS Ambulance',
      description: 'Advanced Life Support',
      price: '₹2,500 - ₹3,500',
    },
    {
      icon: Activity,
      name: 'ICU Ambulance',
      description: 'Intensive Care Unit',
      price: '₹4,000 - ₹6,000',
    },
    {
      icon: Truck,
      name: 'Patient Transport',
      description: 'Non-emergency transfer',
      price: '₹800 - ₹1,200',
    },
  ];

  const nearbyHospitals = [
    {
      name: 'Lilavati Hospital',
      distance: '2.3 km',
      beds: 12,
      rating: 4.8,
      available: true,
    },
    {
      name: 'Breach Candy',
      distance: '3.7 km',
      beds: 8,
      rating: 4.6,
      available: true,
    },
    {
      name: 'Jaslok Hospital',
      distance: '4.1 km',
      beds: 3,
      rating: 4.7,
      available: false,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.locationRow}>
          <MapPin color="#FF3B30" size={16} />
          <Text style={styles.locationText}>{locationName}</Text>
        </View>

        <View style={styles.bellWrapper}>
          <Bell color="#fff" size={22} />
          <View style={styles.notificationDot} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Greeting ── */}
        <Text style={styles.greeting}>
          Hi {userData?.fullName?.split(' ')[0] || 'there'} 👋
        </Text>

        {/* ── SOS Button ── */}
        <View style={styles.sosContainer}>
          <Pressable
            onPress={() => navigation.navigate('BookAmbulance')}
            style={({ pressed }) => [
              styles.sosHitArea,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            {/* Pulse rings — absolutely centered inside sosHitArea */}
            <Animated.View style={[styles.ring, pulseStyle(ring1)]} />
            <Animated.View style={[styles.ring, pulseStyle(ring2)]} />
            <Animated.View style={[styles.ring, pulseStyle(ring3)]} />

            {/* Core button */}
            <View style={styles.sosButton}>
              <Activity color="#fff" size={44} strokeWidth={2.5} />
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSub}>TAP FOR EMERGENCY</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Nearby badge ── */}
        <View style={styles.nearbyBadgeRow}>
          <View style={styles.nearbyBadge}>
            <View style={styles.nearbyDot} />
            <Text style={styles.nearbyText}>3 ambulances nearby</Text>
          </View>
        </View>

        {/* ── Ambulance Types ── */}
        <Text style={styles.sectionTitle}>Ambulance Types</Text>
        <View style={styles.grid}>
          {ambulanceTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => navigation.navigate('BookAmbulance')}
              >
                <View style={styles.iconBox}>
                  <Icon color="#FF3B30" size={20} />
                </View>
                <Text style={styles.cardTitle}>{type.name}</Text>
                <Text style={styles.cardDesc}>{type.description}</Text>
                <Text style={styles.cardPrice}>{type.price}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Nearby Hospitals ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
          <Pressable>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
        >
          {nearbyHospitals.map((h, i) => (
            <View key={i} style={styles.hospitalCard}>
              {/* Header row */}
              <View style={styles.hospitalHeader}>
                <Text style={styles.hospitalName}>{h.name}</Text>
                <View style={styles.ratingRow}>
                  <Star color="#FFB800" size={11} fill="#FFB800" />
                  <Text style={styles.ratingText}>{h.rating}</Text>
                </View>
              </View>

              {/* Distance + Beds row */}
              <View style={styles.hospitalMeta}>
                <View style={styles.metaItem}>
                  <MapPin color="#8A8FA8" size={12} />
                  <Text style={styles.metaText}>{h.distance}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Bed color="#8A8FA8" size={12} />
                  <Text style={styles.metaText}>{h.beds} beds</Text>
                </View>
              </View>

              {/* Availability badge */}
              <View
                style={[
                  styles.availBadge,
                  h.available ? styles.availGreen : styles.availRed,
                ]}
              >
                <Text
                  style={[
                    styles.availText,
                    { color: h.available ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {h.available ? 'Available' : 'Limited'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <NavItem icon={Home} label="Home" active navigation={navigation} screen="Home" />
        <NavItem icon={Calendar} label="Bookings" navigation={navigation} screen="BookAmbulance" />
        <NavItem icon={Navigation} label="Track" navigation={navigation} screen="UserTraking" />
        <NavItem icon={User} label="Profile" navigation={navigation} screen="Profile" />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F2C',
  },

  // ── Top bar ──────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bellWrapper: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0A0F2C',
  },

  // ── Greeting ─────────────────────────────────
  greeting: {
    color: '#8A8FA8',
    fontSize: 14,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 0,
  },

  // ── SOS ──────────────────────────────────────
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  // Pressable hit area — fixed square so rings center perfectly
  sosHitArea: {
    width: 290,
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ring: same size as button, absolute centered
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF3B30',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
    gap: 2,
  },
  sosText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sosSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // ── Nearby badge ─────────────────────────────
  nearbyBadgeRow: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: -20,
  },
  nearbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  nearbyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  nearbyText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Section titles ────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  seeAll: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },

  // ── Ambulance type grid ───────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  card: {
    width: '47%',
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2540',
    gap: 4,
  },
  iconBox: {
    backgroundColor: 'rgba(255,59,48,0.12)',
    padding: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cardDesc: {
    color: '#8A8FA8',
    fontSize: 11,
  },
  cardPrice: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // ── Hospital cards ────────────────────────────
  hospitalCard: {
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 14,
    width: 200,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1E2540',
    gap: 8,
  },
  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hospitalName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '600',
  },
  hospitalMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#8A8FA8',
    fontSize: 11,
  },
  availBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  availGreen: {
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  availRed: {
    backgroundColor: 'rgba(255,59,48,0.1)',
  },
  availText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Bottom nav ────────────────────────────────
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141929',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E2540',
  },
});