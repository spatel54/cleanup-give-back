import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import { StyleSheet, Text, View } from 'react-native';

type TourNavVariant = 'light' | 'dark';

type TourNavButtonsProps = {
  variant?: TourNavVariant;
  onContinue: () => void;
  onPrevious: () => void;
  continueLabel?: string;
  previousLabel?: string;
  /** Pass true on the first tour slide to hide the Previous button. */
  hidePrevious?: boolean;
};

/** Shared Continue / Previous pair for onboarding tour screens. */
export function TourNavButtons({
  variant = 'light',
  onContinue,
  onPrevious,
  continueLabel = 'Continue',
  previousLabel = 'Previous',
  hidePrevious = false,
}: TourNavButtonsProps) {
  const isDark = variant === 'dark';

  return (
    <View style={s.container}>
      <AnimatedPressable
        style={[s.primaryBtn, isDark ? s.primaryBtnOnDark : s.primaryBtnOnLight]}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel={continueLabel}
      >
        <Text style={[s.primaryBtnText, isDark ? s.primaryBtnTextOnDark : s.primaryBtnTextOnLight]}>
          {continueLabel}
        </Text>
      </AnimatedPressable>
      {!hidePrevious && (
        <AnimatedPressable
          style={[s.secondaryBtn, isDark ? s.secondaryBtnOnDark : s.secondaryBtnOnLight]}
          onPress={onPrevious}
          accessibilityRole="button"
          accessibilityLabel={previousLabel}
        >
          <Text
            style={[s.secondaryBtnText, isDark ? s.secondaryBtnTextOnDark : s.secondaryBtnTextOnLight]}
          >
            {previousLabel}
          </Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    gap: 20,
  },
  primaryBtn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  primaryBtnOnLight: {
    backgroundColor: C.primary,
  },
  primaryBtnOnDark: {
    backgroundColor: C.bgApp,
  },
  primaryBtnText: {
    ...textStyles.labelButtonLarge,
  },
  /** Figma tour Continue on mint uses cream (bg-app), not white text-on-primary. */
  primaryBtnTextOnLight: {
    color: C.textOnPrimarySoft,
  },
  primaryBtnTextOnDark: {
    color: C.primary,
  },
  secondaryBtn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderWidth: 1,
  },
  secondaryBtnOnLight: {
    borderColor: C.primary,
    backgroundColor: 'transparent',
  },
  secondaryBtnOnDark: {
    borderColor: C.bgApp,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    ...textStyles.labelButtonLarge,
  },
  secondaryBtnTextOnLight: {
    color: C.primary,
  },
  secondaryBtnTextOnDark: {
    color: C.bgApp,
  },
});
