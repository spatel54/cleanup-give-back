import { MissedCheckpointScreen } from '@/screens/MissedCheckpointScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function MissedCheckpointRoute() {
  return (
    <SafeAreaProvider>
      <MissedCheckpointScreen />
    </SafeAreaProvider>
  );
}
