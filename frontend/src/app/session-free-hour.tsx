import { FreeHourScreen } from '@/screens/FreeHourScreen';
import {
  exitSessionSetupGuideToTrackEntry,
  goToSessionSetupStep5,
  skipSessionSetupGuideForward,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeHourRoute() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('free-hour');

  return (
    <SafeAreaProvider>
      <FreeHourScreen
        totalPills={total}
        activePills={active}
        onContinue={() => router.push('/session-free-kit')}
        onPrevious={() => goToSessionSetupStep5(router)}
        onSkip={() => {
          void skipSessionSetupGuideForward(router);
        }}
        onBack={() => exitSessionSetupGuideToTrackEntry(router)}
      />
    </SafeAreaProvider>
  );
}
