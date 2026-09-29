export const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
};
