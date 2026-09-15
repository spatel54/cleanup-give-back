import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { colors, radius, spacing, textStyles } from '../tokens';
import type { IconName } from './Icon';
import { Icon } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  description: string;
  granted: boolean;
  onToggle?: () => void;
};

/**
 * Recap row for a single permission (location/camera) — used on
 * SessionSetupScreen's intro step. Mocked toggle only; no real permission
 * request in this pass (see README "Functionality" note).
 */
export function PermissionToggleRow({ icon, title, description, granted, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBadge}>
        <Icon name={icon} size={20} color={colors.textPrimary} />
      </View>
      <View style={styles.textColumn}>
        <Text style={textStyles.bodyEmphasis}>{title}</Text>
        <Text style={[textStyles.bodySmall, styles.description]}>{description}</Text>
      </View>
      <AnimatedPressable
        onPress={onToggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: granted }}
        accessibilityLabel={`${title}, ${granted ? 'enabled' : 'not enabled'}`}
        style={[styles.statusChip, granted ? styles.statusChipGranted : styles.statusChipPending]}
      >
        <Text
          style={[
            textStyles.labelStatus,
            { color: granted ? colors.status.approved.text : colors.textTertiary },
          ]}
        >
          {granted ? 'Enabled' : 'Enable'}
        </Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  description: {
    color: colors.textTertiary,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusChipGranted: {
    backgroundColor: colors.status.approved.bg,
    borderColor: colors.status.approved.border,
  },
  statusChipPending: {
    backgroundColor: 'transparent',
    borderColor: colors.borderOutline,
  },
});
