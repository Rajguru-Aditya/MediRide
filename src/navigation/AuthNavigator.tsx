import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';


const Stack = createNativeStackNavigator();

const AuthNavigator = ({ setUser, setRole }: any) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <LoginScreen {...props} setUser={setUser} setRole={setRole} />
        )}
      </Stack.Screen>
      <Stack.Screen
      name="Signup"
      component={SignupScreen}
      options={{
        headerShown: false,
      }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;