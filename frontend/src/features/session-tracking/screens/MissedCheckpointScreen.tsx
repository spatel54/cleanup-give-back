import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '../components/Icon';
import { SessionButton } from '../components/SessionButton';
import { durations, easing } from '../motion';
import { colors, radius, spacing, textStyles } from '../tokens';

type Props = {
  /** "Restart Session" — returns to SessionSetupScreen. */
  onRestart?: () => void;
  /** "Return Home" — exits the flow entirely. */
  onReturnHome?: () => void;
};

/**
 * PRD §6.13 · Figma `missed-checkpoint` (legacy HTML key `restart_required`)
 * — transactional, no nav shell. Recreates the icon's attention state as a
 * short native shake (`warningAttention` duration) instead of the legacy
 * `.error-pulse` CSS box-shadow keyframe (which was defined but unused in
 * the source prototype).
 */
export function MissedCheckpointScreen({ onRestart, onReturnHome }: Props) {
  const shakeX = useSharedValue(0);
  const contentProgress = useSharedValue(0);

  useEffect(() => {
    shakeX.value = withSequence(
      withTiming(-6, { duration: durations.warningAttention / 4, easing: easing.easeInOut }),
      withTiming(6, { duration: durations.warningAttention / 4, easing: easing.easeInOut }),
      withTiming(-3, { duration: durations.warningAttention / 4, easing: easing.easeInOut }),
      withTiming(0, { duration: durations.warningAttention / 4, easing: easing.easeOut }),
    );
    contentProgress.value = withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut });
  }, [shakeX, contentProgress]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentProgress.value,
    transform: [{ translateY: (1 - contentProgress.value) * 8 }],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconCircle, iconStyle]}>
          <Icon name="warningTriangle" size={40} color={colors.status.declined.text} />
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text style={[textStyles.headlineDetail, styles.headline]}>
            Photo checkpoint missed
          </Text>
          <View style={styles.infoCard}>
            <Text style={[textStyles.bodyDefault, styles.infoText]}>
              This session can&apos;t be submitted because a required photo checkpoint was
              missed.
            </Text>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Icon name="questionMarkCircle" size={18} color={colors.textTertiary} />
              <Text style={[textStyles.bodySmall, styles.infoRowText]}>
                To ensure accurate impact tracking, all required visual checkpoints must be
                completed during the active session. You will need to start a new session to
                record your progress.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actions, contentStyle]}>
          <SessionButton label="Restart Session" onPress={onRestart} />
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoText: {
    color: colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderOutline,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoRowText: {
    flex: 1,
    color: colors.textTertiary,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
