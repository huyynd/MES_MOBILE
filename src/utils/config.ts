// Tạm thời sử dụng localhost:4000 (dành cho Android Emulator thì dùng 10.0.2.2)
// Khi test bằng điện thoại thật, cần đổi sang địa chỉ IP LAN của máy tính, ví dụ: 'http://192.168.1.xxx:4000/api'
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mes-ngocan.onrender.com/api';
