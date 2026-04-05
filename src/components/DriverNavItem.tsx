import { Pressable, StyleSheet, Text } from "react-native";

const DriverNavItem = ({ label, active, onPress }: any) => (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Text style={[styles.navText, active && { color: '#FF3B30' }]}>
        {label}
      </Text>
    </Pressable>
  );

export default DriverNavItem

const styles = StyleSheet.create({
    navItem: { alignItems: 'center' },

    navText: { color: '#9CA3AF', fontSize: 12 },
})