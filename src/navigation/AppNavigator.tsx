import React, { useEffect, useState } from 'react';
import AuthNavigator from './AuthNavigator';
import DriverNavigator from './DriverNavigator';
import UserNavigator from './UserNavigator';
import BootSplash from "react-native-bootsplash";


const AppNavigator = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'driver' | null>(null);

//   useEffect(() => {
//     // TEMP MOCK (we'll replace with Firebase)
//     const mockUser = {
//       uid: '123',
//       role: 'user', // change to 'driver' to test
//     };

//     setUser(mockUser);
//     setRole(mockUser.role as 'user' | 'driver' | null);
//   }, []);

  useEffect(() => {
    const init = async () => {
      // You can do async stuff here (auth check, etc.)
    };

    init().finally(() => {
      BootSplash.hide({ fade: true });
    });
  }, []);

  if (!user) {
    return <AuthNavigator setUser={setUser} setRole={setRole} />;
  }

  if (role === 'driver') {
    return <DriverNavigator user={user} setUser={setUser} setRole={setRole} key="driver"/>
  }

  return <UserNavigator user={user} setUser={setUser} setRole={setRole}     key="user"/>;
};

export default AppNavigator;