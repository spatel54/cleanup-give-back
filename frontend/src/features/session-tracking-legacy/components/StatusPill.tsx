import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, textStyles } from '../tokens';

export type StatusPillStatus = 'approved' | 'pending' | 'declined' | 'active';

type Props = {
  status: StatusPillStatus;
  label: string;
};

const statusColors: Record<StatusPillStatus, { bg: string; text: string; border: string }> = {
  approved: colors.status.approved,
  pending: colors.status.pending,
  declined: colors.status.declined,
  active: { bg: colors.status.approved.bg, text: colors.primary, border: colors.primary },
};

/**
 * Approved / Under Review / Not Approved / GPS-active chip — one component
 * per plan (`components/StatusPill.tsx`). `active` pulses its dot gently
 * (2s cycle, opacity-only) to read as "live", per the legacy
 * `live_session___refined_map_tracker.html` reference — skipped under
 * reduced motion.
 */
export function StatusPill({ status, label }: Props) {
  const palette = statusColors[status];
  const reducedMotion = useReducedMotion();
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    if (status !== 'active' || reducedMotion) {
      dotOpacity.value = 1;
      return;
    }
    dotOpacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
    );
    return () => cancelAnimation(dotOpacity);
  }, [status, reducedMotion, dotOpacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Animated.View style={[styles.dot, { backgroundColor: palette.text }, dotStyle]} />
      <Text style={[textStyles.labelStatus, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
