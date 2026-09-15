import { FreeTrialModal } from '@/features/session-tracking/components/FreeTrialModal';
import { discardOrientationPaywallSession } from '@/features/session-tracking/liveSessionStore';
import { markOrientationTrialConsumed } from '@/features/session-tracking/trackerPaymentStore';
import { colors } from '@/constants/tokens';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Orientation completion paywall after the volunteer taps **Skip orientation**
 * on the live tracker. Pay now consumes the trial; Pay later discards without
 * saving and returns Home.
 */
export default function OrientationCompleteRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const leavingRef = useRef(false);
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  const goHome = useCallback(() => {
    try {
      router.dismissTo('/');
    } catch {
      router.replace('/');
    }
  }, [router]);

  const handlePayLater = useCallback(async () => {
    if (leavingRef.current) {
      return;
    }
    leavingRef.current = true;

    try {
      await discardOrientationPaywallSession();
      goHome();
    } catch (error) {
      leavingRef.current = false;
      console.error('[orientation-complete] Pay Later discard failed:', error);
    }
  }, [goHome]);

  const handlePayNow = useCallback(() => {
    leavingRef.current = true;
    markOrientationTrialConsumed();
    router.replace('/checkout?mode=tracker&returnTo=live-session' as Href);
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void handlePayLater();
      return true;
    });
    return () => sub.remove();
  }, [handlePayLater]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (leavingRef.current) {
        return;
      }
      e.preventDefault();
      void handlePayLater();
    });
    return unsub;
  }, [navigation, handlePayLater]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <FreeTrialModal
        variant="orientation_complete"
        onContinue={handlePayNow}
        onPayLater={() => {
          void handlePayLater();
        }}
      />
    </SafeAreaProvider>
  );
}
