import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHome from '../screens/Driver/DriverHome';
import RideRequests from '../screens/Driver/RideRequests';
import ActiveRideScreen from '../screens/Driver/ActiveRideScreen';
import RideHistoryScreen from '../screens/Driver/RideHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HospitalDashboardScreen from '../screens/Hospital/HospitalDashboardScreen';

const Stack = createNativeStackNavigator();

const HospitalNavigator = ({ user, setUser, setRole }: any) => {
  return (
    <Stack.Navigator initialRouteName='HospitalDashboard'>
      <Stack.Screen name="HospitalDashboard"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <HospitalDashboardScreen {...props} user={user} />
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
            role="hospital"
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default HospitalNavigator;