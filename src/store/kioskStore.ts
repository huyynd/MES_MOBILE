import { create } from 'zustand';
import { kioskStorage } from '@/api/kiosk';

// Chế độ "Máy chấm công của tổ": bật thì app mở thẳng vào màn chấm công (không cần đăng nhập app).
interface KioskModeState {
  mode: boolean | null; // null = chưa đọc xong
  load: () => Promise<void>;
  setMode: (on: boolean) => Promise<void>;
}

export const useKioskStore = create<KioskModeState>((set) => ({
  mode: null,
  load: async () => set({ mode: await kioskStorage.getMode() }),
  setMode: async (on) => { await kioskStorage.setMode(on); set({ mode: on }); },
}));
