import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { ensureTrackerAccessOrPaywall } from '@/utils/ensureTrackerAccess';
import { goToPreviousFromSessionSetupComplete, useSessionSetupGuidePillProgress } from '@/utils/sessionSetupGuideNavigation';
import { SessionSetupCelebration } from '@/components/session-setup/SessionSetupCelebration';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import { staggerDelay } from '@/motion';
import { colors as C, textStyles } from '@/constants/tokens';

/** Figma `session_setup_guide` finale (251:405) — "That's it! Let's get tracking!" */
export function SessionSetupCompleteScreen() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('complete');

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <CoachmarkEnter style={s.header}>
        <View style={s.navContainer}>
          <SessionSetupGuideNavRow total={total} active={active} />
        </View>

        <Text style={s.headline}>
          <Text style={s.headlineDark}>{"That's it! "}</Text>
          <Text style={s.headlineGreen}>{"Let's get tracking!"}</Text>
        </Text>
      </CoachmarkEnter>

      <View style={s.celebrationZone}>
        <SessionSetupCelebration />
      </View>

      <CoachmarkEnter delayMs={staggerDelay(1)}>
        <SessionSetupGuideFooterActions
          continueLabel="Start Tracking"
          hideSkip
          tertiaryLabel="Go Home"
          onTertiaryPress={() => router.dismissTo('/')}
          onContinuePress={() => {
            void (async () => {
              if (!(await ensureTrackerAccessOrPaywall(router))) {
                return;
              }
              router.push('/session-setup');
            })();
          }}
          onPreviousPress={() => {
            void goToPreviousFromSessionSetupComplete(router);
          }}
        />
      </CoachmarkEnter>

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

  headline: {
    ...textStyles.headlinePage,
  },
  headlineDark: {
    fontFamily: 'Sanchez_400Regular',
    color: C.textTertiary,
  },
  headlineGreen: {
    fontFamily: 'Sanchez_400Regular',
    color: C.primary,
  },

  celebrationZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
