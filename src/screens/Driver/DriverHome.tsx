import React, { useState } from 'react';
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

const DriverHome = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Rajesh K.</Text>

              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified Driver</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Availability Status</Text>

            <Pressable
              onPress={() => setIsOnline(!isOnline)}
              style={[
                styles.toggle,
                isOnline && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleCircle,
                  isOnline && { alignSelf: 'flex-end' },
                ]}
              />
            </Pressable>
          </View>

          <Text
            style={[
              styles.statusText,
              { color: isOnline ? '#34C759' : '#FF3B30' },
            ]}
          >
            {isOnline ? 'You are ONLINE' : 'You are OFFLINE'}
          </Text>

          <Text style={styles.subText}>
            12-hour shift: 8:00 AM - 8:00 PM
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <DriverStatCard value="4" label="Today's Rides" />
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
              <Text style={styles.vehicleNumber}>MH-02 AB 1234</Text>
              <Text style={styles.subText}>Type: BLS Ambulance</Text>

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
          <DriverActivityItem
            title="Male, 32 • Heart Attack"
            time="3:45 PM • 8.2 km"
            amount="₹1,200"
          />
          <DriverActivityItem
            title="Female, 28 • Fracture"
            time="1:20 PM • 5.5 km"
            amount="₹800"
          />
          <DriverActivityItem
            title="Male, 45 • Breathing Issue"
            time="11:10 AM • 3.8 km"
            amount="₹600"
          />
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <DriverNavItem label="Home" active icon={Home} />

        <DriverNavItem
          label="Requests"
          icon={ClipboardList}
          onPress={() => navigation.navigate('RideRequests')}
        />

        <DriverNavItem
          label="RideHistory"
          icon={History}
          onPress={() => navigation.navigate('RideHistory')}
        />

        <DriverNavItem label="Profile" icon={User} onPress={() => navigation.navigate('Profile')} />
      </View>
    </SafeAreaView>
  );
};

export default DriverHome;


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },

  container: { flex: 1, paddingHorizontal: 20 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: { color: '#fff', fontWeight: '600' },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  name: { color: '#fff', fontWeight: '600' },

  verifiedBadge: {
    backgroundColor: 'rgba(52,199,89,0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  verifiedText: { color: '#34C759', fontSize: 10 },

  card: {
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: { color: '#fff', fontWeight: '600' },

  toggle: {
    width: 50,
    height: 26,
    borderRadius: 20,
    backgroundColor: '#1E2440',
    padding: 3,
  },

  toggleActive: {
    backgroundColor: '#34C759',
  },

  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  statusText: { marginTop: 10, fontWeight: '600' },

  subText: { color: '#9CA3AF', marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#141929',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },

  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },

  statLabel: { color: '#9CA3AF', fontSize: 10 },

  ambulanceIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vehicleNumber: { color: '#fff', fontWeight: '600' },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 4,
  },

  activeText: { color: '#34C759', fontSize: 10 },

  sectionTitle: {
    color: '#fff',
    fontWeight: '600',
    marginVertical: 10,
  },

  activityCard: {
    backgroundColor: '#141929',
    borderRadius: 14,
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  activityIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityTitle: { color: '#fff', fontSize: 12 },

  activitySub: { color: '#9CA3AF', fontSize: 10 },

  amount: { color: '#34C759', fontWeight: '600' },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141929',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },

  navItem: { alignItems: 'center' },

  navText: { color: '#9CA3AF', fontSize: 12 },
});