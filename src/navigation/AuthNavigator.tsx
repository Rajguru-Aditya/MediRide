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
      <Stack.Screen name="Signup"
      options={{
        headerShown: false,
      }}
      >
        {(props) => (
          <SignupScreen {...props} setUser={setUser} setRole={setRole} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthNavigator;