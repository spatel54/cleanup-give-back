import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '../components/Icon';
import { SessionButton } from '../components/SessionButton';
import { StatusPill } from '../components/StatusPill';
import { durations, easing, enterFrom, popSpring } from '../motion';
import { mockReviewedSession } from '../mocks/session';
import { colors, radius, spacing, textStyles } from '../tokens';

type Props = {
  /** "View Session" — would open Session Detail (§6.18, out of this flow's scope). */
  onViewSession?: () => void;
  onReturnHome?: () => void;
};

/**
 * PRD §6.15 · Figma `Submission Confirmation - PRD Aligned` — rebuilt from
 * `prototype/screens/session/SubmissionConfirmation.tsx`'s copy/layout with
 * the same checkmark pop-in language as PhotoSubmittedScreen for a
 * consistent "success" motif across the feature.
 */
export function SubmissionConfirmationScreen({ onViewSession, onReturnHome }: Props) {
  const s = mockReviewedSession;
  const checkScale = useSharedValue<number>(enterFrom.scale);
  const checkOpacity = useSharedValue<number>(enterFrom.opacity);
  const contentProgress = useSharedValue(0);

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: durations.checkmarkPop, easing: easing.easeOut });
    checkScale.value = withSpring(1, popSpring);
    contentProgress.value = withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut });
  }, [checkOpacity, checkScale, contentProgress]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentProgress.value,
    transform: [{ translateY: (1 - contentProgress.value) * enterFrom.translateY }],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <Icon name="checkCircle" size={40} color={colors.textOnPrimary} />
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text style={[textStyles.headlinePage, styles.headline]}>Submitted</Text>
          <Text style={[textStyles.bodyDefault, styles.subhead]}>
            Your session is under review.
          </Text>
        </Animated.View>

        <Animated.View style={contentStyle}>
          <StatusPill status="pending" label="Under Review" />
        </Animated.View>

        <Animated.View style={[styles.summaryCard, contentStyle]}>
          <Text style={textStyles.headlineDetail}>{s.durationLabel}</Text>
          <Text style={[textStyles.bodyDefault, styles.mutedText]}>{s.dateLabel}</Text>
          <Text style={textStyles.bodyStrong}>{s.title}</Text>
        </Animated.View>

        <Animated.View style={[styles.actions, contentStyle]}>
          <SessionButton label="View Session" onPress={onViewSession} />
          <SessionButton label="Return Home" variant="secondary" onPress={onReturnHome} />
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
    marginBottom: spacing.xs,
  },
  subhead: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  mutedText: {
    color: colors.textTertiary,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
