import { SessionSetupStep6Screen } from '@/screens/SessionSetupStep6Screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Step6Route() {
  return (
    <SafeAreaProvider>
      <SessionSetupStep6Screen />
    </SafeAreaProvider>
  );
}
