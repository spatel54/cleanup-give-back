import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  onContinue: () => void;
  onPrevious: () => void;
  /** Omit along with `hideSkip` on screens with no skippable action (e.g. the account-details form steps). */
  onSkip?: () => void;
  /** Defaults to "Continue" — permission screens pass "Enable location" / "Enable camera" / etc. */
  continueLabel?: string;
  /** Defaults to "Skip" — permission screens pass "Not now". */
  skipLabel?: string;
  /** Dims the Continue button and blocks Skip while a permission request is in flight. */
  disabled?: boolean;
  /** Hides the Skip button for screens with only Continue / Previous (e.g. the account-details form steps). */
  hideSkip?: boolean;
  /** Tighter padding/button height — used by the account-details form steps to sit closer to Personal Details' footer scale. */
  compact?: boolean;
};

/**
 * Shared Continue / Previous / Skip footer for onboarding info + permission screens
 * (free-hour, free-kit, location-permission, camera-permission, notification-preference).
 *
 * Figma `disclaimer` (1125:360) Footer — pinned to the bottom edge with an opaque fill so it
 * covers the lower portion of the hero graphic behind it, with a secondary outline border on top.
 */
export function OnboardingInfoFooterActions({
  onContinue,
  onPrevious,
  onSkip,
  continueLabel = 'Continue',
  skipLabel = 'Skip',
  disabled = false,
  hideSkip = false,
  compact = false,
}: Props) {
  return (
    <View style={[s.footer, compact && s.footerCompact]}>
      <View style={s.buttonContainer}>
        <AnimatedPressable
          style={[s.continueBtn, compact && s.btnCompact, disabled && s.continueBtnDisabled]}
          onPress={onContinue}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={continueLabel}
        >
          <Text style={s.continueBtnText}>{continueLabel}</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[s.previousBtn, compact && s.btnCompact]}
          onPress={onPrevious}
          accessibilityRole="button"
          accessibilityLabel="Previous"
        >
          <Text style={s.previousBtnText}>Previous</Text>
        </AnimatedPressable>
      </View>
      {!hideSkip && onSkip && (
        <AnimatedPressable
          style={s.skipBtn}
          onPress={onSkip}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
        >
          <Text style={s.skipBtnText}>{skipLabel}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bgApp,
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
    paddingHorizontal: 16,
    paddingTop: 38,
    paddingBottom: 28,
    gap: 12,
    alignItems: 'center',
  },
  footerCompact: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  btnCompact: {
    paddingVertical: 18,
  },
  continueBtnDisabled: {
    opacity: 0.7,
  },
  continueBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.textOnPrimary,
  },
  previousBtn: {
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  previousBtnText: {
    ...textStyles.labelButtonLarge,
    color: C.primary,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  skipBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontWeight: '600',
    fontSize: 16,
    color: C.primary,
  },
});
