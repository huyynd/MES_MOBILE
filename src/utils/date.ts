// Ngày theo GIỜ CỦA ĐIỆN THOẠI (Việt Nam), định dạng YYYY-MM-DD như backend.
// Không dùng toISOString(): nó theo giờ quốc tế (UTC) → từ 0h–7h sáng ở VN ra ngày hôm trước.
const pad = (n: number) => String(n).padStart(2, '0');

export const toLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayLocal = (): string => toLocalDate(new Date());

export const addDays = (ymd: string, days: number): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  return toLocalDate(new Date(y, m - 1, d + days));
};

// Thứ Hai của tuần chứa ngày hôm nay
export const weekStartLocal = (): string => {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7;
  return toLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow));
};

export const monthStartLocal = (): string => {
  const d = new Date();
  return toLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

// '2026-10-19' → '19/10'
export const shortDate = (ymd?: string | null): string => {
  if (!ymd) return '—';
  const s = String(ymd).slice(0, 10).split('-');
  return s.length === 3 ? `${s[2]}/${s[1]}` : String(ymd);
};
