import React, { useEffect, useState } from 'react';
import AuthNavigator from './AuthNavigator';
import DriverNavigator from './DriverNavigator';
import UserNavigator from './UserNavigator';

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

  if (!user) {
    return <AuthNavigator setUser={setUser} setRole={setRole} />;
  }

  if (role === 'driver') {
    return <DriverNavigator />;
  }

  return <UserNavigator />;
};

export default AppNavigator;