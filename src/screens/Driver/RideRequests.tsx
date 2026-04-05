import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Activity } from 'lucide-react-native';

const RideRequests = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

        <Text style={styles.title}>Incoming Request</Text>

        {/* Request Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient: Rahul Sharma</Text>

          <View style={styles.row}>
            <Activity size={14} color="#FF3B30" />
            <Text style={styles.highlight}>Critical - Heart Attack</Text>
          </View>

          <View style={styles.row}>
            <MapPin size={14} color="#9CA3AF" />
            <Text style={styles.subText}>2.5 km away</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable style={styles.reject}>
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>

          <Pressable style={styles.accept}>
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default RideRequests;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 24 },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  cardTitle: { color: '#fff', fontWeight: '600' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },

  subText: { color: '#9CA3AF' },

  highlight: {
    color: '#FF3B30',
    fontWeight: '600',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  reject: {
    flex: 1,
    backgroundColor: '#141929',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  rejectText: { color: '#FF3B30', fontWeight: '600' },

  accept: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  acceptText: { color: '#fff', fontWeight: '600' },
});