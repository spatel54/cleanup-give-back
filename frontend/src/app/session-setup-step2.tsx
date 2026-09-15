import { SessionSetupStep2Screen } from '@/screens/SessionSetupStep2Screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Step2Route() {
  return (
    <SafeAreaProvider>
      <SessionSetupStep2Screen />
    </SafeAreaProvider>
  );
}
