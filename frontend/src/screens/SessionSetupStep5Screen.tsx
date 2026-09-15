import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import { canUseSessionPhotos } from '@/constants/ageGate';
import {
  exitSessionSetupGuideToTrackEntry,
  goToSessionSetupStep3,
  goToSessionSetupStep4,
  skipSessionSetupGuideForward,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as C, textStyles } from '@/constants/tokens';

export function SessionSetupStep5Screen() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('step5');

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_700Bold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.navContainer}>
          <SessionSetupGuideNavRow
            total={total}
            active={active}
            onBack={() => exitSessionSetupGuideToTrackEntry(router)}
          />
        </View>

        <CoachmarkEnter style={s.guideTextContainer}>
          <Text style={s.title}>Session over? Review your summary.</Text>
          <Text style={s.subtitle}>
            Your summary appears here after each cleanup.{' '}
            <Text style={s.subtitleEmphasis}>Sessions are not automatically approved.</Text>
            {' '}We verify every one manually. Pay after orientation to redeem your free hour, then pay before you track again. We notify you in the app and by email. Confirm your court accepts this program.
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={0} style={s.illustrationZone}>
        <ExpoImage
          source={ONBOARDING_GRAPHICS.step5Illustration}
          style={s.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessibilityLabel="Completed session summary with under review status, duration, date, and time"
        />
      </CoachmarkEnter>

      <View style={s.footer}>
        <SessionSetupGuideFooterActions
          onContinuePress={() => {
            void skipSessionSetupGuideForward(router);
          }}
          onPreviousPress={() =>
            canUseSessionPhotos() ? goToSessionSetupStep4(router) : goToSessionSetupStep3(router)
          }
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

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },

  navContainer: {
    gap: 20,
  },

  guideTextContainer: {
    gap: 10,
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

  subtitleEmphasis: {
    fontFamily: 'NotoSans_700Bold',
    color: C.statusPendingText,
    textDecorationLine: 'underline',
  },

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
