import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { colors as C } from '@/constants/tokens';

type Props = {
  total: number;
  active: number;
  /**
   * Navigates to whatever screen the user was on before this step. Omit to
   * hide the chevron entirely (e.g. the guide finale, which has no back step).
   */
  onBack?: () => void;
};

/**
 * Shared nav row for every session-setup guide/onboarding screen — a leftward
 * back chevron (top-left) followed by the step `OnboardingProgressPills`, so
 * back navigation persists across the whole guide flow.
 */
export function SessionSetupGuideNavRow({ total, active, onBack }: Props) {
  return (
    <View style={s.row}>
      {onBack && (
        <AnimatedPressable
          style={s.backBtn}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={C.textPrimary} />
        </AnimatedPressable>
      )}

      <View style={s.pillsWrap}>
        <OnboardingProgressPills total={total} active={active} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pillsWrap: {
    flex: 1,
  },
});
