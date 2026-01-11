/**
 * API Service for Mobile App
 * 
 * Adapted from web version to use AsyncStorage and Expo Router navigation
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Router from 'expo-router';

// API base URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Default timeout is 30 seconds, but can be overridden per request
  timeout: 30000,
});

// Request interceptor - add JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigation will be handled by the app's index.tsx
    }
    return Promise.reject(error);
  }
);

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Auth API functions
export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
};

// User API functions
export const userAPI = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  updateUsername: async (username: string): Promise<{ message: string; user: User }> => {
    const response = await api.put<{ message: string; user: User }>('/users/me', { username });
    return response.data;
  },

  uploadAvatar: async (uri: string, type: string, name: string): Promise<{ message: string; user: User }> => {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type,
      name,
    } as any);
    
    const response = await api.post<{ message: string; user: User }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
