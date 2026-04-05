import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ProfileScreen = ({ navigation, setUser, setRole, role }: any) => {
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    // 🔥 Clear user
    setUser(null);
    setRole(null);
  };

  const switchRole = () => {
    const newRole = role === 'user' ? 'driver' : 'user';
  
    setUser({
      uid: newRole === 'driver' ? 'driver_123' : 'user_123',
    });
  
    setRole(newRole);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

        {/* Header */}
        <Text style={styles.title}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {role === 'driver' ? 'D' : 'U'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>
            {role === 'driver' ? 'Driver' : 'User'}
          </Text>

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value}>
            {role === 'driver' ? 'driver_123' : 'user_123'}
          </Text>
        </View>

        {/* Switch Role */}
        <Pressable style={styles.secondaryBtn} onPress={switchRole}>
          <Text style={styles.secondaryText}>
            Switch to {role === 'driver' ? 'User' : 'Driver'}
          </Text>
        </Pressable>

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
  
    secondaryBtn: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FF3B30',
      alignItems: 'center',
      marginBottom: 12,
    },
  
    secondaryText: {
      color: '#FF3B30',
      fontWeight: '600',
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