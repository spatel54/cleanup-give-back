import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { pressScale, pressSpring } from '../motion';
import { colors, primitives, radius, spacing, textStyles } from '../tokens';
import { Icon } from './Icon';

type Props = {
  distanceMiles: number;
  elapsedLabel: string;
  timeLeftLabel: string;
  /** 0-1 progress toward the next photo checkpoint. */
  progress: number;
  onExpand?: () => void;
};

/**
 * Pinned above the bottom nav when a live session is minimized — matches
 * Figma node `622:176` inside `home_dashboard___final_branding` (`406:291`)
 * exactly: `color/primary` pill, `radius-md`, distance + elapsed time in
 * white, time-left in amber/pending, a 6px progress track, and an expand
 * chevron. See docs/frontend/brand.md for the token sources.
 */
export function MinimizedTrackerBar({
  distanceMiles,
  elapsedLabel,
  timeLeftLabel,
  progress,
  onExpand,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onExpand}
        onPressIn={() => {
          scale.value = withSpring(pressScale.subtle, pressSpring);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, pressSpring);
        }}
        accessibilityRole="button"
        accessibilityLabel="Live session in progress. Expand tracker."
        style={styles.pill}
      >
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[textStyles.minimizedStatValue, styles.whiteText]}>{distanceMiles.toFixed(1)}</Text>
            <Text style={[textStyles.bodySmall, styles.whiteLabel]}>mi</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[textStyles.minimizedStatValue, styles.whiteText]}>{elapsedLabel}</Text>
            <Text style={[textStyles.bodySmall, styles.whiteLabel]}>time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[textStyles.dataStat, styles.amberText]}>{timeLeftLabel}</Text>
            <Text style={[textStyles.bodySmall, styles.whiteLabel]}>time left</Text>
          </View>
          <Icon name="chevronUp" size={18} color={colors.textOnPrimary} />
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stat: {
    alignItems: 'flex-start',
  },
  whiteText: {
    color: colors.textOnPrimary,
  },
  whiteLabel: {
    color: primitives.gray300,
    fontSize: 12,
    lineHeight: 14,
  },
  amberText: {
    color: primitives.amber500,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: primitives.gray300,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: primitives.amber500,
  },
});
