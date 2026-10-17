import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lưu phiên đăng nhập (JWT) trong kho mã hóa của máy: Keychain (iOS) / Keystore (Android).
// Web không có SecureStore → dùng AsyncStorage (chỉ để chạy thử trên trình duyệt).
const KEY = 'jwt_token';
const useSecure = Platform.OS !== 'web';

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (!useSecure) return AsyncStorage.getItem(KEY);
    const token = await SecureStore.getItemAsync(KEY);
    if (token) return token;
    // Bản cũ lưu token ở AsyncStorage (không mã hóa) → chuyển sang SecureStore rồi xóa bản cũ
    const legacy = await AsyncStorage.getItem(KEY);
    if (legacy) {
      await SecureStore.setItemAsync(KEY, legacy);
      await AsyncStorage.removeItem(KEY);
    }
    return legacy;
  },

  async set(token: string): Promise<void> {
    if (!useSecure) return AsyncStorage.setItem(KEY, token);
    await SecureStore.setItemAsync(KEY, token);
  },

  async remove(): Promise<void> {
    // Xóa cả 2 nơi để chắc chắn không còn bản cũ
    await AsyncStorage.removeItem(KEY);
    if (useSecure) await SecureStore.deleteItemAsync(KEY);
  },
};
