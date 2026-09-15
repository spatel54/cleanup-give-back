import { LiveSessionScreen } from '@/screens/LiveSessionScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function LiveSessionRoute() {
  return (
    <SafeAreaProvider>
      <LiveSessionScreen />
    </SafeAreaProvider>
  );
}
