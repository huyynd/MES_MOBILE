import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainNavigator } from './MainNavigator';
import { CheckInScreen } from '@/screens/actions/CheckInScreen';
import { ScrapReportScreen } from '@/screens/workOrder/ScrapReportScreen';
import { AttendanceAppealScreen } from '@/screens/actions/AttendanceAppealScreen';
import { LeaveRequestScreen } from '@/screens/actions/LeaveRequestScreen';
import { WorkScheduleScreen } from '@/screens/actions/WorkScheduleScreen';
import { PersonalInfoScreen } from '@/screens/profile/PersonalInfoScreen';
import { AttendanceHistoryScreen } from '@/screens/profile/AttendanceHistoryScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';
import { OutboundCreateScreen } from '@/screens/inventory/OutboundCreateScreen';
import { NotificationScreen } from '@/screens/notifications/NotificationScreen';
import { OutboundApprovalScreen } from '@/screens/inventory/OutboundApprovalScreen';
import { WOSearchScreen } from '@/screens/actions/WOSearchScreen';
import { ShiftApprovalScreen } from '@/screens/actions/ShiftApprovalScreen';
import { ProductionPlanScreen } from '@/screens/actions/ProductionPlanScreen';
import { RecyclingScreen } from '@/screens/recycling/RecyclingScreen';
import { RecyclingCreateScreen } from '@/screens/recycling/RecyclingCreateScreen';
import { RecyclingDetailScreen } from '@/screens/recycling/RecyclingDetailScreen';
import { ChatListScreen } from '@/screens/chat/ChatListScreen';
import { ChatRoomScreen } from '@/screens/chat/ChatRoomScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen 
        name="CheckIn" 
        component={CheckInScreen} 
        options={{ 
          presentation: 'modal', // Hoặc 'card' tùy theo trải nghiệm mong muốn
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen 
        name="ScrapReport" 
        component={ScrapReportScreen}
        options={{ 
          headerShown: true,
          title: 'Báo cáo Phế phẩm',
          headerStyle: { backgroundColor: '#fee2e2' },
          headerTintColor: '#ef4444'
        }}
      />
      <Stack.Screen 
        name="AttendanceAppeal" 
        component={AttendanceAppealScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LeaveRequest" 
        component={LeaveRequestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="WorkSchedule" 
        component={WorkScheduleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PersonalInfo" 
        component={PersonalInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AttendanceHistory" 
        component={AttendanceHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OutboundCreate" 
        component={OutboundCreateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OutboundApproval" 
        component={OutboundApprovalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="WOSearch" 
        component={WOSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ShiftApproval" 
        component={ShiftApprovalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductionPlan" 
        component={ProductionPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Recycling" 
        component={RecyclingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecyclingCreate" 
        component={RecyclingCreateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecyclingDetail" 
        component={RecyclingDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
