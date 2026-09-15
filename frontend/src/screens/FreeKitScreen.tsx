import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import { TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import { colors as C, textStyles } from '@/features/figma-screens/tokens';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  totalPills: number;
  activePills: number;
  onContinue: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  /** Session-setup guide only — shows the top-left back chevron. Omit in main onboarding. */
  onBack?: () => void;
};

/** Figma `free_kit` (1126:451) — "free cleanup kit" screen used in onboarding and session setup. */
export function FreeKitScreen({
  totalPills,
  activePills,
  onContinue,
  onPrevious,
  onSkip,
  onBack,
}: Props) {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.main}>
        <View style={s.navSection}>
          {onBack ? (
            <SessionSetupGuideNavRow
              total={totalPills}
              active={activePills}
              onBack={onBack}
            />
          ) : (
            <OnboardingProgressPills active={activePills} total={totalPills} />
          )}
        </View>

        <View style={s.titleSection}>
          <Text style={s.title}>Free cleanup kit!</Text>
          <Text style={s.subtitle}>
            {`After paying a one-time $${TRACKER_ACCESS_PRICE.toFixed(2)} fee you get unlimited tracking. A free cleanup kit is included by default at checkout, but you can opt out. `}
            <Text style={s.subtitleBold}>Shipping is free</Text>
            {'. Pick it up, or we can ship it via USPS.'}
          </Text>
        </View>

        <View style={s.graphicContainer}>
          <ExpoImage
            source={ONBOARDING_GRAPHICS.freeKitGraphic}
            style={s.graphic}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </View>

      <OnboardingInfoFooterActions
        onContinue={onContinue}
        onPrevious={onPrevious}
        onSkip={onSkip}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 30,
  },
  navSection: {
    gap: 20,
  },
  titleSection: {
    gap: 17,
  },
  title: {
    ...textStyles.headlinePage,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 22,
  },
  subtitleBold: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: C.primary,
    lineHeight: 22,
  },
  graphicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 280,
  },
  graphic: {
    width: '100%',
    height: 260,
  },
});
