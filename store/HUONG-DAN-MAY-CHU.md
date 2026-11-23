# Dựng máy chủ MES tại nhà máy — Phương án A (máy tính nhà máy + Cloudflare Tunnel)

Kết quả cuối cùng:
- `https://api.<ten-mien>` → máy chủ MES (backend) chạy trên máy tính ở nhà máy.
- `https://mes.<ten-mien>` → web MES (tùy chọn — hoặc giữ web trên Vercel như hiện tại).
- Tablet (wifi xưởng) và giám đốc (5G, ở ngoài) dùng **cùng một địa chỉ**, có HTTPS sẵn.
- Không cần IP tĩnh, không mở cổng modem.

> Trong hướng dẫn, thay `ngocanthu.vn` bằng tên miền thật của công ty.

---

## Bước 1 — Chuẩn bị máy tính làm máy chủ (bạn làm)
- [ ] Máy Windows 10/11, RAM ≥ 8 GB, ổ SSD, cắm **dây mạng LAN** (ổn định hơn wifi).
- [ ] Cắm **UPS** (bộ lưu điện).
- [ ] Vào BIOS bật **"Restore on AC Power Loss" = Power On** → có điện lại máy tự bật.
- [ ] Windows: Settings → System → Power → **Sleep = Never** (không cho máy ngủ).
- [ ] Đặt mật khẩu đăng nhập Windows; cài Windows Update đầy đủ.

## Bước 2 — Mua tên miền + tài khoản Cloudflare (bạn làm)
- [ ] Mua tên miền (Mắt Bão / PA Việt Nam / Tenten…), ví dụ `ngocanthu.vn`. Nếu công ty đã có tên miền website → dùng luôn.
- [ ] Đăng ký Cloudflare miễn phí: https://dash.cloudflare.com/sign-up
- [ ] Cloudflare → **Add a domain** → nhập tên miền → chọn gói **Free**.
- [ ] Cloudflare cho 2 địa chỉ **nameserver** → vào trang quản lý tên miền (nơi mua) → đổi nameserver sang 2 địa chỉ đó.
      Chờ 1–24 giờ đến khi Cloudflare báo **Active**.
      ⚠ Nếu tên miền đang chạy website/email công ty: Cloudflare tự chép các bản ghi cũ — kiểm tra kỹ danh sách DNS trước khi đổi để không mất web/email.

## Bước 3 — Cài phần mềm trên máy chủ (làm cùng nhau)
- [ ] **Node.js LTS**: https://nodejs.org
- [ ] **PostgreSQL** (cùng phiên bản đang dùng): https://www.postgresql.org/download/windows/ — đặt mật khẩu mạnh cho user `postgres`, ghi lại cẩn thận.
- [ ] **Git**: https://git-scm.com
- [ ] Chép mã nguồn MES (nhánh đã chốt phát hành) vào `C:\MES`.
- [ ] Tạo file `C:\MES\backend\.env` (KHÔNG chia sẻ, KHÔNG commit):
  ```
  NODE_ENV=production
  PORT=4000
  DATABASE_URL=postgres://postgres:<mật-khẩu>@localhost:5432/mes
  JWT_SECRET=<chuỗi ngẫu nhiên dài ≥ 32 ký tự>
  CORS_ORIGINS=https://mes.ngocanthu.vn,https://procject-mes.vercel.app
  ```
  (Tên biến cụ thể đối chiếu với file `.env` đang chạy trên máy dev — Claude sẽ kiểm tra cùng.)
- [ ] Chuyển dữ liệu: sao lưu DB đang dùng (`pg_dump`) → khôi phục vào máy chủ mới (`pg_restore`). Chép cả thư mục ảnh tải lên (uploads).
- [ ] `cd C:\MES\backend` → `npm install` → `npm run migrate` → `npm start` → mở `http://localhost:4000` kiểm tra.

## Bước 4 — Cho máy chủ MES tự chạy khi bật máy (làm cùng nhau)
```powershell
npm install -g pm2 pm2-windows-startup
pm2 start C:\MES\backend\server.js --name mes-api
pm2 save
pm2-startup install
```
Khởi động lại máy → kiểm tra `pm2 list` thấy `mes-api` **online**.

## Bước 5 — Cloudflare Tunnel: đưa máy chủ ra Internet có HTTPS (làm cùng nhau)
1. Cloudflare → **Zero Trust** → Networks → **Tunnels** → Create a tunnel → loại **Cloudflared** → tên `mes-nha-may`.
2. Chọn **Windows** → Cloudflare hiện 1 lệnh cài có mã bí mật → chạy lệnh đó trong PowerShell (Run as Administrator).
   Tunnel tự cài thành dịch vụ Windows, tự chạy khi bật máy. Màn hình báo **Connected** là được.
3. Tab **Public Hostname** → Add:
   - `api.ngocanthu.vn` → Service **HTTP** → `localhost:4000`
   - (tùy chọn) `mes.ngocanthu.vn` → web MES (xem Bước 6)
4. Thử trên điện thoại dùng 4G/5G (tắt wifi): mở `https://api.ngocanthu.vn/api/health` → có phản hồi là thành công.

## Bước 6 — Web MES (chọn 1)
- **Giữ Vercel** (đang dùng): trong Vercel → Settings → Environment Variables đặt `VITE_API_BASE=https://api.ngocanthu.vn` → Redeploy.
- **Hoặc chạy luôn ở nhà máy**: build web (`npm run build`) → phục vụ thư mục `dist` → thêm hostname `mes.ngocanthu.vn` trong tunnel.

## Bước 7 — Sao lưu tự động (bắt buộc — dữ liệu nằm 1 chỗ)
- [ ] Lên lịch (Task Scheduler) chạy `pg_dump` mỗi đêm → lưu ra ổ khác + chép lên Google Drive/OneDrive.
- [ ] Giữ ít nhất 14 bản gần nhất. Thử khôi phục 1 lần cho chắc.

## Bước 8 — Bảo mật tối thiểu
- [ ] Đổi mật khẩu `admin` (không dùng `admin123`).
- [ ] Không mở cổng nào trên modem (tunnel không cần).
- [ ] PostgreSQL chỉ nghe `localhost` (mặc định) — không để lộ ra mạng.

## Bước 9 — Nối app mobile
- [ ] Điền `https://api.ngocanthu.vn/api` vào `eas.json` (2 chỗ `EXPO_PUBLIC_API_URL`) → đóng gói → kênh thử nghiệm nội bộ
      (xem `HUONG-DAN-GOOGLE-PLAY.md`).
