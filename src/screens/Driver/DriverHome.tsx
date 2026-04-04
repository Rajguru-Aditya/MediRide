import React from 'react';
import { View, Text, Button } from 'react-native';

const DriverHome = ({ navigation }: any) => {
  return (
    <View>
      <Text>Driver Home</Text>
      <Button
        title="View Requests"
        onPress={() => navigation.navigate('RideRequests')}
      />
    </View>
  );
};

export default DriverHome;