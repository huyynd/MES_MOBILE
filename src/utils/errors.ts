// Lấy câu lỗi tiếng Việt từ máy chủ ({ message }) thay vì "Request failed with status code 400" của axios
export const errMsg = (e: any, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string => {
  const serverMsg = e?.response?.data?.message;
  if (serverMsg) return String(serverMsg);
  if (e?.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (e?.code === 'ECONNABORTED' || e?.message === 'Network Error') return 'Không kết nối được máy chủ. Kiểm tra Wi-Fi / mạng.';
  return e?.message && !String(e.message).startsWith('Request failed') ? String(e.message) : fallback;
};
