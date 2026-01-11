import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert('Error', 'Username must be between 3 and 20 characters');
      return;
    }

    setLoading(true);
    try {
      await register({ email, username, password });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      // Handle validation errors (array format)
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors
          .map((e: any) => e.msg || e.message)
          .join('\n');
        Alert.alert('Registration Failed', errorMessages);
      } 
      // Handle single error message
      else if (err.response?.data?.error) {
        Alert.alert('Registration Failed', err.response.data.error);
      }
      // Handle network errors
      else if (err.message) {
        Alert.alert('Registration Failed', err.message);
      }
      // Generic fallback
      else {
        console.error('Registration error:', err);
        Alert.alert('Registration Failed', 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.statusIndicator} />
        <Text style={styles.headerText}>NEW USER REGISTRATION</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.titleContainer}>
          <Ionicons name="person-add" size={32} color={theme.neon.magenta} />
          <Text style={styles.title}>REGISTER</Text>
        </View>
        <Text style={styles.subtitle}>CREATE NEW ACCOUNT</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={20} color={theme.neon.cyan} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="EMAIL"
            placeholderTextColor={theme.text.tertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person" size={20} color={theme.neon.magenta} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="USERNAME"
            placeholderTextColor={theme.text.tertiary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            maxLength={20}
          />
        </View>
        <Text style={styles.hint}>Letters, numbers, and underscores only (3-20 characters)</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color={theme.neon.green} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor={theme.text.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color={theme.neon.green} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="CONFIRM PASSWORD"
            placeholderTextColor={theme.text.tertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.text.primary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.text.primary} />
              <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.linkContainer}
          activeOpacity={0.8}
        >
          <Text style={styles.linkText}>
            HAVE ACCOUNT? <Text style={styles.linkBold}>LOGIN</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bg.primary,
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.neon.green,
    ...theme.shadow.green,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.neon.green,
    letterSpacing: 2,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.bg.card,
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: theme.neon.magenta,
    ...theme.shadow.magenta,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.text.primary,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 12,
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.neon.magenta,
    borderRadius: 12,
    backgroundColor: theme.bg.secondary,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: theme.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 11,
    color: theme.text.tertiary,
    marginBottom: 16,
    marginTop: -4,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: `${theme.neon.magenta}20`,
    borderWidth: 2,
    borderColor: theme.neon.magenta,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
    ...theme.shadow.magenta,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.text.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: theme.text.tertiary,
    letterSpacing: 1,
  },
  linkBold: {
    color: theme.neon.cyan,
    fontWeight: '700',
  },
});
