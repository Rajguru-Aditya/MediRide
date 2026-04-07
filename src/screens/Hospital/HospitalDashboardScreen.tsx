import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Home, User } from 'lucide-react-native';

const HospitalDashboardScreen = ({navigation}:any) => {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hospitalName, setHospitalName] = useState('');
  const [location, setLocation] = useState('');

  const [totalBeds, setTotalBeds] = useState('');
  const [availableBeds, setAvailableBeds] = useState('');
  const [icuBeds, setIcuBeds] = useState('');
  const [doctors, setDoctors] = useState('');

  const [emergencyAvailable, setEmergencyAvailable] = useState(true);

  const uid = auth().currentUser?.uid;

  // 🔥 Load hospital data
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(doc => {
        const data = doc.data();
        if (!data) return;

        setHospitalName(data.hospitalName || '');
        setLocation(data.location || '');

        setTotalBeds(String(data.totalBeds || ''));
        setAvailableBeds(String(data.availableBeds || ''));
        setIcuBeds(String(data.icuBeds || ''));
        setDoctors(String(data.doctorCount || ''));

        setEmergencyAvailable(data.emergencyAvailable ?? true);

        setLoading(false);
      });

    return unsubscribe;
  }, [uid]);

  // 🔥 Save data
  const handleSave = async () => {
    if (!uid) return;

    try {
      setSaving(true);

      await firestore().collection('users').doc(uid).update({
        totalBeds: Number(totalBeds) || 0,
        availableBeds: Number(availableBeds) || 0,
        icuBeds: Number(icuBeds) || 0,
        doctorCount: Number(doctors) || 0,
        emergencyAvailable,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    } catch (e) {
      console.log('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (val: string) => void
  ) => (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#6B7280"
        style={styles.input}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#FF3B30" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Text style={styles.title}>Hospital Dashboard</Text>
        <Text style={styles.subtitle}>{hospitalName}</Text>
        <Text style={styles.location}>{location}</Text>

        {/* Stats Card */}
        <View style={styles.card}>

          {renderInput('Total Beds', totalBeds, setTotalBeds)}
          {renderInput('Available Beds', availableBeds, setAvailableBeds)}
          {renderInput('ICU Beds', icuBeds, setIcuBeds)}
          {renderInput('Doctors Available', doctors, setDoctors)}

          {/* Emergency Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Emergency Availability</Text>

            <Pressable
              onPress={() => setEmergencyAvailable(!emergencyAvailable)}
              style={[
                styles.toggle,
                emergencyAvailable && { backgroundColor: '#34C759' },
              ]}
            >
              <View
                style={[
                  styles.toggleCircle,
                  {
                    transform: [
                      { translateX: emergencyAvailable ? 22 : 2 },
                    ],
                  },
                ]}
              />
            </Pressable>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
    <View style={styles.bottomBar}>
        <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('HospitalDashboard')}
        >
            <Home size={20} color="#FF3B30" />
            <Text style={[styles.tabText, { color: '#FF3B30' }]}>Home</Text>
        </Pressable>

        <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Profile')}
        >
            <User size={20} color="#8A8FA8" />
            <Text style={styles.tabText}>Profile</Text>
        </Pressable>
    </View>
    </View>
  );
};

export default HospitalDashboardScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F2C',
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F2C',
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  subtitle: {
    color: '#FF3B30',
    marginTop: 6,
    fontWeight: '600',
  },

  location: {
    color: '#8A8FA8',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#141929',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  inputBlock: {
    marginBottom: 14,
  },

  label: {
    color: '#D1D5DB',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#0A0F2C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  toggle: {
    width: 50,
    height: 26,
    borderRadius: 20,
    backgroundColor: '#1E2440',
    justifyContent: 'center',
  },

  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 40,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#141929',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E2540',
  },
  
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  
  tabText: {
    fontSize: 12,
    color: '#8A8FA8',
  },
});