import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err.response?.data?.error || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusIndicator} />
        <Text style={styles.headerText}>SYSTEM ACCESS</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.titleContainer}>
          <Ionicons name="lock-closed" size={32} color={theme.neon.cyan} />
          <Text style={styles.title}>LOGIN</Text>
        </View>
        <Text style={styles.subtitle}>AUTHENTICATE TO CONTINUE</Text>

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
          <Ionicons name="lock-closed" size={20} color={theme.neon.magenta} style={styles.inputIcon} />
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
              <Ionicons name="log-in" size={20} color={theme.text.primary} />
              <Text style={styles.buttonText}>LOGIN</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={styles.linkContainer}
          activeOpacity={0.8}
        >
          <Text style={styles.linkText}>
            NO ACCOUNT? <Text style={styles.linkBold}>REGISTER</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderColor: theme.neon.cyan,
    ...theme.shadow.cyan,
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
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.neon.cyan,
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
  button: {
    width: '100%',
    height: 56,
    backgroundColor: `${theme.neon.cyan}20`,
    borderWidth: 2,
    borderColor: theme.neon.cyan,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
    ...theme.shadow.cyan,
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
    color: theme.neon.magenta,
    fontWeight: '700',
  },
});
