import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { BottomNavBar } from '../components/BottomNavBar';
import { LiveSessionMap } from '../components/LiveSessionMap';
import { SessionButton } from '../components/SessionButton';
import { StatusPill } from '../components/StatusPill';
import { formatCountdown, formatElapsed, mockSession } from '../mocks/session';
import { colors, radius, screenPaddingHorizontal, spacing, textStyles } from '../tokens';

type Props = {
  /** Tapping "Submit Photo" — opens the PhotoCheckpointScreen sheet. */
  onSubmitPhoto?: () => void;
  /** Tapping "End Session" — advances to SessionReviewScreen. */
  onEndSession?: () => void;
  /**
   * Tapping the bottom-nav Home tab while this session is live — the parent
   * (dev/PreviewApp) swaps to the Home screen and keeps rendering this
   * session's stats inside a MinimizedTrackerBar (Figma `622:176`). This
   * screen only reports the intent; it does not own the minimized state.
   */
  onMinimize?: () => void;
  onOpenSessions?: () => void;
};

/**
 * PRD §6.11 · Figma `live_session` — no direct frame yet, built from
 * `live_session___refined_map_tracker.html` + `prototype/screens/session/LiveSession.tsx`
 * copy, re-laid-out full-bleed over the real `LiveSessionMap`.
 */
export function LiveSessionScreen({ onSubmitPhoto, onEndSession, onMinimize, onOpenSessions }: Props) {
  const [elapsedSeconds, setElapsedSeconds] = useState(mockSession.elapsedSeconds);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const intervalSeconds = mockSession.photoCheckpointIntervalSeconds;
  const secondsIntoInterval = elapsedSeconds % intervalSeconds;
  const secondsUntilNextPhoto = intervalSeconds - secondsIntoInterval;
  const checkpointProgress = secondsIntoInterval / intervalSeconds;

  return (
    <View style={styles.root}>
      <LiveSessionMap style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <StatusPill status="active" label="LIVE" />
        </View>

        <View style={styles.timerCard}>
          <Text
            style={[textStyles.dataTimer, styles.timerText]}
            accessibilityLabel={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
          >
            {formatElapsed(elapsedSeconds)}
          </Text>
          <Text style={[textStyles.bodyEmphasis, styles.sessionName]}>{mockSession.title}</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.checkpointCard}>
          <View style={styles.checkpointHeaderRow}>
            <Text style={textStyles.headlineDetail}>Checkpoint Photo</Text>
            <Text style={[textStyles.bodySmall, styles.countdownText]}>
              Next due in {formatCountdown(secondsUntilNextPhoto)}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${checkpointProgress * 100}%` }]} />
          </View>
          <View style={styles.checkpointActions}>
            <SessionButton label="Submit Photo" onPress={onSubmitPhoto} />
            <SessionButton label="End Session" variant="secondary" onPress={onEndSession} />
          </View>
        </View>
      </SafeAreaView>

      <BottomNavBar activeTab={null} sessionActive onHomePress={onMinimize} onSessionsPress={onOpenSessions} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  overlay: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  timerCard: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginHorizontal: screenPaddingHorizontal,
    backgroundColor: 'rgba(252, 249, 248, 0.85)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  timerText: {
    color: colors.textPrimary,
  },
  sessionName: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  checkpointCard: {
    backgroundColor: colors.bgApp,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  checkpointHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownText: {
    color: colors.textTertiary,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.borderChipSelected,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.status.pending.border,
  },
  checkpointActions: {
    gap: spacing.sm,
  },
});
