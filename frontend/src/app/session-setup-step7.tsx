import { SessionSetupStep7Screen } from '@/screens/SessionSetupStep7Screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Step7Route() {
  return (
    <SafeAreaProvider>
      <SessionSetupStep7Screen />
    </SafeAreaProvider>
  );
}
