import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';

type Props = {
  visible: boolean;
  type?: 'success' | 'error';
  message: string;
  onClose: () => void;
};

const CustomAlert = ({ visible, type = 'success', message, onClose }: Props) => {
  const isSuccess = type === 'success';

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Icon */}
          {isSuccess ? (
            <CheckCircle size={50} color="#34C759" />
          ) : (
            <XCircle size={50} color="#FF3B30" />
          )}

          {/* Message */}
          <Text style={styles.title}>
            {isSuccess ? 'Success' : 'Error'}
          </Text>

          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#141929',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2540',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  message: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});