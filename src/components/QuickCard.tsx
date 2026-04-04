import { View } from "lucide-react-native";
import { StyleSheet, Text } from "react-native";

const QuickCard = ({ icon, title, subtitle }: any) => (
    <View style={styles.quickCard}>
      {icon}
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{subtitle}</Text>
    </View>
  );

export default QuickCard;

const styles = StyleSheet.create({
    quickCard: {
        flex: 1,
        backgroundColor: '#141929',
        borderRadius: 16,
        padding: 16,
    },

    quickTitle: {
        color: '#fff',
        marginTop: 10,
        fontWeight: '600',
    },

    quickSub: {
        color: '#9CA3AF',
        fontSize: 12,
    },
});
