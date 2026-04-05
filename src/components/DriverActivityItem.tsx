import { StyleSheet, Text, View } from "react-native";

const DriverActivityItem = ({ title, time, amount }: any) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Text>🚑</Text>
      </View>
  
      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activitySub}>{time}</Text>
      </View>
  
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );

export default DriverActivityItem

const styles = StyleSheet.create({
    activityCard: {
        backgroundColor: '#141929',
        borderRadius: 14,
      },
    
      activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
      },
    
      activityIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,59,48,0.1)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
    
      activityTitle: { color: '#fff', fontSize: 12 },
    
      activitySub: { color: '#9CA3AF', fontSize: 10 },
      amount: { color: '#34C759', fontWeight: '600' },
})