import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>INITIALIZING...</Text>
        <ActivityIndicator size="large" color={theme.neon.cyan} style={styles.loader} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bg.primary,
    gap: 20,
  },
  loadingText: {
    color: theme.neon.cyan,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  loader: {
    ...theme.shadow.cyan,
  },
});
