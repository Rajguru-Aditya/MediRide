import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ActiveRideScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const pingAnim = useRef(new Animated.Value(1)).current;

  // Ping animation (driver location)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View style={{ flex: 1 }}>

        {/* 🚨 Top Status */}
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>🚑 EN ROUTE TO PICKUP</Text>
          </View>
        </View>

        {/* 🗺️ Map Area */}
        <View style={styles.map}>

          {/* Route Line (simulated) */}
          <View style={styles.routeLine} />

          {/* Driver Location */}
          <View style={styles.driverPinWrapper}>
            <Animated.View
              style={[
                styles.ping,
                {
                  transform: [{ scale: pingAnim }],
                  opacity: 0.3,
                },
              ]}
            />
            <View style={styles.driverPin} />
          </View>

          {/* Destination */}
          <View style={styles.destinationPin} />

          {/* ETA Box */}
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ETA to Pickup</Text>
            <Text style={styles.eta}>6 mins</Text>
          </View>
        </View>

        {/* 📦 Bottom Sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.handle} />

          {/* Patient */}
          <View style={styles.patientRow}>
            <View style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>M</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.patientText}>Patient: Male, 34</Text>

              <View style={styles.criticalBadge}>
                <Text style={styles.criticalText}>🔴 Critical</Text>
              </View>
            </View>
          </View>

          {/* Destination */}
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>
              Andheri East, Near D-Mart
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.smallLabel}>ETA</Text>
              <Text style={styles.bigText}>6 mins</Text>
            </View>

            <View style={styles.dividerVertical} />

            <View>
              <Text style={styles.smallLabel}>Distance</Text>
              <Text style={styles.midText}>1.2 km</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.callBtn}>
              <Text style={styles.callText}>📞 Call</Text>
            </Pressable>

            <Pressable style={styles.navBtn}>
              <Text style={styles.navText}>Navigate</Text>
            </Pressable>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            <Text style={styles.green}>● Hospital notified</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.green}>● Bed reserved</Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default ActiveRideScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  
    topBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      zIndex: 10,
    },
  
    statusBadge: {
      backgroundColor: '#FF3B30',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 30,
      alignSelf: 'flex-start',
    },
  
    statusText: { color: '#fff', fontWeight: '700' },
  
    map: {
      flex: 1,
      backgroundColor: '#1E2440',
    },
  
    routeLine: {
      position: 'absolute',
      top: '40%',
      left: '20%',
      width: '60%',
      height: 3,
      backgroundColor: '#FF3B30',
      borderRadius: 2,
    },
  
    driverPinWrapper: {
      position: 'absolute',
      bottom: 100,
      left: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    ping: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3B82F6',
    },
  
    driverPin: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#3B82F6',
      borderWidth: 3,
      borderColor: '#fff',
    },
  
    destinationPin: {
      position: 'absolute',
      top: 120,
      right: 80,
      width: 16,
      height: 16,
      backgroundColor: '#FF3B30',
      borderRadius: 8,
    },
  
    etaBox: {
      position: 'absolute',
      top: 80,
      left: 20,
      backgroundColor: '#141929',
      padding: 12,
      borderRadius: 10,
    },
  
    etaLabel: { color: '#9CA3AF', fontSize: 10 },
  
    eta: { color: '#fff', fontSize: 18, fontWeight: '700' },
  
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#141929',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
    },
  
    handle: {
      width: 40,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
    },
  
    patientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
  
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    patientText: { color: '#fff', fontWeight: '600' },
  
    criticalBadge: {
      marginTop: 4,
      backgroundColor: 'rgba(255,59,48,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
  
    criticalText: { color: '#FF3B30', fontSize: 10 },
  
    infoBlock: { marginBottom: 10 },
  
    label: { color: '#9CA3AF', fontSize: 12 },
  
    value: { color: '#fff', fontWeight: '600' },
  
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      marginVertical: 10,
    },
  
    smallLabel: { color: '#9CA3AF', fontSize: 10 },
  
    bigText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  
    midText: { color: '#fff', fontSize: 16 },
  
    dividerVertical: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
  
    callBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
  
    callText: { color: '#fff' },
  
    navBtn: {
      flex: 1,
      backgroundColor: '#FF3B30',
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
  
    navText: { color: '#fff', fontWeight: '700' },
  
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
      gap: 6,
    },
  
    green: { color: '#34C759', fontSize: 12 },
  
    dot: { color: 'rgba(255,255,255,0.3)' },
  });