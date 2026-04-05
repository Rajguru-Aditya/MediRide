import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHome from '../screens/Driver/DriverHome';
import RideRequests from '../screens/Driver/RideRequests';
import ActiveRideScreen from '../screens/Driver/ActiveRideScreen';

const Stack = createNativeStackNavigator();

const DriverNavigator = ({ user }: any) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DriverHome"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <DriverHome {...props} user={user} />
        )}
      </Stack.Screen>
      <Stack.Screen name="RideRequests"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <RideRequests {...props} user={user} />
        )}
      </Stack.Screen>
      <Stack.Screen name="ActiveRide"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <ActiveRideScreen {...props} user={user} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default DriverNavigator;