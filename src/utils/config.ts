// Địa chỉ backend lấy từ biến môi trường EXPO_PUBLIC_API_URL (đặt trong file .env.local, không commit).
// Ví dụ khi test bằng điện thoại thật cùng Wi-Fi: EXPO_PUBLIC_API_URL=http://192.168.1.6:4000/api
// (Android Emulator dùng http://10.0.2.2:4000/api). Đổi .env.local xong phải chạy lại `npx expo start -c`.
// Cố ý KHÔNG có địa chỉ mặc định — tránh app lỡ trỏ vào máy chủ thật (PRD) hoặc một IP cũ.
const url = process.env.EXPO_PUBLIC_API_URL;

if (!url) {
  throw new Error(
    'Thiếu EXPO_PUBLIC_API_URL. Tạo file .env.local ở thư mục mobile với dòng:\n' +
    'EXPO_PUBLIC_API_URL=http://<IP-LAN-máy-dev>:4000/api\n' +
    'rồi chạy lại: npx expo start -c'
  );
}

// Bản phát hành (không phải chạy thử) BẮT BUỘC HTTPS: HTTP để lộ mật khẩu/phiên qua Wi-Fi,
// và Android bản release cũng chặn HTTP. Chạy thử (expo start) vẫn cho http://IP-LAN.
if (url.includes('DIEN-TEN-MIEN-MAY-CHU')) {
  throw new Error('Chưa điền địa chỉ máy chủ thật trong eas.json (EXPO_PUBLIC_API_URL).');
}
if (!__DEV__ && !/^https:\/\//i.test(url)) {
  throw new Error('Bản phát hành phải dùng địa chỉ máy chủ HTTPS (EXPO_PUBLIC_API_URL=https://...).');
}

export const API_BASE_URL: string = url.replace(/\/+$/, '');
