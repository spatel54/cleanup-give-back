import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon } from '../components/Icon';
import { SessionButton } from '../components/SessionButton';
import { durations, easing, enterFrom, popSpring } from '../motion';
import { formatCountdown, mockSession } from '../mocks/session';
import { colors, radius, spacing, textStyles } from '../tokens';

type Props = {
  /** "Continue Tracking" — returns to LiveSessionScreen. */
  onContinue?: () => void;
};

/**
 * PRD §6.12 · Figma `photo_submitted` — rebuilt from
 * `assets/stitch/photo_submitted.html`'s `pop-in` + `fade-in-up` CSS
 * keyframes as native Reanimated: checkmark pop (`popSpring`, scale+opacity
 * from `enterFrom`), then 3 staggered fade-ups for headline/body, the next-
 * photo timer chip, and the CTA — replacing the CSS `animation-delay` chain.
 */
export function PhotoSubmittedScreen({ onContinue }: Props) {
  const checkScale = useSharedValue<number>(enterFrom.scale);
  const checkOpacity = useSharedValue<number>(enterFrom.opacity);
  const headlineProgress = useSharedValue(0);
  const chipProgress = useSharedValue(0);
  const ctaProgress = useSharedValue(0);

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: durations.checkmarkPop, easing: easing.easeOut });
    checkScale.value = withSpring(1, popSpring);
    headlineProgress.value = withDelay(120, withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut }));
    chipProgress.value = withDelay(220, withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut }));
    ctaProgress.value = withDelay(320, withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut }));
  }, [checkOpacity, checkScale, headlineProgress, chipProgress, ctaProgress]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));
  const useFadeUp = (progress: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * enterFrom.translateY }],
    }));
  const headlineStyle = useFadeUp(headlineProgress);
  const chipStyle = useFadeUp(chipProgress);
  const ctaStyle = useFadeUp(ctaProgress);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <Icon name="checkCircle" size={40} color={colors.textOnPrimary} />
        </Animated.View>

        <Animated.View style={headlineStyle}>
          <Text style={[textStyles.headlinePage, styles.headline]}>Photo Submitted</Text>
          <Text style={[textStyles.bodyDefault, styles.body]}>
            Your progress photo has been recorded. Keep up the great work!
          </Text>
        </Animated.View>

        <Animated.View style={[styles.timerChip, chipStyle]}>
          <Icon name="checkCircle" size={16} color={colors.primary} />
          <Text style={[textStyles.labelStatus, styles.timerText]}>
            Next photo in {formatCountdown(mockSession.photoCheckpointIntervalSeconds)}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaWrap, ctaStyle]}>
          <SessionButton label="Continue Tracking" onPress={onContinue} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textTertiary,
    textAlign: 'center',
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
  },
  timerText: {
    color: colors.textPrimary,
  },
  ctaWrap: {
    width: '100%',
  },
});
