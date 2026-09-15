import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '../components/Icon';
import { SessionButton } from '../components/SessionButton';
import { durations, easing, modalSpring } from '../motion';
import { formatCountdown, mockSession } from '../mocks/session';
import { colors, radius, spacing, textStyles } from '../tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

type Props = {
  /** "Take Photo" — advances to PhotoSubmittedScreen. */
  onTakePhoto?: () => void;
  /** Swipe-down or backdrop tap — returns to LiveSessionScreen without submitting. */
  onDismiss?: () => void;
  nextCheckInSeconds?: number;
};

/**
 * PRD §6.12 · Figma `photo_checkpoint` — draggable bottom sheet, rebuilt from
 * `stitch_htmls/photo_checkpoint.html` using a Reanimated + Gesture Handler
 * pan (replaces the legacy prototype's `Animated`/`PanResponder` pair) for
 * a native-thread, natural rubber-band drag-to-dismiss.
 */
export function PhotoCheckpointScreen({
  onTakePhoto,
  onDismiss,
  nextCheckInSeconds = mockSession.photoCheckpointIntervalSeconds - 18,
}: Props) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, modalSpring);
    backdropOpacity.value = withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
  }, [translateY, backdropOpacity]);

  const dismiss = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: durations.modalExit,
      easing: easing.easeInOut,
    });
    backdropOpacity.value = withTiming(0, { duration: durations.modalExit });
    setTimeout(() => onDismiss?.(), durations.modalExit);
  };

  const pan = Gesture.Pan()
    .onChange((event) => {
      const next = translateY.value + event.changeY;
      // Rubber-band above the resting position; free movement below it.
      translateY.value = next < 0 ? next * 0.15 : next;
    })
    .onEnd((event) => {
      if (translateY.value > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, modalSpring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.sheet, sheetStyle]}
          accessibilityViewIsModal
          accessibilityLabel="Photo checkpoint required"
        >
          <View style={styles.handle} />

          <View style={styles.iconBadge}>
            <Icon name="camera" size={32} color={colors.status.pending.text} />
          </View>

          <Text style={[textStyles.headlineDetail, styles.headline]}>Photo required</Text>
          <Text style={[textStyles.bodyDefault, styles.body]}>
            Submit a photo to verify your cleanup progress. Required every 30 minutes during
            active tracking.
          </Text>

          <SessionButton label="Take Photo" onPress={onTakePhoto} style={styles.cta} />

          <View style={styles.timerChip}>
            <Text style={[textStyles.labelStatus, styles.timerText]}>
              Next check-in: {formatCountdown(nextCheckInSeconds)}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 27, 27, 0.4)',
  },
  sheet: {
    backgroundColor: colors.bgApp,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.borderOutline,
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.status.pending.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  headline: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    width: '100%',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderChipSelected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  timerText: {
    color: colors.textTertiary,
  },
});
