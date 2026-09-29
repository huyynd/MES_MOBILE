# MES Mobile App

MES Mobile là ứng dụng quản lý hệ thống thực thi sản xuất (Manufacturing Execution System) dành cho thiết bị di động, được xây dựng bằng React Native và Expo. Ứng dụng cung cấp các công cụ tiện lợi cho công nhân và quản lý phân xưởng để theo dõi tiến độ sản xuất, chấm công, báo cáo phế phẩm và quản lý kho.

## 🚀 Tính năng nổi bật

### Dành cho Công nhân (Worker)
- **Chấm công & Ca làm việc:** Theo dõi giờ vào ca, ra ca, kiểm tra vị trí qua GPS.
- **Giải trình công:** Gửi yêu cầu giải trình lý do đi muộn/về sớm hoặc thiếu log chấm công.
- **Quản lý lệnh sản xuất:** Ghi nhận sản lượng hoàn thành thực tế ngay trên dây chuyền.
- **Báo cáo phế phẩm:** Ghi nhận phế phát sinh trong quá trình sản xuất.
- **Trang chủ Dashboard:** Hiển thị trực quan chỉ số cá nhân (tổng sản lượng, phế phát sinh, và hiệu suất hoàn thành kế hoạch).

### Dành cho Quản lý (Manager/Leader)
- **Dashboard Tổng quan:** Theo dõi tình trạng các lệnh sản xuất, số lượng máy đang hoạt động, tổng quát tiến độ toàn xưởng.
- **Phê duyệt:** Duyệt các đơn giải trình công, đơn xin nghỉ phép của công nhân.
- **Giám sát kho / Tái chế:** Theo dõi và kiểm duyệt các nghiệp vụ kho, nhập/xuất nguyên vật liệu.

## 🛠 Công nghệ sử dụng

- **Framework:** React Native / Expo
- **Ngôn ngữ:** TypeScript
- **Quản lý State:** Zustand
- **Điều hướng (Routing):** React Navigation
- **Kết nối API (HTTP Client):** Axios
- **Thư viện UI/Icon:** Lucide React Native, React Native Chart Kit

## 📦 Hướng dẫn cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js (phiên bản 18+ khuyến nghị)
- Ứng dụng **Expo Go** trên điện thoại (để test trực tiếp trên máy thật) hoặc Android Studio/Xcode (để giả lập).

### Các bước khởi chạy
1. **Clone mã nguồn (nếu chưa có):**
   ```bash
   git clone https://github.com/xone184/MES_Mobile.git
   cd MES-Mobile
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Khởi chạy ứng dụng:**
   ```bash
   npm start
   # hoặc
   npx expo start
   ```
   
4. **Trải nghiệm ứng dụng:**
   - Dùng ứng dụng **Expo Go** trên điện thoại (iOS/Android) quét mã QR xuất hiện trên terminal.
   - Hoặc nhấn phím `a` trên terminal để chạy trên Android Emulator.
   - Nhấn phím `i` trên terminal để chạy trên iOS Simulator.

## 📁 Cấu trúc thư mục (Source Code)

```text
src/
├── api/             # Cấu hình Axios và các hàm gọi HTTP API (auth, production, schedule...)
├── components/      # Các thành phần UI có thể tái sử dụng (Button, Card, Header, Modal...)
├── navigation/      # Cấu hình React Navigation (MainTabs, Root, Auth...)
├── screens/         # Chứa toàn bộ các màn hình của ứng dụng
│   ├── actions/     # Màn hình chức năng: Chấm công, Giải trình, Xin nghỉ...
│   ├── auth/        # Màn hình đăng nhập
│   ├── dashboard/   # Trang chủ Dashboard phân quyền theo Manager/Worker
│   ├── inventory/   # Quản lý kho, Phiếu Xuất/Nhập
│   ├── profile/     # Hồ sơ cá nhân, Lịch sử chấm công, Cài đặt
│   ├── recycling/   # Tính năng quản lý thu hồi, tái chế
│   └── workOrder/   # Lệnh sản xuất, Báo cáo phế phẩm, Nguyên vật liệu
├── store/           # Quản lý state toàn cục (sử dụng Zustand store)
├── types/           # Định nghĩa các type/interface của TypeScript cho dữ liệu
└── utils/           # Các hàm tiện ích (format ngày giờ, số liệu) và cấu hình tĩnh
```

## 📝 Đóng góp & Phát triển
Khi có thay đổi, lưu ý đẩy code (push) lên nhánh chính (`main`) trên kho lưu trữ hệ thống:
```bash
git add .
git commit -m "Nội dung thay đổi"
git push origin main
```
