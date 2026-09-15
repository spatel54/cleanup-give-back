import { SessionSetupGuideScreen } from '@/screens/SessionSetupGuideScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionSetupGuideRoute() {
  return (
    <SafeAreaProvider>
      <SessionSetupGuideScreen />
    </SafeAreaProvider>
  );
}
