import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHome from '../screens/Driver/DriverHome';
import RideRequests from '../screens/Driver/RideRequests';

const Stack = createNativeStackNavigator();

const DriverNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DriverHome" component={DriverHome} />
      <Stack.Screen name="RideRequests" component={RideRequests} />
    </Stack.Navigator>
  );
};

export default DriverNavigator;