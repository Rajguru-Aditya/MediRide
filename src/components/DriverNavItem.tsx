import React from 'react';
import { View, Text, Pressable } from 'react-native';

const DriverNavItem = ({ label, active, onPress, icon: Icon }: any) => {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
      {Icon && (
        <Icon
          size={22}
          color={active ? '#34C759' : '#9CA3AF'}
          strokeWidth={2}
        />
      )}
      <Text
        style={{
          color: active ? '#34C759' : '#9CA3AF',
          fontSize: 12,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default DriverNavItem;