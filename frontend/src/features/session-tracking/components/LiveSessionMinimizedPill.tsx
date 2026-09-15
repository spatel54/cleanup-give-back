import { forwardRef } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimatedProgressFill } from '@/components/motion/hooks';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { ExpandIcon } from '@/features/figma-screens/components/HomeIcons';
import { colors, fontFamilies, radius as R, status as statusColors, textStyles } from '@/features/figma-screens/tokens';
import {
  formatCountdown,
  formatElapsed,
} from '@/features/session-tracking/mocks/session';
import type { PhotoCheckpointSubmission } from '@/features/session-tracking/liveSessionStore';

const PILL_MIN_HEIGHT = 112;

function formatDistanceMiles(miles: number): string {
  if (!Number.isFinite(miles) || miles <= 0) {
    return '0.0';
  }
  if (miles < 0.1) {
    return miles.toFixed(2);
  }
  return miles.toFixed(1);
}

type Props = ViewProps & {
  distanceMiles: number;
  elapsedSeconds: number;
  checkpointSecondsRemaining: number;
  checkpointDueOrGrace: boolean;
  checkpointOverdueSeconds: number;
  checkpointProgress: number;
  submittedCheckpoints: PhotoCheckpointSubmission[];
  photosEnabled?: boolean;
  onExpand?: () => void;
  showExpandButton?: boolean;
};

/** Green minimized tracker pill — Figma node `622:176` on the home dashboard. */
export const LiveSessionMinimizedPill = forwardRef<View, Props>(function LiveSessionMinimizedPill(
  {
    distanceMiles,
    elapsedSeconds,
    checkpointSecondsRemaining,
    checkpointDueOrGrace,
    checkpointOverdueSeconds,
    checkpointProgress,
    submittedCheckpoints: _submittedCheckpoints,
    photosEnabled = true,
    onExpand,
    showExpandButton = false,
    style,
    ...rest
  },
  ref,
) {
  const progressFillStyle = useAnimatedProgressFill(checkpointProgress);
  // Urgent/red state kicks in the instant the checkpoint is due — not gated
  // behind dismissing the "Take Photo" prompt.
  const ignored = checkpointDueOrGrace;

  const timeLeftLabel = checkpointDueOrGrace ? 'elapsed' : 'time left';
  const timeLeftValue = checkpointDueOrGrace
    ? formatCountdown(checkpointOverdueSeconds)
    : formatCountdown(checkpointSecondsRemaining);

  const liveChromeColor = ignored ? colors.textOnPrimary : colors.textPrimary;

  const body = (
    <>
      {/* Yellow top bar — always visible; flips to red with white type when checkpoint is ignored */}
      <View style={[styles.liveBar, ignored && styles.liveBarIgnored]}>
        <Text style={[styles.liveText, { color: liveChromeColor }]}>Live</Text>
        {showExpandButton && onExpand ? (
          <View style={styles.expandBtn} pointerEvents="none">
            <ExpandIcon color={liveChromeColor} />
          </View>
        ) : null}
      </View>

      <View style={styles.statRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{formatDistanceMiles(distanceMiles)}</Text>
          <Text style={styles.statUnit}>mi</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{formatElapsed(elapsedSeconds)}</Text>
          <Text style={styles.statUnit}>time</Text>
        </View>
        {photosEnabled ? (
          <View style={styles.statBlock}>
            <Text style={styles.timeLeftValue}>{timeLeftValue}</Text>
            <Text style={styles.statUnit}>{timeLeftLabel}</Text>
          </View>
        ) : null}
      </View>

      {photosEnabled ? (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
      ) : null}
    </>
  );

  const pillStyle = [styles.pill, style, ignored && styles.pillIgnored];

  if (onExpand) {
    return (
      <AnimatedPressable
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel="Open live session tracker"
        style={pillStyle}
        {...rest}
      >
        {body}
      </AnimatedPressable>
    );
  }

  return (
    <View ref={ref} style={pillStyle} {...rest}>
      {body}
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.primary,
    borderRadius: R.md,
    paddingBottom: 12,
    minHeight: PILL_MIN_HEIGHT,
    justifyContent: 'space-between',
    gap: 8,
    overflow: 'hidden',
  },
  pillIgnored: {
    backgroundColor: statusColors.declined.border,
  },
  liveBar: {
    backgroundColor: colors.statusPendingBorder,
    borderTopLeftRadius: R.md,
    borderTopRightRadius: R.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 9,
    minHeight: 36,
  },
  liveBarIgnored: {
    backgroundColor: statusColors.declined.text,
  },
  liveText: {
    ...textStyles.bodySmall,
    fontFamily: fontFamilies.notoSansSemiBold,
    textAlign: 'center',
    flex: 1,
  },
  expandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statBlock: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 24,
    color: colors.textOnPrimary,
  },
  timeLeftValue: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 24,
    color: colors.textOnPrimary,
  },
  statUnit: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textOnPrimary,
    textAlign: 'center',
    opacity: 0.75,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderOutline,
    borderRadius: R.full,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  progressFill: {
    width: '100%',
    height: 6,
    backgroundColor: colors.statusPendingBorder,
    borderRadius: R.full,
    transformOrigin: 'left',
  },
});

export { PILL_MIN_HEIGHT as LIVE_SESSION_PILL_MIN_HEIGHT };
