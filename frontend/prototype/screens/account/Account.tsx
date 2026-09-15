// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.25 — Account

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function Account({ go }: Props) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader variant="root" title="Account" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SP</Text>
          </View>
          <Text style={styles.profileName}>Shivam Patel</Text>
          <Text style={styles.profileEmail}>shivam@email.com</Text>
          <Text style={styles.profileMeta}>Court-Ordered: No</Text>
        </View>

        {/* ── Service Summary ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          SERVICE SUMMARY
        </Text>
        <View style={styles.statsGrid}>
          <StatCard value="42.5" label="Total Hours" valueColor={Colors.primary} />
          <StatCard value="18" label="Sessions" valueColor={Colors.primary} />
          <StatCard value="36.0" label="Approved Hrs" valueColor={Colors.primary} />
          <StatCard value="6.5" label="Under Review" valueColor={Colors.accent} />
        </View>

        {/* ── Records ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          RECORDS
        </Text>
        <View style={styles.navGroup}>
          <NavRow
            label="Export Service Record"
            onPress={() => go('export-record')}
          />
          <View style={styles.navDivider} />
          <NavRow
            label="Approval History"
            onPress={() => go('sessions-list')}
          />
        </View>

        {/* ── Shop ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          SHOP
        </Text>
        <View style={styles.navGroup}>
          <NavRow
            label="Order History"
            onPress={() => go('order-history')}
          />
          <View style={styles.navDivider} />
          <NavRow
            label="Donation History"
            onPress={() => go('donation-history')}
          />
        </View>

        {/* ── Preferences ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          PREFERENCES
        </Text>
        <View style={styles.navGroup}>
          <View style={styles.switchRow}>
            <TouchableOpacity
              onPress={() => go('notification-settings')}
              accessibilityRole="button"
              accessibilityLabel="Notification Settings"
              style={styles.switchLabelTouchable}
            >
              <Text style={styles.navLabel}>Notifications</Text>
            </TouchableOpacity>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
              accessibilityRole="switch"
              accessibilityLabel="Toggle notifications"
              accessibilityState={{ checked: notificationsEnabled }}
            />
          </View>
          <View style={styles.navDivider} />
          <NavRow
            label="Privacy & Permissions"
            onPress={() => go('privacy-permissions')}
          />
        </View>

        {/* ── Account ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          ACCOUNT
        </Text>
        <View style={styles.navGroup}>
          <NavRow label="Settings" onPress={() => {}} />
          <View style={styles.navDivider} />
          <TouchableOpacity
            style={styles.navRow}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text style={styles.logoutLabel}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, valueColor }: { value: string; label: string; valueColor: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NavRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navRow}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navChevron}>›</Text>
    </TouchableOpacity>
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

  // Profile
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  } as ViewStyle,
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  } as ViewStyle,
  avatarText: {
    ...(Typography.headlineSmall as TextStyle),
    color: Colors.white,
    fontWeight: '700',
  } as TextStyle,
  profileName: {
    ...(Typography.labelXLarge as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
  profileEmail: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  profileMeta: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Section label
  sectionLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  } as TextStyle,

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  } as ViewStyle,
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  } as ViewStyle,
  statValue: {
    ...(Typography.monoLarge as TextStyle),
  } as TextStyle,
  statLabel: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  // Nav group
  navGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  } as ViewStyle,
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  } as ViewStyle,
  navLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  navChevron: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    fontSize: 20,
  } as TextStyle,
  navDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  } as ViewStyle,

  // Switch row
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  } as ViewStyle,
  switchLabelTouchable: {
    flex: 1,
  } as ViewStyle,

  // Log out
  logoutLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.error,
  } as TextStyle,

  bottomPad: {
    height: 32,
  } as ViewStyle,
});
