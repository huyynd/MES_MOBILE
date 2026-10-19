import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, BarChart2, User, Activity } from 'lucide-react-native';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { WorkOrderNavigator } from '@/navigation/WorkOrderNavigator';
import { PerformanceDashboard } from '@/screens/dashboard/PerformanceDashboard';
import { ReportsScreen } from '@/screens/reports/ReportsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { useAuthStore } from '@/store/authStore';
import { isDirector } from '@/utils/roles';

const Tab = createBottomTabNavigator();

// Mobile chỉ phục vụ 2 nhóm:
//  - Công nhân: Trang chủ (việc hôm nay) · Công việc · Hiệu suất (của mình) · Cá nhân
//  - Giám đốc:  Trang chủ (tổng quan) · Công việc (toàn xưởng) · Báo cáo · Hiệu suất (mọi người) · Cá nhân
// Nút giữa "thao tác nhanh" (phế, tái chế, xuất kho, chấm công...) đã bỏ — ngoài phạm vi; các màn đó vẫn giữ code.
export function MainNavigator() {
  const { user } = useAuthStore();
  const director = isDirector(user);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 64 + Math.max(insets.bottom, 0),
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Trang chủ', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />

      <Tab.Screen
        name="WorkOrder"
        component={WorkOrderNavigator}
        options={{ title: 'Công việc', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />

      {director && (
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: 'Báo cáo', tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} /> }}
        />
      )}

      <Tab.Screen
        name="Performance"
        component={PerformanceDashboard}
        options={{ title: 'Hiệu suất', tabBarIcon: ({ color, size }) => <Activity color={color} size={size} /> }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Cá nhân', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
