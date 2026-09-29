import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/auth';
import { authApi } from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  hasPermission: (permissionString: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // true by default until restoreSession finishes

  login: async (token: string, user: User) => {
    await AsyncStorage.setItem('jwt_token', token);

    if (!user.employee_code && user.linked_worker) {
      try {
        const apiClient = require('@/api/client').default;
        const { data } = await apiClient.get('/lookups');
        if (data && data.employees) {
          const matched = data.employees.find((e: any) => e.name === user.linked_worker);
          if (matched) {
            user.employee_code = matched.employee_code;
          }
        }
      } catch (err) {
        console.warn('Lỗi lấy employee_code bổ sung:', err);
      }
    }

    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore if logout API fails
    } finally {
      await AsyncStorage.removeItem('jwt_token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Token exists, verify it with backend
      const { user } = await authApi.me();

      // Fallback: Nếu Backend live chưa update trả về employee_code, ta gọi tạm /lookups để lấy
      if (!user.employee_code && user.linked_worker) {
        try {
          // Lấy nhanh từ lookupAPI (sử dụng thẳng axios client nội bộ nếu chưa khai báo api riêng)
          const apiClient = require('@/api/client').default;
          const { data } = await apiClient.get('/lookups');
          if (data && data.employees) {
            const matched = data.employees.find((e: any) => e.name === user.linked_worker);
            if (matched) {
              user.employee_code = matched.employee_code;
            }
          }
        } catch (err) {
          console.warn('Lỗi lấy employee_code bổ sung:', err);
        }
      }

      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.log('Session restore failed', error);
      await AsyncStorage.removeItem('jwt_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  hasPermission: (permissionString: string): boolean => {
    const user = get().user;
    if (!user) return false;
    if (user.is_admin) return true;
    
    // Parse the permission string (e.g. "production:edit" or "scrap:create")
    const parts = permissionString.split(':');
    let moduleKey = permissionString;
    let action = 'view';
    
    if (parts.length > 1) {
      moduleKey = parts[0];
      action = parts[1];
    }

    const perms = user.permissions;
    if (!perms) return false;
    
    // Exact match with modern permission struct { mod: { action: 'ALLOW' } }
    if (perms[moduleKey] && perms[moduleKey][action]) {
      const pval = perms[moduleKey][action];
      if (typeof pval === 'object' && pval.status === 'ALLOW') return true;
      if (pval === 'ALLOW' || pval === true) return true;
    }

    // Backward compatibility for legacy flat booleans
    if (perms[permissionString] === true) return true;
    
    return false;
  }
}));
