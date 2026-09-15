// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.27 — Privacy & Permissions

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

interface Permission {
  name: string;
  enabled: boolean;
  note: string;
}

const PERMISSIONS: Permission[] = [
  {
    name: 'Location',
    enabled: true,
    note: 'Used to verify cleanup routes.',
  },
  {
    name: 'Camera',
    enabled: true,
    note: 'Used for photo checkpoints.',
  },
  {
    name: 'Notifications',
    enabled: true,
    note: 'Used for checkpoints and updates.',
  },
];

export function PrivacyPermissions({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Privacy & Permissions"
        onBack={() => go('account')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Permission rows ── */}
        <View style={styles.permissionList}>
          {PERMISSIONS.map((perm, idx) => (
            <View key={perm.name}>
              <View style={styles.permissionRow}>
                <View style={styles.permissionMain}>
                  <View style={styles.permissionHeader}>
                    <Text style={styles.permissionName}>{perm.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        perm.enabled ? styles.statusBadgeEnabled : styles.statusBadgeDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          perm.enabled
                            ? styles.statusBadgeTextEnabled
                            : styles.statusBadgeTextDisabled,
                        ]}
                      >
                        {perm.enabled ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.permissionNote}>{perm.note}</Text>
                </View>
              </View>
              {idx < PERMISSIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={styles.gap32} />

        <PrimaryButton
          label="Open Device Settings"
          onPress={() => {}}
          accessibilityLabel="Open device settings to change permissions"
        />

        <View style={styles.gap16} />

        <Text style={styles.footerNote}>
          To change permissions, open your device settings and find Clean-Up Give Back.
        </Text>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  } as ViewStyle,

  permissionList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  } as ViewStyle,
  permissionRow: {
    padding: 16,
  } as ViewStyle,
  permissionMain: {
    gap: 6,
  } as ViewStyle,
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  permissionName: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
  permissionNote: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  } as ViewStyle,
  statusBadgeEnabled: {
    backgroundColor: Colors.approvedContainer,
  } as ViewStyle,
  statusBadgeDisabled: {
    backgroundColor: Colors.errorContainer,
  } as ViewStyle,
  statusBadgeText: {
    ...(Typography.labelSmall as TextStyle),
    fontWeight: '600',
  } as TextStyle,
  statusBadgeTextEnabled: {
    color: Colors.primaryDeep,
  } as TextStyle,
  statusBadgeTextDisabled: {
    color: Colors.error,
  } as TextStyle,

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  } as ViewStyle,

  footerNote: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  gap32: {
    height: 32,
  } as ViewStyle,
  gap16: {
    height: 16,
  } as ViewStyle,
  bottomPad: {
    height: 40,
  } as ViewStyle,
});
