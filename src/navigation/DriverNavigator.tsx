import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHome from '../screens/Driver/DriverHome';
import RideRequests from '../screens/Driver/RideRequests';
import ActiveRideScreen from '../screens/Driver/ActiveRideScreen';
import RideHistoryScreen from '../screens/Driver/RideHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const DriverNavigator = ({ user, setUser, setRole }: any) => {
  return (
    <Stack.Navigator initialRouteName='DriverHome'>
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
      <Stack.Screen name="RideHistory"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <RideHistoryScreen {...props} user={user} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Profile"
        options={{ headerShown: false }}
      >
        {(props) => (
          <ProfileScreen
            {...props}
            setUser={setUser}
            setRole={setRole}
            role="driver"
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default DriverNavigator;