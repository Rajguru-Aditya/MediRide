import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  StatusBar, ScrollView, ActivityIndicator, Alert,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Activity, Heart, Truck, User, Calendar } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CustomAlert from '../../components/CustomAlert';

// Map condition id → human readable label
const CONDITION_LABELS: Record<string, string> = {
  accident:  'Accident',
  heart:     'Heart Attack',
  stroke:    'Stroke',
  fire:      'Fire Injury',
  fracture:  'Fracture',
  breathing: 'Breathing Issue',
  pregnancy: 'Pregnancy',
  poisoning: 'Poisoning',
  drowning:  'Drowning',
  seizure:   'Seizure',
  chest:     'Chest Pain',
  other:     'Other',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF3B30',
  moderate: '#FFB800',
  stable:   '#34C759',
};

const ConfirmationScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');

  // ── All data received from previous screens ──
  const {
    patientName,
    patientAge,
    severity,
    condition,
    ambulanceType,       // ← from BookAmbulanceScreen
    pickupLabel,
    coords,
    hospital,
  } = route.params ?? {};

  // Resolve ambulance label from id
  const AMBULANCE_LABELS: Record<string, string> = {
    bls:       'BLS Ambulance',
    als:       'ALS Ambulance',
    icu:       'ICU Ambulance',
    transport: 'Patient Transport',
  };
  const ambulanceLabel = AMBULANCE_LABELS[ambulanceType] ?? ambulanceType;

  const conditionLabel = CONDITION_LABELS[condition] ?? condition;
  const severityColor  = SEVERITY_COLORS[severity] ?? '#fff';

  const handleAlertClose = () => {
    setAlertVisible(false);
  
    if (alertType === 'success') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const createRide = async () => {
    try {
      setLoading(true);

      const currentUser = auth().currentUser;

      const rideRef = await firestore().collection('rides').add({
        userId:      currentUser?.uid ?? 'anonymous',

        patientName,
        patientAge:  parseInt(patientAge, 10),
        condition,
        severity,

        pickup: {
          address:   pickupLabel,
          latitude:  coords?.latitude  ?? null,
          longitude: coords?.longitude ?? null,
        },

        drop: {
          hospitalId:   hospital.id,
          hospitalName: hospital.name,
          distance:     hospital.distance,
        },

        ambulanceType:      ambulanceType,     // user-selected / suggested
        ambulanceTypeLabel: ambulanceLabel,
        fareEstimate:       hospital.fare,

        driverId: null,
        status:   'searching',  // searching → accepted → en_route → completed

        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log('Ride created:', rideRef.id);

      // Success toast
      // ✅ Show success alert
      setAlertType('success');
      setAlertMessage('Ambulance booked successfully!');
      setAlertVisible(true);

      // setTimeout(() => {
      //   navigation.reset({
      //     index: 0,
      //     routes: [{ name: 'Home' }],
      //   });
      // }, 1000);

    }catch (error) {
      console.log('CREATE RIDE ERROR:', error);
    
      setAlertType('error');
      setAlertMessage('Failed to create booking. Please try again.');
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={handleAlertClose}
      />
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Confirm Booking</Text>
          <Text style={styles.subtitle}>Review before dispatch</Text>
        </View>

        {/* Step Indicator — step 3 active */}
        <View style={styles.stepRow}>
          {['Details', 'Hospital', 'Confirm'].map((step, index) => (
            <React.Fragment key={index}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, index === 2 && styles.activeStep]}>
                  <Text style={{ color: '#fff' }}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, index === 2 && { color: '#fff' }]}>{step}</Text>
              </View>
              {index !== 2 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Patient Details */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <User size={15} color="#FF3B30" />
              <Text style={styles.cardTitle}>Patient Details</Text>
            </View>
            <Text style={styles.cardText}>{patientName}</Text>
            <Text style={styles.cardSub}>Age: {patientAge}</Text>
            <View style={styles.row}>
              <Activity size={14} color={severityColor} />
              <Text style={[styles.highlight, { color: severityColor }]}>
                {severity?.charAt(0).toUpperCase() + severity?.slice(1)} Condition
              </Text>
            </View>
          </View>

          {/* Emergency Condition */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Heart size={15} color="#FF3B30" />
              <Text style={styles.cardTitle}>Emergency</Text>
            </View>
            <Text style={styles.cardText}>{conditionLabel}</Text>
          </View>

          {/* Pickup */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MapPin size={15} color="#FF3B30" />
              <Text style={styles.cardTitle}>Pickup Location</Text>
            </View>
            <Text style={styles.cardText}>{pickupLabel}</Text>
          </View>

          {/* Hospital */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Calendar size={15} color="#FF3B30" />
              <Text style={styles.cardTitle}>Destination Hospital</Text>
            </View>
            <Text style={styles.cardText}>{hospital?.name}</Text>
            <View style={styles.row}>
              <MapPin size={13} color="#9CA3AF" />
              <Text style={styles.cardSub}>{hospital?.distance} away</Text>
            </View>
          </View>

          {/* Ambulance */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Truck size={15} color="#34C759" />
              <Text style={styles.cardTitle}>Ambulance Type</Text>
            </View>
            <Text style={styles.cardText}>{ambulanceLabel}</Text>
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Estimated Cost</Text>
            <Text style={styles.price}>{hospital?.fare}</Text>
          </View>

        </ScrollView>

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={createRide}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm & Dispatch Ambulance</Text>
          )}
        </Pressable>

      </View>
    </SafeAreaView>
  );
};

export default ConfirmationScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginBottom: 16 },
  back: { color: '#9CA3AF', marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#9CA3AF', marginTop: 4 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#141929', justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: '#FF3B30' },
  stepText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 6, marginBottom: 20 },
  card: { backgroundColor: '#141929', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1E2540' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: '600' },
  cardText: { color: '#fff', marginBottom: 4 },
  cardSub: { color: '#9CA3AF', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  highlight: { fontWeight: '600' },
  priceCard: { backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 14, padding: 16, alignItems: 'center', marginVertical: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)' },
  priceLabel: { color: '#9CA3AF', fontSize: 12 },
  price: { color: '#FF3B30', fontSize: 22, fontWeight: '700', marginTop: 4 },
  button: { backgroundColor: '#FF3B30', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
});