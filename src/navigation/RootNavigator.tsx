import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import apiClient from '@/api/client';
import { useKioskStore } from '@/store/kioskStore';
import { KioskScreen } from '@/screens/kiosk/KioskScreen';

export function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession, logout } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    // Đăng ký interceptor 401 khi RootNavigator mount, để đảm bảo store đã ready
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  const { mode: kioskMode, load: loadKiosk, setMode: setKioskMode } = useKioskStore();
  useEffect(() => { loadKiosk(); }, [loadKiosk]);

  if (isLoading || kioskMode === null) {
    return <LoadingScreen message="Đang kiểm tra phiên đăng nhập..." />;
  }

  // Máy chấm công của tổ: không dùng phiên đăng nhập app
  if (kioskMode) {
    return <KioskScreen onExit={() => setKioskMode(false)} />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
