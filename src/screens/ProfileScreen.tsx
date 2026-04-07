import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ProfileScreen = ({ navigation, setUser, setRole }: any) => {
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch user data from Firestore
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth().currentUser;

        if (!currentUser) return;

        const doc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();

        
        const data = doc.data();
        setUserData(data);
        setRole(data?.role); // keep role synced globally

      } catch (error) {
        console.log('PROFILE ERROR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 🔥 Logout
  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setRole(null);
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
    }
  };

  const getInitial = () => {
    if (!userData?.fullName && !userData?.hospitalName) return '?';
    if(userData?.hospitalName){
      return userData.hospitalName.charAt(0).toUpperCase();
    } else {
      return userData.fullName.charAt(0).toUpperCase();
    }
  };

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

      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <Text style={styles.title}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitial()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>
            {userData?.fullName || userData?.hospitalName || 'N/A'}
          </Text>
          
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>
            {userData?.email || 'N/A'}
          </Text>

          {
            userData?.role !== "hospital" && (
              <>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>
                  {userData?.phoneNumber || 'N/A'}
                </Text>
              </>
            )
          }

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>
            {userData?.role
              ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
              : 'N/A'}
          </Text>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },

  card: {
    width: '100%',
    backgroundColor: '#141929',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  label: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 10,
  },

  value: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },

  logoutBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
});