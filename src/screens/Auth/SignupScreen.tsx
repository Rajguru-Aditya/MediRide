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
import { Camera, AlertTriangle } from 'lucide-react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignupScreen = ({ navigation, setUser, setRole }: any) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'consumer' | 'provider' | 'hospital'>('consumer');
  const [hasInsurance, setHasInsurance] = useState(false);

  // 🔥 Required fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔹 Optional fields
  const [aadhaar, setAadhaar] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [customerRole, setCustomerRole] = useState<'user' | 'driver' | 'hospital'>('user');

  // 🔥 Reusable Input
  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    setValue: (text: string) => void,
    keyboardType: any = 'default',
    secure: boolean = false
  ) => (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        style={styles.input}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        secureTextEntry={secure}
      />
    </View>
  );

  // 🔥 Signup Handler
  const handleSignup = async () => {
    try {
      if (!fullName || !phone || !email || !password) {
        console.log('Please fill all required fields');
        return;
      }
  
      if (!customerRole) {
        console.log('Please select a role');
        return;
      }
  
      // 🔐 Create user
      const userCredential = await auth().createUserWithEmailAndPassword(
        email.trim(),
        password
      );
  
      const user = userCredential.user;
  
      // 🗄️ Save in Firestore
      await firestore().collection('users').doc(user.uid).set({
        fullName,
        phoneNumber: phone,
        email: email.trim(),
        aadhaar,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
        },
        hasInsurance,
        role: customerRole,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  
      // 🔥 THIS IS THE IMPORTANT PART
      setUser(user);
      setRole(customerRole);
  
      // ❌ REMOVE THIS
      // navigation.replace('Home');
  
    } catch (error: any) {
      console.log('Signup error:', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join MediRide today</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabWrapper}>
        {['user', 'driver', 'hospital'].map((tab: any) => (
            <Pressable
              key={tab}
              onPress={() => setCustomerRole(tab)}
              style={[
                styles.tab,
                customerRole === tab && styles.activeTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  customerRole === tab && styles.activeTabText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Profile */}
          <View style={styles.profileContainer}>
            <View style={styles.profileCircle}>
              <Camera color="#6B7280" size={28} />
              <View style={styles.addBtn}>
                <Text style={{ color: '#fff' }}>+</Text>
              </View>
            </View>
          </View>

          {/* 🔥 REQUIRED FIELDS */}
          {renderInput('Full Name *', 'Enter your full name', fullName, setFullName)}

          {renderInput('Phone Number *', 'Enter mobile number', phone, setPhone, 'phone-pad')}

          {renderInput('Email *', 'Enter your email', email, setEmail, 'email-address')}

          {renderInput('Password *', 'Enter password', password, setPassword, 'default', true)}

          {/* OPTIONAL */}
          {renderInput('Aadhaar / PAN Number', 'Enter Aadhaar or PAN', aadhaar, setAadhaar)}

          {renderInput('Emergency Contact Name', 'Enter contact name', emergencyName, setEmergencyName)}

          {renderInput('Emergency Contact Number', 'Enter contact number', emergencyPhone, setEmergencyPhone, 'phone-pad')}

          {/* Insurance */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Health Insurance</Text>

              <Pressable
                onPress={() => setHasInsurance(!hasInsurance)}
                style={[
                  styles.toggle,
                  hasInsurance && { backgroundColor: '#34C759' },
                ]}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    { transform: [{ translateX: hasInsurance ? 22 : 2 }] },
                  ]}
                />
              </Pressable>
            </View>

            {hasInsurance && (
              <View style={styles.input}>
                <Text style={{ color: '#6B7280' }}>
                  Insurance provider (dropdown later)
                </Text>
              </View>
            )}
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <AlertTriangle color="#FFB800" size={18} />
            <Text style={styles.warningText}>
              False emergency requests may result in penalties
            </Text>
          </View>

          {/* CTA */}
          <Pressable style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Create Account</Text>
          </Pressable>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#0A0F2C',
    },
  
    container: {
      flex: 1,
      paddingHorizontal: 24,
    },
  
    header: {
      marginBottom: 20,
    },
  
    back: {
      color: '#9CA3AF',
      marginBottom: 10,
    },
  
    title: {
      color: '#fff',
      fontSize: 22,
      fontWeight: '700',
    },
  
    subtitle: {
      color: '#9CA3AF',
      marginTop: 4,
    },
  
    tabWrapper: {
      flexDirection: 'row',
      backgroundColor: '#141929',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
  
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
  
    activeTab: {
      backgroundColor: '#FF3B30',
    },
  
    tabText: {
      color: '#9CA3AF',
    },
  
    activeTabText: {
      color: '#fff',
      fontWeight: '600',
    },
  
    profileContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
  
    profileCircle: {
      width: 90,
      height: 90,
      borderRadius: 50,
      backgroundColor: '#141929',
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    addBtn: {
      position: 'absolute',
      bottom: 0,
      right: 10,
      backgroundColor: '#FF3B30',
      borderRadius: 20,
      height: 28,
      width: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    section: {
      marginBottom: 16,
    },
  
    label: {
      color: '#D1D5DB',
      marginBottom: 6,
    },
  
    input: {
      backgroundColor: '#141929',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: '#fff',
    },
  
    phoneRow: {
      flexDirection: 'row',
      gap: 10,
    },
  
    countryCode: {
      backgroundColor: '#141929',
      borderRadius: 12,
      paddingHorizontal: 14,
      justifyContent: 'center',
    },
  
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
  
    warning: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,184,0,0.1)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      gap: 10,
    },
  
    warningText: {
      color: '#FFB800',
      flex: 1,
      fontSize: 12,
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
      fontWeight: '600',
    },
  });