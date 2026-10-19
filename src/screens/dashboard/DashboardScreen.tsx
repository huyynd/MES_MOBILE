import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { isDirector } from '@/utils/roles';
import { WorkerHome } from '@/screens/home/WorkerHome';
import { DirectorHome } from '@/screens/home/DirectorHome';

// Trang chủ theo nhóm: Giám đốc (quyền "Báo cáo giám đốc" hoặc Admin) → tổng quan; còn lại → việc hôm nay
export function DashboardScreen() {
  const { user } = useAuthStore();
  return isDirector(user) ? <DirectorHome /> : <WorkerHome />;
}
