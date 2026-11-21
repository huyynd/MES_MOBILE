// Chấm công trên tablet do TỔ TRƯỞNG đăng nhập (chủ dự án chốt 2026-11-21):
// công nhân (không có tài khoản) chọn tên mình → PIN 6 số → chụp ảnh; máy ghi giờ máy chủ + vị trí GPS.
// Backend: nhánh mobile-hr, /hr/team/* (dùng phiên đăng nhập của tổ trưởng, không cần duyệt máy).
import { Platform } from 'react-native';
import { tokenStorage } from '@/utils/tokenStorage';
import { API_BASE_URL } from '@/utils/config';

export class TeamError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function call(path: string, opts: { method?: string; json?: any; form?: FormData } = {}) {
  const token = await tokenStorage.get();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.form ? 30000 : 12000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method || 'GET',
      headers: {
        ...(opts.json ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.form || (opts.json ? JSON.stringify(opts.json) : undefined),
      signal: ctrl.signal,
    });
  } catch {
    throw new TeamError(0, 'Không kết nối được máy chủ — kiểm tra Wi-Fi rồi thử lại');
  } finally { clearTimeout(timer); }
  let body: any = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) throw new TeamError(res.status, body?.message || `Lỗi máy chủ (${res.status})`);
  return body;
}

export type TeamMember = {
  id: string; name: string; employee_code: string; has_pin: boolean; pin_locked: boolean;
  today: { direction: 'IN' | 'OUT'; at: string }[];
};
export type TeamRoster = {
  unit_id: string; unit_name: string; now: string; consent_version: string; employees: TeamMember[];
  shift?: { name: string; start: string; end: string } | null; // ca làm việc của tổ
  work_today?: boolean; // hôm nay có phải ngày làm của tổ
};
export type TeamIdentify = {
  session: string;
  employee: { id: string; name: string; employee_code: string };
  expected_direction: 'IN' | 'OUT';
  needs_consent: boolean;
  photo_required: boolean;
  consent_version?: string;
};
export type Gps = { lat: number; lng: number; accuracy: number | null } | null;

export const teamApi = {
  roster: () => call('/hr/team/roster') as Promise<TeamRoster>,
  identify: (employeeId: string, pin: string) =>
    call('/hr/team/identify', { method: 'POST', json: { employee_id: employeeId, pin } }) as Promise<TeamIdentify>,
  consent: (session: string, accept: boolean) =>
    call('/hr/team/consent', { method: 'POST', json: { session, accept } }) as Promise<{ accepted: boolean; photo_required: boolean }>,
  punch: async (session: string, photo: { uri: string; width: number; height: number } | null, gps: Gps) => {
    const f = new FormData();
    f.append('session', session);
    f.append('idempotency_key', `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
    f.append('client_captured_at', new Date().toISOString());
    if (gps) {
      f.append('lat', String(gps.lat));
      f.append('lng', String(gps.lng));
      if (gps.accuracy != null) f.append('gps_accuracy', String(gps.accuracy));
    }
    if (photo) {
      f.append('photo_width', String(photo.width));
      f.append('photo_height', String(photo.height));
      if (Platform.OS === 'web') {
        const blob = await (await fetch(photo.uri)).blob();
        f.append('photo', blob, 'punch.jpg');
      } else {
        f.append('photo', { uri: photo.uri, name: 'punch.jpg', type: 'image/jpeg' } as any);
      }
    }
    return call('/hr/team/punch', { method: 'POST', form: f }) as Promise<{ duplicate?: boolean; direction: 'IN' | 'OUT'; punched_at: string; message: string }>;
  },
};
