import { SessionSetupStep4Screen } from '@/screens/SessionSetupStep4Screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Step4Route() {
  return (
    <SafeAreaProvider>
      <SessionSetupStep4Screen />
    </SafeAreaProvider>
  );
}
