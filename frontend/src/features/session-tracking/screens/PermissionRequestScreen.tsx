import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ProgressPills } from '../components/ProgressPills';
import { SessionButton } from '../components/SessionButton';
import type { IconName } from '../components/Icon';
import { Icon } from '../components/Icon';
import { colors, screenPaddingHorizontal, spacing, textStyles } from '../tokens';

type Props = {
  icon: IconName;
  title: string;
  body: string;
  primaryLabel: string;
  stepIndex: number;
  stepCount: number;
  onEnable: () => void;
  onPrevious: () => void;
  onNotNow: () => void;
};

/**
 * Shared layout for Location/Camera permission requests (PRD §6.10, Figma
 * `location_permission` 728:639 / `camera_permission` 728:658 — both frames
 * are structurally identical aside from copy + icon). No real permission
 * request in this pass; `onEnable` just advances the mocked wizard state.
 */
export function PermissionRequestScreen({
  icon,
  title,
  body,
  primaryLabel,
  stepIndex,
  stepCount,
  onEnable,
  onPrevious,
  onNotNow,
}: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.progressWrap}>
        <ProgressPills total={stepCount} currentIndex={stepIndex} />
      </View>

      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationCircle}>
          <Icon name={icon} size={40} color={colors.primary} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={textStyles.headlinePage}>{title}</Text>
        <Text style={[textStyles.bodyDefault, styles.body]}>{body}</Text>
      </View>

      <View style={styles.actions}>
        <SessionButton label={primaryLabel} onPress={onEnable} />
        <SessionButton label="Previous" variant="secondary" onPress={onPrevious} />
        <SessionButton label="Not now" variant="text" onPress={onNotNow} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
    paddingHorizontal: screenPaddingHorizontal,
  },
  progressWrap: {
    marginTop: spacing.xl,
  },
  illustrationWrap: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
  },
  illustrationCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.status.approved.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: spacing['2xl'],
    gap: spacing.sm,
  },
  body: {
    color: colors.textTertiary,
  },
  actions: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
});
