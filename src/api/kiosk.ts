// Máy chấm công của tổ (kiosk) — gọi API /kiosk/* bằng "mã máy" (X-Kiosk-Token), KHÔNG dùng phiên đăng nhập app.
// Luồng: đăng ký máy → quản lý duyệt trên web → máy nhận mã → nhân viên nhập tài khoản app → (lần đầu) đồng ý
// chụp ảnh theo NĐ13 → chụp → chấm. Backend: nhánh mobile-hr (identify-account), consent/punch dùng chung kiosk web.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/utils/config';

const TOKEN_KEY = 'kiosk_token';
const PENDING_KEY = 'kiosk_pending';
const MODE_KEY = 'kiosk_mode';
const NAME_KEY = 'kiosk_name';
const secure = Platform.OS !== 'web';

const sGet = (k: string) => (secure ? SecureStore.getItemAsync(k) : AsyncStorage.getItem(k));
const sSet = (k: string, v: string) => (secure ? SecureStore.setItemAsync(k, v) : AsyncStorage.setItem(k, v));
const sDel = (k: string) => (secure ? SecureStore.deleteItemAsync(k) : AsyncStorage.removeItem(k));

export const kioskStorage = {
  getToken: () => sGet(TOKEN_KEY),
  setToken: (t: string) => sSet(TOKEN_KEY, t),
  clearToken: () => sDel(TOKEN_KEY),
  getPending: async (): Promise<{ device_id: string; claim_secret: string; code: string } | null> => {
    try { return JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) || 'null'); } catch { return null; }
  },
  setPending: (p: any) => (p ? AsyncStorage.setItem(PENDING_KEY, JSON.stringify(p)) : AsyncStorage.removeItem(PENDING_KEY)),
  getName: () => AsyncStorage.getItem(NAME_KEY),
  setName: (n: string) => AsyncStorage.setItem(NAME_KEY, n),
  getMode: async () => (await AsyncStorage.getItem(MODE_KEY)) === '1',
  setMode: (on: boolean) => (on ? AsyncStorage.setItem(MODE_KEY, '1') : AsyncStorage.removeItem(MODE_KEY)),
};

export class KioskError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function call(path: string, opts: { method?: string; json?: any; form?: FormData; headers?: Record<string, string> } = {}) {
  const token = await kioskStorage.getToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.form ? 30000 : 12000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method || 'GET',
      headers: {
        ...(opts.json ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'X-Kiosk-Token': token } : {}),
        ...(opts.headers || {}),
      },
      body: opts.form || (opts.json ? JSON.stringify(opts.json) : undefined),
      signal: ctrl.signal,
    });
  } catch {
    throw new KioskError(0, 'Không kết nối được máy chủ — kiểm tra Wi-Fi rồi thử lại');
  } finally { clearTimeout(timer); }
  let body: any = null;
  try { body = await res.json(); } catch {}
  if (!res.ok && res.status !== 202) throw new KioskError(res.status, body?.message || `Lỗi máy chủ (${res.status})`);
  return { status: res.status, body };
}

export type IdentifyResult = {
  session: string;
  employee: { id: string; name: string; employee_code: string };
  expected_direction: 'IN' | 'OUT';
  needs_consent: boolean;
  photo_required: boolean;
  consent_version?: string;
};

export const kioskApi = {
  register: (name: string) => call('/kiosk/register', { method: 'POST', json: { name } }).then((r) => r.body),
  // 202 = chờ duyệt; 200 = { token, name }
  claim: (p: { device_id: string; claim_secret: string }) => call('/kiosk/register/claim', { method: 'POST', json: p }),
  time: () => call('/kiosk/time', { headers: { 'X-Client-Time': new Date().toISOString() } }).then((r) => r.body as { now: string }),
  identifyAccount: (username: string, password: string) =>
    call('/kiosk/identify-account', { method: 'POST', json: { username, password } }).then((r) => r.body as IdentifyResult),
  consent: (session: string, accept: boolean) =>
    call('/kiosk/consent', { method: 'POST', json: { session, accept } }).then((r) => r.body as { accepted: boolean; photo_required: boolean }),
  punch: async (session: string, photo: { uri: string; width: number; height: number } | null) => {
    const f = new FormData();
    f.append('session', session);
    f.append('idempotency_key', `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
    f.append('client_captured_at', new Date().toISOString());
    if (photo) {
      f.append('photo_width', String(photo.width));
      f.append('photo_height', String(photo.height));
      if (Platform.OS === 'web') {
        const blob = await (await fetch(photo.uri)).blob();
        f.append('photo', blob, 'punch.jpg');
      } else {
        // React Native: file cục bộ gửi dạng { uri, name, type }
        f.append('photo', { uri: photo.uri, name: 'punch.jpg', type: 'image/jpeg' } as any);
      }
    }
    return call('/kiosk/punch', { method: 'POST', form: f })
      .then((r) => r.body as { duplicate?: boolean; direction: 'IN' | 'OUT'; punched_at: string; employee_name?: string; message: string });
  },
};
