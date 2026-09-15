import { SessionSetupFormScreen } from '@/screens/SessionSetupFormScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionSetupRoute() {
  return (
    <SafeAreaProvider>
      <SessionSetupFormScreen />
    </SafeAreaProvider>
  );
}
