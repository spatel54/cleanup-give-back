import { SessionSetupStep3Screen } from '@/screens/SessionSetupStep3Screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Step3Route() {
  return (
    <SafeAreaProvider>
      <SessionSetupStep3Screen />
    </SafeAreaProvider>
  );
}
