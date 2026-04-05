import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Activity, Heart, Truck } from 'lucide-react-native';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';

const ConfirmationScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const createRide = async () => {
    try {
      const rideRef = await addDoc(collection(db, 'rides'), {
        userId: 'user_123',
  
        patientName: 'Rahul Sharma',
        patientAge: 45,
        condition: 'heart',
        severity: 'critical',
  
        pickup: {
          address: 'Bandra West',
          lat: 19.0596,
          lng: 72.8295,
        },
  
        drop: {
          hospitalId: 'lilavati',
          hospitalName: 'Lilavati Hospital',
        },
  
        driverId: null,
        status: 'searching',
  
        fareEstimate: 2800,
        createdAt: serverTimestamp(),
      });
  
      console.log('Ride created:', rideRef.id);
  
      navigation.replace('Home');
  
    } catch (error) {
      console.log('CREATE RIDE ERROR:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Confirm Booking</Text>
          <Text style={styles.subtitle}>Review before dispatch</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Patient Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Patient Details</Text>

            <Text style={styles.cardText}>Name: Rahul Sharma</Text>
            <Text style={styles.cardText}>Age: 45</Text>

            <View style={styles.row}>
              <Activity size={14} color="#FF3B30" />
              <Text style={styles.highlight}>Critical Condition</Text>
            </View>
          </View>

          {/* Condition */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Emergency</Text>

            <View style={styles.row}>
              <Heart size={16} color="#FF3B30" />
              <Text style={styles.cardText}>Heart Attack</Text>
            </View>
          </View>

          {/* Hospital */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Destination Hospital</Text>

            <Text style={styles.cardText}>Lilavati Hospital</Text>

            <View style={styles.row}>
              <MapPin size={14} color="#9CA3AF" />
              <Text style={styles.cardSub}>2.3 km away</Text>
            </View>
          </View>

          {/* Ambulance */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ambulance Type</Text>

            <View style={styles.row}>
              <Truck size={16} color="#34C759" />
              <Text style={styles.cardText}>ALS Ambulance</Text>
            </View>

            <Text style={styles.cardSub}>Advanced Life Support</Text>
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Estimated Cost</Text>
            <Text style={styles.price}>₹2,800</Text>
          </View>

        </ScrollView>

        {/* CTA */}
        <Pressable
          style={styles.button}
          onPress={createRide}
        >
          <Text style={styles.buttonText}>Confirm & Dispatch Ambulance</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
};

export default ConfirmationScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  
    container: { flex: 1, paddingHorizontal: 24 },
  
    header: { marginBottom: 20 },
  
    back: { color: '#9CA3AF', marginBottom: 10 },
  
    title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  
    subtitle: { color: '#9CA3AF', marginTop: 4 },
  
    card: {
      backgroundColor: '#141929',
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
  
    cardTitle: {
      color: '#fff',
      fontWeight: '600',
      marginBottom: 8,
    },
  
    cardText: {
      color: '#fff',
      marginBottom: 4,
    },
  
    cardSub: {
      color: '#9CA3AF',
      fontSize: 12,
    },
  
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
  
    highlight: {
      color: '#FF3B30',
      fontWeight: '600',
    },
  
    priceCard: {
      backgroundColor: 'rgba(255,59,48,0.1)',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginVertical: 10,
    },
  
    priceLabel: {
      color: '#9CA3AF',
      fontSize: 12,
    },
  
    price: {
      color: '#FF3B30',
      fontSize: 22,
      fontWeight: '700',
      marginTop: 4,
    },
  
    button: {
      backgroundColor: '#FF3B30',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginVertical: 10,
    },
  
    buttonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });