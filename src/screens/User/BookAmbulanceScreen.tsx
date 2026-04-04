import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Sparkles,
  Heart,
  Car,
  Flame,
  Bone,
  Wind,
  Baby,
  Droplet,
  Zap,
  AlertCircle,
  Activity,
} from 'lucide-react-native';
import { Input } from '../../components/Input';

const BookAmbulanceScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [severity, setSeverity] = useState<'critical' | 'moderate' | 'stable'>('critical');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  const emergencyConditions = [
    { id: 'accident', icon: Car, label: 'Accident' },
    { id: 'heart', icon: Heart, label: 'Heart Attack' },
    { id: 'stroke', icon: Activity, label: 'Stroke' },
    { id: 'fire', icon: Flame, label: 'Fire Injury' },
    { id: 'fracture', icon: Bone, label: 'Fracture' },
    { id: 'breathing', icon: Wind, label: 'Breathing Issue' },
    { id: 'pregnancy', icon: Baby, label: 'Pregnancy' },
    { id: 'poisoning', icon: Droplet, label: 'Poisoning' },
    { id: 'drowning', icon: Droplet, label: 'Drowning' },
    { id: 'seizure', icon: Zap, label: 'Seizure' },
    { id: 'chest', icon: Heart, label: 'Chest Pain' },
    { id: 'other', icon: AlertCircle, label: 'Other' },
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

          <Text style={styles.title}>Book Ambulance</Text>
          <Text style={styles.subtitle}>Fill emergency details</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepRow}>
            {['Details', 'Hospital', 'Confirm'].map((step, index) => (
                <React.Fragment key={index}>
                
                {/* Step */}
                <View style={styles.stepItem}>
                    <View
                    style={[
                        styles.stepCircle,
                        index === 0 && styles.activeStep,
                    ]}
                    >
                    <Text style={{ color: '#fff' }}>{index + 1}</Text>
                    </View>

                    <Text
                    style={[
                        styles.stepText,
                        index === 0 && { color: '#fff' },
                    ]}
                    >
                    {step}
                    </Text>
                </View>

                {/* Connector Line (only between items) */}
                {index !== 2 && <View style={styles.stepLine} />}
                </React.Fragment>
            ))}
            </View>

        {/* Form */}
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Patient Name */}
          <Input label="Patient Name" placeholder="Enter patient name" />

          {/* Patient Age */}
          <Input label="Patient Age" placeholder="Enter age" keyboardType="numeric" />

          {/* Severity */}
          <Text style={styles.label}>Emergency Severity</Text>
          <View style={styles.severityRow}>
            {renderSeverity('critical', 'Critical', '#FF3B30')}
            {renderSeverity('moderate', 'Moderate', '#FFB800')}
            {renderSeverity('stable', 'Stable', '#34C759')}
          </View>

          {/* Conditions */}
          <Text style={styles.label}>Emergency Condition</Text>
          <View style={styles.grid}>
            {emergencyConditions.map((c) => {
              const Icon = c.icon;

              const active = selectedCondition === c.id;

              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCondition(c.id)}
                  style={[
                    styles.conditionCard,
                    active && styles.conditionActive,
                  ]}
                >
                  <Icon color={active ? '#fff' : '#9CA3AF'} size={20} />
                  <Text style={[
                    styles.conditionText,
                    active && { color: '#fff' }
                  ]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Pickup */}
          <Text style={styles.label}>Pickup Location</Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={18} color="#9CA3AF" />
            <TextInput
              value="Current Location (Bandra West)"
              style={styles.inputText}
              editable={false}
            />
          </View>

          {/* Hospital */}
          <Text style={styles.label}>Destination Hospital</Text>
          <View style={styles.inputWithIcon}>
            <Sparkles size={18} color="#FFB800" />
            <Text style={styles.inputText}>
              AI Recommended - Lilavati Hospital
            </Text>
          </View>

          <Text style={styles.helperText}>
            AI selected based on distance, availability & patient condition
          </Text>

          {/* CTA */}
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Find Available Ambulances</Text>
          </Pressable>

        </ScrollView>
      </View>
    </SafeAreaView>
  );

  // 🔥 helper inside component
  function renderSeverity(type: any, label: string, color: string) {
    const active = severity === type;

    return (
      <Pressable
        onPress={() => setSeverity(type)}
        style={[
          styles.severityBtn,
          active && { backgroundColor: color }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
          <Text style={{ color: active ? '#fff' : '#9CA3AF' }}>{label}</Text>
        </View>
      </Pressable>
    );
  }
};

export default BookAmbulanceScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  
    container: { flex: 1, paddingHorizontal: 24 },
  
    header: { marginBottom: 20 },
  
    back: { color: '#9CA3AF', marginBottom: 10 },
  
    title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  
    subtitle: { color: '#9CA3AF', marginTop: 4 },
  
    stepRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
  
    stepItem: { alignItems: 'center' },
  
    stepCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#141929',
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    activeStep: { backgroundColor: '#FF3B30' },
  
    stepText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 6,
        marginBottom: 20, // aligns with circle center
      },
  
    label: { color: '#D1D5DB', marginBottom: 6 },
  
    input: {
      backgroundColor: '#141929',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: '#fff',
    },
  
    severityRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
  
    severityBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#141929',
      alignItems: 'center',
    },
  
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
  
    conditionCard: {
      width: '30%',
      backgroundColor: '#141929',
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
    },
  
    conditionActive: {
      backgroundColor: '#FF3B30',
    },
  
    conditionText: {
      fontSize: 10,
      color: '#9CA3AF',
      marginTop: 4,
      textAlign: 'center',
    },
  
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#141929',
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
  
    inputText: { color: '#fff', flex: 1 },
  
    helperText: {
      color: '#9CA3AF',
      fontSize: 11,
      marginBottom: 20,
    },
  
    button: {
      backgroundColor: '#FF3B30',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginBottom: 30,
    },
  
    buttonText: { color: '#fff', fontWeight: '600' },
  });