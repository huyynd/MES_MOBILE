import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, Hammer, Package, User, Activity } from 'lucide-react-native';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { WorkOrderNavigator } from '@/navigation/WorkOrderNavigator';
import { QuickActionScreen } from '@/screens/actions/QuickActionScreen';
import { WarehouseDashboard } from '@/screens/dashboard/WarehouseDashboard';
import { PerformanceDashboard } from '@/screens/dashboard/PerformanceDashboard';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { useAuthStore } from '@/store/authStore';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -24,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View style={{
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    }}>
      <View style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1d4ed8', // Premium Blue
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1d4ed8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      }}>
        {children}
      </View>
    </View>
  </TouchableOpacity>
);

export function MainNavigator() {
  const { user } = useAuthStore();
  const isManager = user?.is_admin || (user?.role_name && !user?.role_name.toLowerCase().includes('công nhân'));
  const isWorker = !isManager;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
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
        options={{ 
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }} 
      />
      
      <Tab.Screen 
        name="WorkOrder" 
        component={WorkOrderNavigator} 
        options={{ 
          headerShown: false,
          title: 'Công việc',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
        }} 
      />

      <Tab.Screen 
        name="QRScan" 
        component={QuickActionScreen} 
        options={{ 
          title: '', // No title for floating button
          tabBarIcon: () => <Hammer color="#ffffff" size={24} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />
        }} 
      />

      {isWorker ? (
        <Tab.Screen 
          name="Performance" 
          component={PerformanceDashboard} 
          options={{ 
            title: 'Hiệu suất',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
          }} 
        />
      ) : (
        <Tab.Screen 
          name="Warehouse" 
          component={WarehouseDashboard} 
          options={{ 
            title: 'Kho',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
          }} 
        />
      )}

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Cá nhân',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
}
