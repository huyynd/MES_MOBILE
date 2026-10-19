import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InboundListScreen } from '@/screens/inventory/InboundListScreen';
import { InboundDetailScreen } from '@/screens/inventory/InboundDetailScreen';

const Stack = createNativeStackNavigator();

export function InventoryNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="InboundList" component={InboundListScreen} options={{ title: 'Lịch sử Nhập Kho' }} />
      <Stack.Screen name="InboundDetail" component={InboundDetailScreen} options={{ title: 'Chi tiết Giao dịch Nhập' }} />
    </Stack.Navigator>
  );
}
