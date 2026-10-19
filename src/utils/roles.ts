import { User } from '@/types/auth';

// App mobile chỉ có 2 nhóm:
//  - Giám đốc: Admin, hoặc được cấp quyền xem "Báo cáo giám đốc" (rep_director) trên web → xem tất cả, báo cáo.
//  - Còn lại dùng giao diện công nhân: việc được giao hôm nay + hiệu suất của chính mình.
// Dựa trên QUYỀN (chỉnh ở màn Phân quyền web), không dựa vào tên vai trò.
export const hasAppPerm = (user: User | null | undefined, app: string, action = 'view'): boolean => {
  if (!user) return false;
  if (user.is_admin) return true;
  const v = user.permissions?.[app]?.[action];
  return v === 'ALLOW' || v === true || v?.status === 'ALLOW';
};

export const isDirector = (user: User | null | undefined): boolean => hasAppPerm(user, 'rep_director', 'view');

// Tên công nhân dùng để lọc việc / hiệu suất: chỉ lấy "Công nhân liên kết" (linked_worker) trên web.
// Không đoán bằng họ tên tài khoản — đoán sai thì công nhân thấy nhầm việc người khác hoặc không thấy gì.
export const workerNameOf = (user: User | null | undefined): string => (user?.linked_worker || '').trim();
