# Đưa app MES Ngọc An Thư lên Google Play — Phương án B (Thử nghiệm nội bộ)

App chỉ cài được cho người trong danh sách (tối đa 100 Gmail), tự cập nhật qua CH Play, không hiện công khai.

## 0. Trạng thái chuẩn bị (đã làm trong repo)
- `app.json`: mã app `vn.ngocanthu.mes` (đổi được cho tới lần tải lên Google Play đầu tiên — sau đó KHÔNG đổi được),
  quyền **camera** (chụp ảnh bằng chứng, quét QR) — có câu xin quyền tiếng Việt;
  quyền **vị trí (GPS)** chỉ lúc bấm chấm công; chặn vị trí chạy nền / micro / đọc toàn bộ thư viện ảnh / vẽ đè màn hình. Chọn ảnh có sẵn dùng trình chọn ảnh hệ thống (không cần quyền).
- `eas.json`: build `preview` → file `.apk` (cài tay), `production` → file `.aab` (Google Play, tự tăng số phiên bản),
  `submit` → kênh **internal**.
- App tự chặn nếu: địa chỉ máy chủ chưa điền (`DIEN-TEN-MIEN-MAY-CHU`) hoặc không phải HTTPS.
- `store/privacy-policy.html`: chính sách quyền riêng tư — điền các chỗ [ ... ] rồi đăng lên một trang web công khai.

## 1. Việc phải xong TRƯỚC khi build (chủ dự án)
- [ ] **Tên miền máy chủ** (ví dụ `api.ngocanthu.vn`) trỏ về máy chủ MES, có HTTPS.
      → Điền vào `eas.json`, 2 chỗ `EXPO_PUBLIC_API_URL` (dạng `https://api.ngocanthu.vn/api`).
- [ ] **Deploy backend mới lên PRD** (nhánh `mobile-api` đã gộp vào `main` local): `npm install && npm run migrate`.
- [ ] Trên PRD: cấp quyền **"Báo cáo giám đốc"** cho vai trò giám đốc; gắn **"Công nhân liên kết"** cho từng tài khoản công nhân.
- [ ] Trên PRD: kiểm tra `JWT_SECRET`, `NODE_ENV=production`, đổi mật khẩu `admin`.
- [ ] Tạo 1 tài khoản **demo chỉ xem** trên PRD cho người duyệt của Google (mục App access).
- [ ] Đăng `privacy-policy.html` lên web công ty (cần 1 đường link công khai).

## 2. Tài khoản
- [ ] **Expo** (miễn phí): https://expo.dev/signup — dùng để build trên máy chủ của Expo.
- [ ] **Google Play Console**: https://play.google.com/console — loại **Tổ chức** (cần số D-U-N-S, website),
      Gmail công ty, phí 25 USD một lần, xác minh danh tính 1–3 ngày.

## 3. Build (chạy trong thư mục `D:\Project_MES\mobile`)
```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p android --profile production
```
- `init` gắn project với tài khoản Expo (ghi `extra.eas.projectId` vào app.json).
- Lần build đầu: chọn **để Expo tạo khóa ký (keystore)** → Expo lưu giữ khóa.
- Build xong (~15–20 phút) có link tải file `.aab`.
- Muốn file cài tay (dự phòng): `npx eas-cli@latest build -p android --profile preview` → file `.apk`.

## 4. Google Play Console
1. **Create app**: tên "MES Ngọc An Thư", Tiếng Việt, App, Miễn phí.
2. **Set up your app** — điền theo mục 5 bên dưới.
3. **Testing → Internal testing → Create new release** → tải file `.aab` lên → đồng ý **Play App Signing** → Save → Review → Rollout.
4. Tab **Testers**: tạo danh sách email (Gmail của máy tính bảng / người dùng) → copy **link mời**.
5. Trên máy tính bảng: đăng nhập Gmail trong danh sách → mở link mời → **Chấp nhận** → **Tải về**.

Lần cập nhật sau: build `production` lại → tải `.aab` mới vào Internal testing (hoặc `npx eas-cli@latest submit -p android`
sau khi tạo Service Account cho Google Play). Máy tính bảng tự cập nhật.

## 5. Nội dung khai báo trong Play Console

**Store listing**
- Tên: `MES Ngọc An Thư`
- Mô tả ngắn (≤ 80 ký tự): `Ứng dụng nội bộ quản lý sản xuất – xưởng bao bì Ngọc An Thư.`
- Mô tả đầy đủ:
  > Ứng dụng nội bộ dành cho nhân viên Công ty Bao Bì Ngọc An Thư.
  > • Công nhân: xem việc được giao hôm nay, ghi nhận sản lượng, theo dõi hiệu suất cá nhân.
  > • Quản lý: tổng quan sản xuất, báo cáo bán hàng – sản xuất – nhân sự – công nợ, hiệu suất nhân viên.
  > Cần tài khoản do công ty cấp để sử dụng.
- Icon 512×512 (từ `assets/icon.png`), ảnh bìa 1024×500, ảnh chụp màn hình **điện thoại** và **máy tính bảng 7" + 10"**.

**App access**: "All or some functionality is restricted" → nhập tài khoản demo PRD + ghi chú "Ứng dụng nội bộ, đăng nhập bằng tài khoản công ty".

**Ads**: Không có quảng cáo.

**Quyền camera** (Google có thể hỏi): "Chụp ảnh sản phẩm / phế phẩm / sự cố máy làm bằng chứng sản xuất và quét mã QR lệnh sản xuất."

**Content rating**: Danh mục *Utility / Productivity*; trả lời "Không" cho bạo lực, nội dung người lớn, cờ bạc, chia sẻ vị trí, mua hàng trong app…

**Target audience**: 18+. Không nhắm tới trẻ em.

**Data safety**:
| Câu hỏi | Trả lời |
|---|---|
| Thu thập / chia sẻ dữ liệu người dùng? | Có thu thập; **không chia sẻ** |
| Mã hóa khi truyền? | **Có** (HTTPS) |
| Người dùng yêu cầu xóa dữ liệu? | Có — liên hệ quản trị công ty (ghi trong chính sách) |
| Loại dữ liệu | *Personal info → Name, User IDs* (tên, tài khoản); *App activity → Other actions* (ghi sản lượng) |
| Mục đích | *App functionality*, *Account management* |
| Bắt buộc hay tùy chọn | Bắt buộc (cần để dùng app) |
| Ảnh (Photos) | **Có, khi đã làm chức năng chụp ảnh bằng chứng**: *Photos and videos → Photos*, mục đích *App functionality*, lưu trên máy chủ công ty. Chưa có chức năng gửi ảnh thì khai **Không** |
| Ảnh (chấm công) | **Có**: ảnh khuôn mặt khi chấm công — *Photos*, mục đích *App functionality*, lưu trên máy chủ công ty |
| Vị trí | **Có**: *Precise location*, chỉ lấy lúc bấm chấm công, mục đích *App functionality*, không chia sẻ |
| Danh bạ, tài chính, sức khỏe | **Không** |

**Government / Financial / Health app**: Không. **News app**: Không.

## 6. Dùng lâu dài
- Cập nhật app **ít nhất 1 lần/năm** (Google yêu cầu nhắm phiên bản Android mới): nâng Expo SDK → build production → tải lên.
- Đăng nhập Play Console định kỳ, đọc email từ Google Play.
- Giữ 1 file `.apk` dự phòng để cài tay khi cần.
- Đổi máy chủ sau này: chỉ cần tên miền vẫn giữ nguyên → không phải build lại app.
