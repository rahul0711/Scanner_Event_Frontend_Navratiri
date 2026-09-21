import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  //   const [username, setUsername] = useState('admin');
  // const [password, setPassword] = useState('admin');
  // const [password, setPassword] = useState('IACF@33');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setCompanies = useAuthStore((state) => state.setCompanies);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      const user = await apiService.login(username, password);
      console.log("Logged in user:", user);
      if (user && user.appUserName) {
        setUser(user);
        // setCompanies(user || []);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0042BF" />
        </View>
      )}

      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
        />
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0042BF' }}>
          Event Scanner
        </Text>
      </View>

      <View style={styles.securityLogoContainer}>
        <Text style={{ fontSize: 18, color: '#1E1E1E', fontWeight: '600' }}>
          Events Management System
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="default"
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Design & Developed By{' '}
        <Text
          onPress={() => Linking.openURL('https://scriptindia.in/')}>
          SCRIPT INDIA
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    marginBottom: 10,
    marginTop: 140,
  },
  logo: {
    width: 140,
    height: 110,
    marginBottom: 10,
    alignSelf: 'center',
  },
  securityLogoContainer: {
    marginBottom: 10,
    marginTop: 5,
  },
  card: {
    borderColor: '#D9D9D9',
    borderWidth: 1,
    width: '90%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    fontWeight: '700',
    textAlign: 'left',
    color: '#1E1E1E',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: '#000',
  },
  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#0042BF',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#F5F5F5',
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
  },

  footer: {
    fontSize: 16,
    color: '#1E1E1E',
    textAlign: 'center',
    fontWeight: '700',
    position: 'absolute',
    bottom: 30,
    textDecorationLine: 'underline',
    textDecorationColor: '#1E1E1E',
  },
});
