import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/User/HomeScreen';
import BookAmbulanceScreen from '../screens/User/BookAmbulanceScreen';
import HospitalSelectionScreen from '../screens/User/HospitalSelectionScreen';
import ConfirmationScreen from '../screens/User/ConfirmationScreen';

const Stack = createNativeStackNavigator();

const UserNavigator = ({ user }: any) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <HomeScreen {...props} user={user} />
        )}
      </Stack.Screen>
      <Stack.Screen name="BookAmbulance"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <BookAmbulanceScreen {...props} user={user} />
        )}
      </Stack.Screen>
      <Stack.Screen name="HospitalSelection"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <HospitalSelectionScreen {...props} user={user} />
        )}
      </Stack.Screen>

      <Stack.Screen name="ConfirmationScreen"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <ConfirmationScreen {...props} user={user} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default UserNavigator;