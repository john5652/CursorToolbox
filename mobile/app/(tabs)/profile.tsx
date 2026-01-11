import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { userAPI, User } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import HackerBackground from '../../components/HackerBackground';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ProfileScreen() {
  const { user: authUser, logout, updateUser } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (authUser) {
      fetchUserData();
    }
  }, [authUser]);

  const fetchUserData = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setUser(userData);
      setUsername(userData.username);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (username === user?.username) {
      setIsEditingUsername(false);
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.updateUsername(username);
      setUser(response.user);
      updateUser(response.user);
      setIsEditingUsername(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const response = await userAPI.uploadAvatar(uri, type, filename);
      setUser(response.user);
      updateUser(response.user);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.neon.cyan} />
      </View>
    );
  }

  const avatarUrl = user.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL.replace('/api', '')}${user.avatar}`)
    : null;

  return (
    <View style={styles.wrapper}>
      <HackerBackground opacity={0.1} speed={0.7} />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="person" size={24} color={theme.neon.magenta} />
            <Text style={styles.title}>PROFILE</Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout} 
            style={styles.logoutButton}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={16} color={theme.status.error} />
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.avatarGlow} />
          </View>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarButton}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={theme.neon.cyan} />
            ) : (
              <>
                <Ionicons name="camera" size={16} color={theme.neon.cyan} />
                <Text style={styles.avatarButtonText}>CHANGE AVATAR</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.labelContainer}>
              <Ionicons name="mail" size={16} color={theme.neon.cyan} />
              <Text style={styles.label}>EMAIL</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-circle" size={16} color={theme.neon.magenta} />
                <Text style={styles.label}>USERNAME</Text>
              </View>
              {!isEditingUsername && (
                <TouchableOpacity 
                  onPress={() => setIsEditingUsername(true)}
                  style={styles.editButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create" size={14} color={theme.neon.cyan} />
                  <Text style={styles.editLink}>EDIT</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingUsername ? (
              <View>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor={theme.text.tertiary}
                  maxLength={20}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={handleSaveUsername}
                    style={styles.saveButton}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={theme.text.primary} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color={theme.text.primary} />
                        <Text style={styles.saveButtonText}>SAVE</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingUsername(false);
                      setUsername(user.username);
                    }}
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={16} color={theme.text.secondary} />
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{user.username}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoItem}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar" size={16} color={theme.neon.green} />
              <Text style={styles.label}>MEMBER SINCE</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    padding: 20,
    zIndex: 1,
  },
  card: {
    backgroundColor: theme.bg.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border.dim,
    ...theme.shadow.cyan,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.primary,
    letterSpacing: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${theme.status.error}20`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.status.error,
    gap: 6,
  },
  logoutText: {
    color: theme.status.error,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.neon.cyan,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.neon.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.neon.cyan,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.text.primary,
  },
  avatarGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: theme.neon.cyan,
    opacity: 0.5,
    ...theme.shadow.cyan,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: `${theme.neon.cyan}20`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.neon.cyan,
    gap: 8,
  },
  avatarButtonText: {
    color: theme.neon.cyan,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  infoSection: {
    gap: 24,
  },
  infoItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text.secondary,
    letterSpacing: 1,
  },
  valueContainer: {
    backgroundColor: theme.bg.secondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border.dim,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: theme.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 11,
    color: theme.text.tertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: `${theme.neon.cyan}20`,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.neon.cyan,
  },
  editLink: {
    fontSize: 11,
    color: theme.neon.cyan,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.neon.cyan,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: theme.bg.secondary,
    color: theme.text.primary,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.neon.green}20`,
    borderWidth: 2,
    borderColor: theme.neon.green,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    ...theme.shadow.green,
  },
  saveButtonText: {
    color: theme.text.primary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg.secondary,
    borderWidth: 1,
    borderColor: theme.border.dim,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButtonText: {
    color: theme.text.secondary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
});
