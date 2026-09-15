import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HoldOnScreen } from '@/screens/HoldOnScreen';

export default function HoldOnRoute() {
  return (
    <SafeAreaProvider>
      <HoldOnScreen />
    </SafeAreaProvider>
  );
}
