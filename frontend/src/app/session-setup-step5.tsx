import { SessionSetupStep5Screen } from '@/screens/SessionSetupStep5Screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Step5Route() {
  return (
    <SafeAreaProvider>
      <SessionSetupStep5Screen />
    </SafeAreaProvider>
  );
}
