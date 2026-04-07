import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, StatusBar, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, MapPin, Bed, Navigation } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';


// All hospitals hardcoded — swap with Firestore fetch later
// const HOSPITALS = [
//   {
//     id: 'lilavati',
//     name: 'Lilavati Hospital',
//     distance: '2.3 km',
//     beds: 12,
//     icuBeds: 4,
//     rating: 4.8,
//     recommended: true,
//     type: 'ALS Ambulance',
//     fare: '₹2,500 - ₹3,500',
//   },
//   {
//     id: 'breach',
//     name: 'Breach Candy Hospital',
//     distance: '3.7 km',
//     beds: 8,
//     icuBeds: 2,
//     rating: 4.6,
//     recommended: false,
//     type: 'BLS Ambulance',
//     fare: '₹1,200 - ₹1,800',
//   },
//   {
//     id: 'jaslok',
//     name: 'Jaslok Hospital',
//     distance: '4.1 km',
//     beds: 3,
//     icuBeds: 1,
//     rating: 4.7,
//     recommended: false,
//     type: 'ALS Ambulance',
//     fare: '₹2,500 - ₹3,500',
//   },
//   {
//     id: 'kokilaben',
//     name: 'Kokilaben Hospital',
//     distance: '5.2 km',
//     beds: 15,
//     icuBeds: 6,
//     rating: 4.9,
//     recommended: false,
//     type: 'ICU Ambulance',
//     fare: '₹4,000 - ₹6,000',
//   },
//   {
//     id: 'hinduja',
//     name: 'Hinduja Hospital',
//     distance: '6.0 km',
//     beds: 10,
//     icuBeds: 3,
//     rating: 4.5,
//     recommended: false,
//     type: 'BLS Ambulance',
//     fare: '₹1,200 - ₹1,800',
//   },
// ];

const HospitalSelectionScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();

  // ── Receive everything from step 1 ──
  const {
    patientName,
    patientAge,
    severity,
    condition,
    ambulanceType,
    pickupLabel,
    coords,
  } = route.params ?? {};

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .where('role', '==', 'hospital')
      .onSnapshot(snapshot => {
        const list: any[] = [];
  
        snapshot.forEach(doc => {
          const data = doc.data();
  
          list.push({
            id: doc.id,
            name: data.hospitalName,
            beds: data.availableBeds || 0,
            icuBeds: data.icuBeds || 0,
            doctors: data.doctorCount || 0,
            emergencyAvailable: data.emergencyAvailable ?? true,
  
            // Temporary placeholders (we’ll improve later)
            distance: '2-5 km',
            rating: 4.5,
            recommended: data.emergencyAvailable && (data.availableBeds > 20), // simple logic
            type: 'ALS Ambulance',
            fare: '₹1500 - ₹3000',
          });
        });
  
        setHospitals(list);
        setLoadingHospitals(false);
      });
  
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hospitals.length > 0 && !selectedId) {
      setSelectedId(hospitals[0].id);
    }
  }, [hospitals]);

  const handleConfirm = () => {
    const hospital = hospitals.find(h => h.id === selectedId);
    if (!hospital) return Alert.alert('Select a hospital first');

    // Pass the full booking data to ConfirmationScreen
    navigation.navigate('ConfirmationScreen', {
      patientName,
      patientAge,
      severity,
      condition,
      ambulanceType,
      pickupLabel,
      coords,
      hospital,
    });
  };

  const recommended = hospitals.filter(h => h.recommended);
  const others = hospitals.filter(h => !h.recommended);

  if (loadingHospitals) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size={"small"} color={"#fff"} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Select Hospital</Text>
          <Text style={styles.subtitle}>Choose best option for patient</Text>
        </View>

        {/* Step Indicator — step 2 active */}
        <View style={styles.stepRow}>
          {['Details', 'Hospital', 'Confirm'].map((step, index) => (
            <React.Fragment key={index}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, index === 1 && styles.activeStep]}>
                  <Text style={{ color: '#fff' }}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, index === 1 && { color: '#fff' }]}>{step}</Text>
              </View>
              {index !== 2 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

        {/* Patient summary pill */}
        <View style={styles.summaryPill}>
          <Text style={styles.summaryText}>
            {patientName}, {patientAge} yrs · 
            <Text style={{ color: severity === 'critical' ? '#FF3B30' : severity === 'moderate' ? '#FFB800' : '#34C759' }}>
              {' '}{severity?.charAt(0).toUpperCase() + severity?.slice(1)}
            </Text>
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* AI Recommended */}
          {recommended.map((hospital) => (
            <Pressable
              key={hospital.id}
              onPress={() => setSelectedId(hospital.id)}
              style={[styles.recommendedCard, selectedId === hospital.id && styles.selectedCard]}
            >
              <View style={styles.recommendedBadge}>
                <Star size={12} color="#FFB800" fill="#FFB800" />
                <Text style={styles.recommendedText}>AI Recommended</Text>
              </View>
              <View style={styles.cardHeader}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{hospital.rating}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <MapPin size={13} color="#9CA3AF" />
                <Text style={styles.smallText}>{hospital.distance}</Text>
                <Bed size={13} color="#9CA3AF" style={{ marginLeft: 10 }} />
                <Text style={styles.smallText}>{hospital.beds} beds · {hospital.icuBeds} ICU</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Ambulance: </Text>
                <Text style={styles.fareType}>{hospital.type}</Text>
                <Text style={styles.fareAmount}> · {hospital.fare}</Text>
              </View>
            </Pressable>
          ))}

          <Text style={styles.sectionTitle}>Nearby Options</Text>

          {others.map((hospital) => (
            <Pressable
              key={hospital.id}
              onPress={() => setSelectedId(hospital.id)}
              style={[styles.card, selectedId === hospital.id && styles.selectedCard]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{hospital.rating}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Navigation size={13} color="#9CA3AF" />
                <Text style={styles.smallText}>{hospital.distance}</Text>
                <Bed size={13} color="#9CA3AF" style={{ marginLeft: 10 }} />
                <Text style={styles.smallText}>{hospital.beds} beds · {hospital.icuBeds} ICU</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Ambulance: </Text>
                <Text style={styles.fareType}>{hospital.type}</Text>
                <Text style={styles.fareAmount}> · {hospital.fare}</Text>
              </View>
            </Pressable>
          ))}

        </ScrollView>

        <Pressable style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm Hospital</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
};

export default HospitalSelectionScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginBottom: 16 },
  back: { color: '#9CA3AF', marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#9CA3AF', marginTop: 4 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#141929', justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: '#FF3B30' },
  stepText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 6, marginBottom: 20 },
  summaryPill: {
    backgroundColor: '#141929',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2540',
  },
  summaryText: { color: '#fff', fontSize: 12 },
  recommendedCard: { backgroundColor: '#141929', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFB800' },
  recommendedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  recommendedText: { color: '#FFB800', fontSize: 12 },
  card: { backgroundColor: '#141929', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  selectedCard: { borderColor: '#FF3B30' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hospitalName: { color: '#fff', fontWeight: '600', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#FFB800', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  smallText: { color: '#9CA3AF', fontSize: 12 },
  fareRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  fareLabel: { color: '#8A8FA8', fontSize: 11 },
  fareType: { color: '#fff', fontSize: 11, fontWeight: '600' },
  fareAmount: { color: '#34C759', fontSize: 11 },
  sectionTitle: { color: '#fff', fontWeight: '600', marginBottom: 10, marginTop: 4 },
  button: { backgroundColor: '#FF3B30', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
});