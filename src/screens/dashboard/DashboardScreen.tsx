import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { HomeDashboard } from './HomeDashboard';
import { LeaderDashboard } from './LeaderDashboard';

export function DashboardScreen() {
  const { user } = useAuthStore();

  const renderDashboard = () => {
    // 1. Kiểm tra nếu là Tổ trưởng/Quản lý sản xuất
    if (user?.role_name?.toLowerCase().includes('tổ trưởng') || user?.role_name?.toLowerCase().includes('quản lý')) {
      return <HomeDashboard />; // Cho dùng chung UI hoặc sau này là <LeaderDashboard />
    }

    // 2. Mặc định là Home cho Worker
    return <HomeDashboard />;
  };

  return (
    <View style={styles.container}>
      {renderDashboard()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
