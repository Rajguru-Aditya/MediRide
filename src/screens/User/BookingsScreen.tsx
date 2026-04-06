import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const BookingsScreen = () => {
  const insets = useSafeAreaInsets();

  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth().currentUser;

    if (!currentUser) return;

    // 🔥 Real-time listener
    const unsubscribe = firestore()
      .collection('rides')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const list: any[] = [];

          snapshot.forEach(doc => {
            list.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          setRides(list);
          setLoading(false);
        },
        error => {
          console.log('BOOKINGS ERROR:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'searching':
        return '#FFB800';
      case 'accepted':
        return '#34C759';
      case 'en_route':
        return '#007AFF';
      case 'completed':
        return '#8E8E93';
      default:
        return '#9CA3AF';
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {/* Top Row */}
      <View style={styles.rowBetween}>
        <Text style={styles.hospital}>{item.drop?.hospitalName}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>

      {/* Pickup */}
      <Text style={styles.label}>Pickup</Text>
      <Text style={styles.value}>{item.pickup?.address}</Text>

      {/* Ambulance */}
      <Text style={styles.label}>Ambulance</Text>
      <Text style={styles.value}>{item.ambulanceTypeLabel}</Text>

      {/* Price */}
      <View style={styles.rowBetween}>
        <Text style={styles.price}>{item.fareEstimate}</Text>
        <Text style={styles.date}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleString()
            : '...'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>My Bookings</Text>

        {rides.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No bookings yet 🚑
            </Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default BookingsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },

  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    color: '#9CA3AF',
  },

  card: {
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E2540',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hospital: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  status: {
    fontSize: 12,
    fontWeight: '600',
  },

  label: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 8,
  },

  value: {
    color: '#fff',
    marginTop: 2,
  },

  price: {
    color: '#FF3B30',
    fontWeight: '700',
    marginTop: 10,
  },

  date: {
    color: '#6B7280',
    fontSize: 10,
  },
});