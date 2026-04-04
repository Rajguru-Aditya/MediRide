import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/User/HomeScreen';
import BookAmbulanceScreen from '../screens/User/BookAmbulanceScreen';

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
    </Stack.Navigator>
  );
};

export default UserNavigator;