import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Activity } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const LoginScreen = ({ navigation, setUser, setRole }: any) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const isValid = email.length > 0 && password.length > 0;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 🔥 LOGIN HANDLER
  const handleLogin = async () => {
    try {
      if (!email || !password) {
        console.log('Enter email and password');
        return;
      }
  
      setLoading(true); // 🔥 start loader
  
      const userCredential = await auth().signInWithEmailAndPassword(
        email.trim(),
        password
      );
  
      const user = userCredential.user;
  
      const doc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();
  
      const role = doc.data()?.role;
  
      if (!role) {
        console.log('No role found');
        setLoading(false);
        return;
      }
  
      setUser(user);
      setRole(role);
  
    } catch (error: any) {
      console.log('Login error:', error.message);
    } finally {
      setLoading(false); // 🔥 stop loader
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2C" />

      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 20 },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.pulseWrapper}>
            <Animated.View
              style={[
                styles.pulseCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.iconCircle}>
              <Activity color="#fff" size={32} strokeWidth={2.5} />
            </View>
          </View>

          <Text style={styles.appName}>MediRide</Text>
          <View style={styles.underline} />
        </View>

        {/* Welcome */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.subText}>
            Emergency help is one tap away
          </Text>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            placeholder="Enter email"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>

          <TextInput
            placeholder="Enter password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: isValid ? 1 : 0.5,
            },
          ]}
          disabled={!isValid || loading}
        >
          {
            loading ? (
              <ActivityIndicator size={"small"} color={"#fff"} />
            ) : <Text style={styles.buttonText}>Login</Text>
          }
          
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        {/* Google (future) */}
        <TouchableOpacity style={styles.googleButton}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Register */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.subText}>New user? </Text>
            <Text
              style={styles.register}
              onPress={() => navigation.navigate('Signup')}
            >
              Register
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F2C',
  },
  
  container: {
    flex: 1,
    backgroundColor: '#0A0F2C',
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  pulseWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    opacity: 0.2,
  },

  iconCircle: {
    backgroundColor: '#FF3B30',
    padding: 18,
    borderRadius: 50,
  },

  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },

  underline: {
    width: 40,
    height: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    marginTop: 6,
  },

  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  welcome: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  subText: {
    color: '#9CA3AF',
    marginTop: 4,
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    color: '#D1D5DB',
    marginBottom: 8,
  },

  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },

  countryCode: {
    backgroundColor: '#141929',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  input: {
    // flex: 1,
    backgroundColor: '#141929',
    borderRadius: 12,
    paddingHorizontal: 16,
    // height: 100,
    paddingVertical: 12,
    color: '#FFFFFF',
  },

  textWhite: {
    color: '#FFFFFF',
  },

  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  dividerText: {
    marginHorizontal: 10,
    color: '#9CA3AF',
    fontSize: 12,
  },

  googleButton: {
    backgroundColor: '#141929',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },

  googleText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },

  register: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
});