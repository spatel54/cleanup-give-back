import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import {
  exitSessionSetupGuideToTrackEntry,
  goToSessionSetupGuide,
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
import { colors as C, textStyles } from '@/constants/tokens';

export function SessionSetupStep2Screen() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('step2');

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
          <Text style={s.title}>First up is session setup.</Text>
          <Text style={s.subtitle}>
            Fill out necessary details before you start. Otherwise you cannot start a new session.
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={0} style={s.illustrationZone}>
        <ExpoImage
          source={ONBOARDING_GRAPHICS.step2Illustration}
          style={s.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessibilityLabel="Session setup form with activity, date, and permission toggles"
        />
      </CoachmarkEnter>

      <View style={s.footer}>
        <SessionSetupGuideFooterActions
          onContinuePress={() => router.push('/session-setup-step3')}
          onPreviousPress={() => goToSessionSetupGuide(router)}
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

  // Header — gap 20 between nav and guide text
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },

  // Nav row — gap 20 between back arrow and pills
  navContainer: {
    gap: 20,
  },

  // Guide text — gap 10 between title and subtitle
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
