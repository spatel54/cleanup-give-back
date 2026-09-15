import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import {
  captureSessionSetupGuideReturnHref,
  exitSessionSetupGuideToTrackEntry,
  resetSessionSetupGuideReturnHref,
  skipSessionSetupGuideForward,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as C, textStyles } from '@/constants/tokens';

export function SessionSetupGuideScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  const { total, active } = useSessionSetupGuidePillProgress('guide');

  useEffect(() => {
    if (entry === 'onboarding') {
      resetSessionSetupGuideReturnHref();
      return;
    }

    const state = navigation.getState();
    if (state) {
      captureSessionSetupGuideReturnHref(state);
    }
  }, [entry, navigation]);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
    NotoSans_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header — gap 30 between top section and headline, gap 20 within top section */}
      <View style={s.header}>
        <View style={s.topSection}>
          <SessionSetupGuideNavRow
            total={total}
            active={active}
            onBack={() => exitSessionSetupGuideToTrackEntry(router)}
          />
        </View>

        <CoachmarkEnter>
          <Text style={s.headline}>
            <Text style={s.headlineDark}>{'How does this work? '}</Text>
            <Text style={s.headlineGreen}>{"Let's walk through it."}</Text>
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={0} style={s.illustrationZone}>
        <ExpoImage
          source={ONBOARDING_GRAPHICS.guideIllustration}
          style={s.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
        />
      </CoachmarkEnter>

      <View style={s.footer}>
        <SessionSetupGuideFooterActions
          hidePrevious
          onContinuePress={() => router.push('/session-setup-step2')}
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

  // Header container — left/right pad 16, gap 30 between top section and headline
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 30,
  },

  // Top section (back arrow + pills) — gap 20
  topSection: {
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
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
  },
});
