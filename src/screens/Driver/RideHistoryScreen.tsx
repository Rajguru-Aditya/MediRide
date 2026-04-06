import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DriverNavItem from '../../components/DriverNavItem';
import { Home, ClipboardList, History, User } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CONDITION_LABELS: Record<string, string> = {
  accident: 'Accident', heart: 'Heart Attack', stroke: 'Stroke',
  fire: 'Fire Injury', fracture: 'Fracture', breathing: 'Breathing Issue',
  pregnancy: 'Pregnancy', poisoning: 'Poisoning', drowning: 'Drowning',
  seizure: 'Seizure', chest: 'Chest Pain', other: 'Other',
};

type FilterType = 'all' | 'completed' | 'cancelled';

const RideHistoryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const currentUser = auth().currentUser;

  const [rides, setRides]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterType>('all');
  const [weekStats, setWeekStats] = useState({ total: 0, count: 0 });

  // ─── Fetch all rides for this driver ─────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = firestore()
      .collection('rides')
      .where('driverId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setRides(all);

        // Week earnings — last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekRides = all.filter((r: any) => {
          const d = r.createdAt?.toDate?.();
          return d && d >= weekAgo && r.status === 'completed';
        });

        const weekTotal = weekRides.reduce((sum: number, r: any) => {
          const match = r.fareEstimate?.match(/[\d,]+/);
          return sum + (match ? parseInt(match[0].replace(',', ''), 10) : 0);
        }, 0);

        setWeekStats({ total: weekTotal, count: weekRides.length });
        setLoading(false);
      }, () => setLoading(false));

    return () => unsub();
  }, [currentUser]);

  // ─── Build weekly bar chart data ──────────────────────────────
  const buildChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    // Last 7 days ordered Mon→Sun ending today
    const ordered = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (today - 6 + i + 7) % 7;
      return { day: days[dayIndex], amount: 0, date: new Date() };
    });

    // Fill actual amounts
    rides.forEach((r: any) => {
      if (r.status !== 'completed') return;
      const date = r.createdAt?.toDate?.();
      if (!date) return;
      const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
      if (diff >= 7) return;
      const idx = 6 - diff;
      const match = r.fareEstimate?.match(/[\d,]+/);
      if (match) ordered[idx].amount += parseInt(match[0].replace(',', ''), 10);
    });

    return ordered;
  };

  const chartData = buildChartData();
  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);

  // ─── Filter rides ─────────────────────────────────────────────
  const filteredRides = rides.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return '–';
    return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

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

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#FF3B30" size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.container}>

            {/* Earnings Card */}
            <View style={styles.card}>
              <Text style={styles.subLabel}>This Week</Text>
              <Text style={styles.bigAmount}>
                ₹{weekStats.total.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.green}>{weekStats.count} rides completed</Text>

              {/* Bar Chart */}
              <View style={styles.chart}>
                {chartData.map((data, i) => (
                  <View key={i} style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: data.amount > 0
                            ? `${Math.max((data.amount / maxAmount) * 100, 8)}%`
                            : '4%',
                          backgroundColor: data.amount > 0 ? '#FF3B30' : '#1E2540',
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
              {(['all', 'completed', 'cancelled'] as FilterType[]).map(f => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[styles.filter, filter === f && styles.filterActive]}
                >
                  <Text style={{ color: filter === f ? '#fff' : '#9CA3AF', textTransform: 'capitalize' }}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Ride List */}
            {filteredRides.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No rides found</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredRides.map((ride: any, i: number) => {
                  const isCancelled = ride.status === 'cancelled';
                  return (
                    <View
                      key={ride.id}
                      style={[
                        styles.item,
                        isCancelled && { opacity: 0.6 },
                        i < filteredRides.length - 1 && styles.itemBorder,
                      ]}
                    >
                      <View style={styles.icon}>
                        <Text>🚑</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.rowBetween}>
                          <Text style={[styles.itemTitle, isCancelled && { color: '#9CA3AF' }]}>
                            {CONDITION_LABELS[ride.condition] ?? ride.condition ?? 'Emergency'} • {ride.patientName ?? 'Patient'}
                          </Text>
                          <Text style={[styles.amount, isCancelled && { color: '#9CA3AF' }]}>
                            {isCancelled ? '₹0' : ride.fareEstimate?.split(' - ')[0] ?? '–'}
                          </Text>
                        </View>

                        <Text style={styles.time}>{formatDate(ride.createdAt)}</Text>

                        <Text style={styles.route}>
                          {ride.pickup?.address ?? '–'} → {ride.drop?.hospitalName ?? '–'}
                        </Text>

                        {isCancelled && (
                          <View style={styles.penalty}>
                            <Text style={styles.penaltyText}>⚠️ Penalty Applied</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <DriverNavItem label="Home"     icon={Home}         onPress={() => navigation.navigate('DriverHome')} />
        <DriverNavItem label="Requests" icon={ClipboardList} onPress={() => navigation.navigate('RideRequests')} />
        <DriverNavItem label="History"  icon={History}       active />
        <DriverNavItem label="Profile"  icon={User}          onPress={() => navigation.navigate('Profile')} />
      </View>
    </SafeAreaView>
  );
};

export default RideHistoryScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F2C' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  back: { color: '#fff', fontSize: 20, marginRight: 10 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  container: { padding: 20 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#141929', borderRadius: 14, padding: 16, marginBottom: 16 },
  subLabel: { color: '#9CA3AF', fontSize: 12 },
  bigAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  green: { color: '#34C759', marginTop: 4, fontSize: 13 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, marginTop: 16, gap: 6 },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  day: { color: '#9CA3AF', fontSize: 10, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filter: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#141929' },
  filterActive: { backgroundColor: '#FF3B30' },
  list: { backgroundColor: '#141929', borderRadius: 14 },
  item: { flexDirection: 'row', padding: 14, gap: 10 },
  itemBorder: { borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },
  icon: { width: 40, height: 40, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', flex: 1 },
  itemTitle: { color: '#fff', fontWeight: '600', fontSize: 12, flex: 1, marginRight: 8 },
  amount: { color: '#34C759', fontWeight: '600', fontSize: 13 },
  time: { color: '#9CA3AF', fontSize: 11, marginTop: 3 },
  route: { color: '#D1D5DB', fontSize: 11, marginTop: 2 },
  penalty: { marginTop: 6, backgroundColor: 'rgba(255,184,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },
  penaltyText: { color: '#FFB800', fontSize: 10 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8A8FA8', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141929', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
});