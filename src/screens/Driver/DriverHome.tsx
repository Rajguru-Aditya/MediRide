import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Power, Wallet, Activity } from 'lucide-react-native';

const DriverHome = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

        {/* Header */}
        <Text style={styles.title}>Driver Dashboard</Text>

        {/* Online Toggle */}
        <Pressable
          onPress={() => setIsOnline(!isOnline)}
          style={[
            styles.toggle,
            isOnline && styles.toggleActive,
          ]}
        >
          <Power color="#fff" size={20} />
          <Text style={styles.toggleText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </Pressable>

        {/* Earnings */}
        <View style={styles.card}>
          <Wallet color="#34C759" size={20} />
          <Text style={styles.cardTitle}>Today's Earnings</Text>
          <Text style={styles.amount}>₹2,450</Text>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Activity color="#FFB800" size={20} />
          <Text style={styles.cardTitle}>Status</Text>
          <Text style={styles.subText}>
            {isOnline ? 'Waiting for requests' : 'You are offline'}
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('RideRequests')}
          disabled={!isOnline}
        >
          <Text style={styles.buttonText}>View Ride Requests</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
};

export default DriverHome;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 24 },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },

  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141929',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    justifyContent: 'center',
  },

  toggleActive: {
    backgroundColor: '#34C759',
  },

  toggleText: {
    color: '#fff',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  cardTitle: {
    color: '#9CA3AF',
    marginTop: 6,
  },

  amount: {
    color: '#34C759',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },

  subText: {
    color: '#fff',
    marginTop: 4,
  },

  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});