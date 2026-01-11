/**
 * Authentication Context for Mobile App
 * 
 * Adapted from web version to use AsyncStorage instead of localStorage
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authAPI, RegisterData, LoginData } from '../services/api';
import { saveToken, saveUser, getToken, getUser, clearAuth } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from AsyncStorage
    const restoreSession = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      setToken(response.token);
      setUser(response.user);
      await saveToken(response.token);
      await saveUser(response.user);
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      setToken(response.token);
      setUser(response.user);
      await saveToken(response.token);
      await saveUser(response.user);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await clearAuth();
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
