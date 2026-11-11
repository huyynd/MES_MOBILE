import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';

// SafeAreaProvider ở gốc: màn máy chấm công (KioskScreen) nằm ngoài NavigationContainer nên cần provider riêng.
export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
