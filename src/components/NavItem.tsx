import { Pressable, StyleSheet, Text } from "react-native";

const NavItem = ({ icon: Icon, label, active, navigation, screen }: any) => (
    <Pressable style={styles.navItem} onPress={() => navigation.navigate(screen)}>
      <Icon color={active ? '#FF3B30' : '#9CA3AF'} size={22} />
      <Text style={[styles.navText, active && { color: '#FF3B30' }]}>
        {label}
      </Text>
    </Pressable>
  );

export default NavItem;

const styles = StyleSheet.create({
    navItem: { alignItems: 'center' },
  
    navText: { fontSize: 10, color: '#9CA3AF' },
});