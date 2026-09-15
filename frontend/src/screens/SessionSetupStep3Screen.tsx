import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import {
  exitSessionSetupGuideToTrackEntry,
  goToSessionSetupStep2,
  skipSessionSetupGuideForward,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canUseSessionPhotos } from '@/constants/ageGate';
import { colors as C, textStyles } from '@/constants/tokens';

export function SessionSetupStep3Screen() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('step3');

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header — gap 20 between all three sections */}
      <View style={s.header}>
        <View style={s.navContainer}>
          <SessionSetupGuideNavRow
            total={total}
            active={active}
            onBack={() => exitSessionSetupGuideToTrackEntry(router)}
          />
        </View>

        <CoachmarkEnter>
          <Text style={s.title}>Time is ticking...</Text>

          <Text style={s.subtitle}>
            When the session starts, a stopwatch automatically begins. As you clean up, the session records your walking path to ensure your session is verified.
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={0} style={s.illustrationZone}>
        <ExpoImage
          source={ONBOARDING_GRAPHICS.step3Illustration}
          style={s.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessibilityLabel="Live session tracker showing in-progress status, timer, distance, and walking path map"
        />
      </CoachmarkEnter>

      <View style={s.footer}>
        <SessionSetupGuideFooterActions
          onContinuePress={() =>
            router.push(canUseSessionPhotos() ? '/session-setup-step4' : '/session-setup-step5')
          }
          onPreviousPress={() => goToSessionSetupStep2(router)}
          onSkipPress={() => {
            void skipSessionSetupGuideForward(router);
          }}
          skipAccessibilityLabel="Skip remaining setup steps"
        />
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  // Header — gap 20 between all items
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },

  navContainer: {
    gap: 20,
  },

  title: {
    ...textStyles.headlinePage,
    color: C.textPrimary,
  },

  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textTertiary,
    lineHeight: 22,
  },

  // Illustration
  illustrationZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  illustration: {
    width: '100%',
    height: '100%',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
  },
});
