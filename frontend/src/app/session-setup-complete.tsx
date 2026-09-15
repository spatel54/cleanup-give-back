import { SessionSetupCompleteScreen } from '@/screens/SessionSetupCompleteScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionSetupCompleteRoute() {
  return (
    <SafeAreaProvider>
      <SessionSetupCompleteScreen />
    </SafeAreaProvider>
  );
}
