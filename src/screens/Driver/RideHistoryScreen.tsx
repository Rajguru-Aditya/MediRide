import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const Filter = ({ label, active }: any) => (
    <View
      style={[
        styles.filter,
        active && { backgroundColor: '#FF3B30' },
      ]}
    >
      <Text style={{ color: active ? '#fff' : '#9CA3AF' }}>{label}</Text>
    </View>
  );

  const RideItem = ({ title, time, route, amount, cancelled }: any) => (
    <View style={[styles.item, cancelled && { opacity: 0.6 }]}>
      <View style={styles.icon}>
        <Text>🚑</Text>
      </View>
  
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={[styles.itemTitle, cancelled && { color: '#9CA3AF' }]}>
            {title}
          </Text>
          <Text style={[styles.amount, cancelled && { color: '#9CA3AF' }]}>
            {amount}
          </Text>
        </View>
  
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.route}>{route}</Text>
  
        {cancelled && (
          <View style={styles.penalty}>
            <Text style={styles.penaltyText}>⚠️ Penalty Applied</Text>
          </View>
        )}
      </View>
    </View>
  );

  const NavItem = ({ label, active, onPress }: any) => (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navText, active && { color: '#FF3B30' }]}>
        {label}
      </Text>
    </Pressable>
  );

const RideHistoryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const weekEarnings = [
    { day: 'Mon', amount: 2100 },
    { day: 'Tue', amount: 1800 },
    { day: 'Wed', amount: 2400 },
    { day: 'Thu', amount: 2000 },
    { day: 'Fri', amount: 2200 },
    { day: 'Sat', amount: 2500 },
    { day: 'Sun', amount: 1200 },
  ];

  const maxEarning = Math.max(...weekEarnings.map(d => d.amount));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.navigate('DriverHome')}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <Text style={styles.title}>Ride History</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.container}>

          {/* Earnings Card */}
          <View style={styles.card}>
            <Text style={styles.subLabel}>This Week</Text>
            <Text style={styles.bigAmount}>₹14,200</Text>
            <Text style={styles.green}>23 rides completed</Text>

            {/* Bar Chart */}
            <View style={styles.chart}>
              {weekEarnings.map((data) => (
                <View key={data.day} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(data.amount / maxEarning) * 100}%`,
                      },
                    ]}
                  />
                  <Text style={styles.day}>{data.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filters}>
            <Filter label="All" active />
            <Filter label="Completed" />
            <Filter label="Cancelled" />
          </View>

          {/* List */}
          <View style={styles.list}>
            <RideItem
              title="Heart Attack • Male, 32"
              time="Apr 5, 3:45 PM"
              route="Andheri East → Kokilaben Hospital"
              amount="₹1,200"
            />

            <RideItem
              title="Fracture • Female, 28"
              time="Apr 5, 1:20 PM"
              route="Bandra West → Lilavati Hospital"
              amount="₹800"
            />

            <RideItem
              title="Breathing Issue • Male, 45"
              time="Apr 5, 11:10 AM"
              route="Powai → Hiranandani Hospital"
              amount="₹600"
            />

            {/* Cancelled */}
            <RideItem
              title="Accident • Male, 29"
              time="Apr 5, 9:30 AM"
              route="Malad → Godrej Hospital"
              amount="₹0"
              cancelled
            />

            <RideItem
              title="Chest Pain • Female, 52"
              time="Apr 4, 6:15 PM"
              route="Goregaon → SRV Hospital"
              amount="₹950"
            />
          </View>

        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <NavItem label="Home" onPress={() => navigation.navigate('DriverHome')} />
        <NavItem label="Requests" onPress={() => navigation.navigate('RideRequests')} />
        <NavItem label="History" active />
        <NavItem label="Profile" />
      </View>
    </SafeAreaView>
  );
};

export default RideHistoryScreen;


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
  
    back: { color: '#fff', fontSize: 20, marginRight: 10 },
  
    title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  
    container: { padding: 20 },
  
    card: {
      backgroundColor: '#141929',
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
    },
  
    subLabel: { color: '#9CA3AF' },
  
    bigAmount: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '700',
    },
  
    green: { color: '#34C759', marginTop: 4 },
  
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 100,
      marginTop: 12,
      gap: 6,
    },
  
    barWrapper: { flex: 1, alignItems: 'center' },
  
    bar: {
      width: '100%',
      backgroundColor: '#FF3B30',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
  
    day: { color: '#9CA3AF', fontSize: 10, marginTop: 4 },
  
    filters: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
  
    filter: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#141929',
    },
  
    list: {
      backgroundColor: '#141929',
      borderRadius: 14,
    },
  
    item: {
      flexDirection: 'row',
      padding: 14,
      borderBottomWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.05)',
    },
  
    icon: {
      width: 40,
      height: 40,
      backgroundColor: 'rgba(255,59,48,0.1)',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
  
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  
    itemTitle: { color: '#fff', fontWeight: '600' },
  
    amount: { color: '#34C759', fontWeight: '600' },
  
    time: { color: '#9CA3AF', fontSize: 12 },
  
    route: { color: '#D1D5DB', fontSize: 12 },
  
    penalty: {
      marginTop: 6,
      backgroundColor: 'rgba(255,184,0,0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
  
    penaltyText: { color: '#FFB800', fontSize: 10 },
  
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#141929',
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
    },
  
    navItem: { alignItems: 'center' },
  
    navText: { color: '#9CA3AF', fontSize: 12 },
  });