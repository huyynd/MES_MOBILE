import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkOrderListScreen } from '@/screens/workOrder/WorkOrderListScreen';
import { WorkOrderDetailScreen } from '@/screens/workOrder/WorkOrderDetailScreen';
import { MaterialUsageScreen } from '@/screens/workOrder/MaterialUsageScreen';

const Stack = createNativeStackNavigator();

export function WorkOrderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="WorkOrderList" 
        component={WorkOrderListScreen} 
        options={{ title: 'Lệnh Sản Xuất' }}
      />
      <Stack.Screen 
        name="WorkOrderDetail" 
        component={WorkOrderDetailScreen} 
        options={{ title: 'Chi tiết Công việc' }}
      />
      <Stack.Screen 
        name="MaterialUsage" 
        component={MaterialUsageScreen} 
        options={{ title: 'NVL Thực tế' }}
      />
    </Stack.Navigator>
  );
}
