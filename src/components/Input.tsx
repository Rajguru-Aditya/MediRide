import { StyleSheet, Text, TextInput, View } from "react-native";

export const Input = ({ label, placeholder, keyboardType = 'default', onChangeText }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        keyboardType={keyboardType}
        style={styles.input}
        onChangeText={onChangeText}
      />
    </View>
);


const styles = StyleSheet.create({
    label: { color: '#D1D5DB', marginBottom: 6 },
  
    input: {
      backgroundColor: '#141929',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: '#fff',
    },
})