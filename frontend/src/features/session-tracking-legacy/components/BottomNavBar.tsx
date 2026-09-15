import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, textStyles } from '../tokens';
import { Icon } from './Icon';

export type NavTab = 'home' | 'sessions';

type Props = {
  activeTab: NavTab | null;
  onHomePress?: () => void;
  onTrackPress?: () => void;
  onSessionsPress?: () => void;
  /** Track FAB shows a filled ring when a session is live — "returns to Live Session if active" (design.md §3). */
  sessionActive?: boolean;
};

/**
 * 3-item prototype bottom nav (design.md §9.1, Figma `536:2046`): Home ·
 * Track (FAB) · Sessions. Track opens Session Setup, or returns to the
 * live session if one is active. Shared by LiveSessionScreen and
 * dev/HomePlaceholderScreen so the minimize interaction reads consistently.
 */
export function BottomNavBar({
  activeTab,
  onHomePress,
  onTrackPress,
  onSessionsPress,
  sessionActive = false,
}: Props) {
  return (
    <View style={[styles.bar, shadows.navBottom]}>
      <NavTabButton
        label="Home"
        active={activeTab === 'home'}
        onPress={onHomePress}
        iconName="home"
      />
      <Pressable
        onPress={onTrackPress}
        accessibilityRole="button"
        accessibilityLabel={sessionActive ? 'Return to live session' : 'Start tracking'}
        style={[styles.fab, sessionActive && styles.fabActive]}
      >
        <Icon name="plusCircle" size={26} color={colors.textOnPrimary} />
      </Pressable>
      <NavTabButton
        label="Sessions"
        active={activeTab === 'sessions'}
        onPress={onSessionsPress}
        iconName="sessions"
      />
    </View>
  );
}

function NavTabButton({
  label,
  active,
  onPress,
  iconName,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
  iconName: 'home' | 'sessions';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      {active && <View style={styles.activeIndicator} />}
      <Icon name={iconName} size={22} color={active ? colors.primary : colors.textTertiary} />
      <Text style={[textStyles.navTab, { color: active ? colors.primary : colors.textTertiary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.textOnPrimary,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    minWidth: 64,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  fabActive: {
    borderWidth: 3,
    borderColor: colors.status.pending.border,
  },
});
