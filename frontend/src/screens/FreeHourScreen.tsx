import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupGuideNavRow } from '@/components/session-setup/SessionSetupGuideNavRow';
import { colors as C, textStyles } from '@/features/figma-screens/tokens';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
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

/** Figma `disclaimer` (1125:360) — "One free hour!" info screen used in onboarding and session setup. */
export function FreeHourScreen({
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
          <Text style={s.title}>One hour of orientation</Text>
          <Text style={s.subtitle}>
            You get one free hour of orientation. To redeem it, complete another session after you
            pay for tracking.
          </Text>
        </View>

        <View style={s.graphicContainer} pointerEvents="none">
          <ExpoImage
            source={ONBOARDING_GRAPHICS.freeHourGraphic}
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
    zIndex: 1,
  },
  graphicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 36,
    paddingBottom: 200,
    overflow: 'hidden',
    minHeight: 0,
  },
  graphic: {
    width: 220,
    height: 368,
  },
  title: {
    ...textStyles.headlinePage,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 24,
  },
});
