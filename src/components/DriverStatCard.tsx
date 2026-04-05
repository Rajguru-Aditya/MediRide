import { StyleSheet, Text, View } from "react-native";

const DriverStatCard = ({ value, label, highlight }: any) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, highlight && { color: '#34C759' }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

export default DriverStatCard

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: '#141929',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },

  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },

  statLabel: { color: '#9CA3AF', fontSize: 10 },
})
