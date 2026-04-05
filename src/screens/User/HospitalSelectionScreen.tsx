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
import { Star, MapPin, Bed, Navigation } from 'lucide-react-native';

const HospitalSelectionScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [selectedHospital, setSelectedHospital] = useState('lilavati');

  const hospitals = [
    {
      id: 'lilavati',
      name: 'Lilavati Hospital',
      distance: '2.3 km',
      beds: 12,
      rating: 4.8,
      recommended: true,
    },
    {
      id: 'breach',
      name: 'Breach Candy Hospital',
      distance: '3.7 km',
      beds: 8,
      rating: 4.6,
    },
    {
      id: 'jaslok',
      name: 'Jaslok Hospital',
      distance: '4.1 km',
      beds: 3,
      rating: 4.7,
    },
  ];

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

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* AI Recommended */}
          {hospitals
            .filter((h) => h.recommended)
            .map((hospital) => (
              <Pressable
                key={hospital.id}
                onPress={() => setSelectedHospital(hospital.id)}
                style={[
                  styles.recommendedCard,
                  selectedHospital === hospital.id && styles.selectedCard,
                ]}
              >
                <View style={styles.recommendedBadge}>
                  <Star size={12} color="#FFB800" />
                  <Text style={styles.recommendedText}>AI Recommended</Text>
                </View>

                <Text style={styles.hospitalName}>{hospital.name}</Text>

                <View style={styles.row}>
                  <MapPin size={14} color="#9CA3AF" />
                  <Text style={styles.smallText}>{hospital.distance}</Text>
                </View>

                <View style={styles.row}>
                  <Bed size={14} color="#9CA3AF" />
                  <Text style={styles.smallText}>
                    {hospital.beds} beds available
                  </Text>
                </View>
              </Pressable>
            ))}

          {/* Nearby Hospitals */}
          <Text style={styles.sectionTitle}>Nearby Options</Text>

          {hospitals
            .filter((h) => !h.recommended)
            .map((hospital) => (
              <Pressable
                key={hospital.id}
                onPress={() => setSelectedHospital(hospital.id)}
                style={[
                  styles.card,
                  selectedHospital === hospital.id && styles.selectedCard,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>

                  <View style={styles.rating}>
                    <Star size={12} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>{hospital.rating}</Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Navigation size={14} color="#9CA3AF" />
                  <Text style={styles.smallText}>{hospital.distance}</Text>
                </View>

                <View style={styles.row}>
                  <Bed size={14} color="#9CA3AF" />
                  <Text style={styles.smallText}>
                    {hospital.beds} beds available
                  </Text>
                </View>
              </Pressable>
            ))}
        </ScrollView>

        {/* CTA */}
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('ConfirmationScreen')}
        >
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
  
    header: { marginBottom: 20 },
  
    back: { color: '#9CA3AF', marginBottom: 10 },
  
    title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  
    subtitle: { color: '#9CA3AF', marginTop: 4 },
  
    recommendedCard: {
      backgroundColor: '#141929',
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#FFB800',
    },
  
    recommendedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
  
    recommendedText: { color: '#FFB800', fontSize: 12 },
  
    sectionTitle: {
      color: '#fff',
      fontWeight: '600',
      marginBottom: 10,
    },
  
    card: {
      backgroundColor: '#141929',
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: 'transparent',
    },
  
    selectedCard: {
      borderWidth: 1,
      borderColor: '#FF3B30',
    },
  
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  
    hospitalName: { color: '#fff', fontWeight: '600' },
  
    rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  
    ratingText: { color: '#fff', fontSize: 12 },
  
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
  
    smallText: { color: '#9CA3AF', fontSize: 12 },
  
    button: {
      backgroundColor: '#FF3B30',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginVertical: 10,
    },
  
    buttonText: { color: '#fff', fontWeight: '600' },
  });