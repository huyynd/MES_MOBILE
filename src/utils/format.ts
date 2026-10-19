// Định dạng số / tiền kiểu Việt Nam
export const num = (v: any, digits = 0): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: digits });
};

// Tiền rút gọn: 110.000.000 → "110 tr", 2.500.000.000 → "2,5 tỷ". null (không có quyền xem tiền) → "—"
export const money = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${num(n / 1e9, 2)} tỷ`;
  if (abs >= 1e6) return `${num(n / 1e6, 1)} tr`;
  return `${num(n)} đ`;
};

export const pct = (v: any, digits = 1): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `${num(n, digits)}%` : '—';
};
