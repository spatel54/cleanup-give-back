import { FreeKitScreen } from '@/screens/FreeKitScreen';
import {
  continueFromSessionFreeKit,
  exitSessionSetupGuideToTrackEntry,
  goToSessionFreeHour,
  skipSessionSetupGuideForward,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeKitRoute() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('free-kit');

  return (
    <SafeAreaProvider>
      <FreeKitScreen
        totalPills={total}
        activePills={active}
        onContinue={() => {
          void continueFromSessionFreeKit(router);
        }}
        onPrevious={() => goToSessionFreeHour(router)}
        onSkip={() => {
          void skipSessionSetupGuideForward(router);
        }}
        onBack={() => exitSessionSetupGuideToTrackEntry(router)}
      />
    </SafeAreaProvider>
  );
}
