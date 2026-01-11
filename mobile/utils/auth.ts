/**
 * Authentication Utilities - AsyncStorage Helpers
 * 
 * These functions manage authentication data using AsyncStorage (React Native's
 * equivalent to localStorage for web).
 * 
 * Why AsyncStorage?
 * - Persists across app restarts (user stays logged in)
 * - Async API (non-blocking)
 * - Works on both iOS and Android
 * 
 * Storage Structure:
 * - 'token': JWT token string
 * - 'user': JSON stringified user object
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../services/api';

// Keys used in AsyncStorage
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Save JWT token to AsyncStorage
 * 
 * @param token - JWT token string from backend
 */
export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get JWT token from AsyncStorage
 * 
 * @returns Token string or null if not found
 */
export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Remove JWT token from AsyncStorage
 */
export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Save user data to AsyncStorage
 * 
 * @param user - User object (id, email, username, avatar, etc.)
 */
export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user data from AsyncStorage
 * 
 * @returns User object or null
 */
export async function getUser(): Promise<User | null> {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * Remove user data from AsyncStorage
 */
export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

/**
 * Check if user is authenticated
 * 
 * @returns True if token exists, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/**
 * Clear all authentication data
 */
export async function clearAuth(): Promise<void> {
  await removeToken();
  await removeUser();
}
