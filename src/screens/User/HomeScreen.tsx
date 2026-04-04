import React, { useEffect, useRef } from 'react';
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
} from 'lucide-react-native';
import NavItem from '../../components/NavItem';

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createPulse(pulse1, 0).start();
    createPulse(pulse2, 700).start();
  }, []);

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
      name: 'Breach Candy Hospital',
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

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: 10 }]}>
        <View style={styles.locationRow}>
          <MapPin color="#FF3B30" size={18} />
          <Text style={styles.locationText}>Mumbai</Text>
        </View>

        <View style={styles.bellWrapper}>
          <Bell color="#fff" size={22} />
          <View style={styles.notificationDot} />
        </View>
      </View>

      {/* Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Pressable
            onPress={() => navigation.navigate('BookAmbulance')}
            style={({ pressed }) => [
              styles.sosWrapper,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            {/* Animated Pulses */}
            <Animated.View
              style={[
                styles.sosOuterPulse,
                {
                  transform: [
                    {
                      scale: pulse1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.8],
                      }),
                    },
                  ],
                  opacity: pulse1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0],
                  }),
                },
              ]}
            />

            <Animated.View
              style={[
                styles.sosInnerPulse,
                {
                  transform: [
                    {
                      scale: pulse2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.6],
                      }),
                    },
                  ],
                  opacity: pulse2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />

            {/* Main Button */}
            <View style={styles.sosButton}>
              <Activity color="#fff" size={48} strokeWidth={2.5} />
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSub}>TAP FOR EMERGENCY</Text>
            </View>
          </Pressable>
        </View>

        {/* Status */}
        <View style={styles.statusWrapper}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>3 ambulances nearby</Text>
          </View>
        </View>

        {/* Ambulance Types */}
        <Text style={styles.sectionTitle}>Ambulance Types</Text>

        <View style={styles.grid}>
          {ambulanceTypes.map((type, index) => {
            const Icon = type.icon;

            return (
              <Pressable
                key={index}
                style={styles.card}
                onPress={() => navigation.navigate('BookAmbulance', { type: type })}
              >
                <View style={styles.iconBox}>
                  <Icon color="#FF3B30" size={18} />
                </View>

                <Text style={styles.cardTitle}>{type.name}</Text>
                <Text style={styles.cardDesc}>{type.description}</Text>
                <Text style={styles.cardPrice}>{type.price}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hospitals */}
        <Text style={styles.sectionTitle}>Nearby Hospitals</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearbyHospitals.map((h, i) => (
            <View key={i} style={styles.hospitalCard}>
              <View style={styles.hospitalHeader}>
                <Text style={styles.hospitalName}>{h.name}</Text>

                <View style={styles.rating}>
                  <Star size={14} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{h.rating}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <Navigation size={14} color="#9CA3AF" />
                <Text style={styles.smallText}>{h.distance} away</Text>
              </View>

              <View style={styles.row}>
                <Bed size={14} color="#9CA3AF" />
                <Text style={styles.smallText}>
                  {h.beds} beds available
                </Text>

                <View
                  style={[
                    styles.availability,
                    h.available ? styles.available : styles.limited,
                  ]}
                >
                  <Text style={styles.availabilityText}>
                    {h.available ? 'Available' : 'Limited'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <NavItem icon={Home} label="Home" active navigation={navigation} screen="Home" />
        <NavItem icon={Calendar} label="Bookings" navigation={navigation} screen="BookAmbulance" />
        <NavItem icon={Navigation} label="Track" navigation={navigation} screen="Track" />
        <NavItem icon={User} label="Profile" navigation={navigation} screen="Profile" />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  locationText: { color: '#fff', fontWeight: '600' },

  bellWrapper: { position: 'relative' },

  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },

  sosContainer: { alignItems: 'center', marginVertical: 20, marginTop: 50 },

  sosWrapper: { alignItems: 'center', justifyContent: 'center' },

  sosOuterPulse: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF3B30',
  },

  sosInnerPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
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
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  sosText: { color: '#fff', fontSize: 22, fontWeight: '700' },

  sosSub: { color: '#fff', fontSize: 12 },

  statusWrapper: { alignItems: 'center', marginBottom: 20, marginTop: 20 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 6,
  },

  statusText: { color: '#34C759', fontSize: 12 },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 24,
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  card: {
    width: '48%',
    backgroundColor: '#141929',
    borderRadius: 12,
    padding: 12,
  },

  iconBox: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 13 },

  cardDesc: { color: '#9CA3AF', fontSize: 11 },

  cardPrice: { color: '#34C759', fontSize: 11, marginTop: 4 },

  hospitalCard: {
    backgroundColor: '#141929',
    borderRadius: 12,
    padding: 12,
    width: 260,
    marginLeft: 16,
  },

  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  hospitalName: { color: '#fff', fontWeight: '600', fontSize: 13 },

  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  ratingText: { color: '#fff', fontSize: 11 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },

  smallText: { color: '#9CA3AF', fontSize: 11 },

  availability: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  available: { backgroundColor: 'rgba(52,199,89,0.1)' },

  limited: { backgroundColor: 'rgba(255,59,48,0.1)' },

  availabilityText: { fontSize: 10, color: '#fff' },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141929',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
});