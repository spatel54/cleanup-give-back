// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.26 — Notification Settings

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Switch,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing } from '../../constants/Typography';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

interface ToggleState {
  sessionReview: boolean;
  approvalStatus: boolean;
  photoCheckpoint: boolean;
  newEvents: boolean;
  orderUpdates: boolean;
  donationConfirmations: boolean;
}

export function NotificationSettings({ go }: Props) {
  const [toggles, setToggles] = useState<ToggleState>({
    sessionReview: true,
    approvalStatus: true,
    photoCheckpoint: true,
    newEvents: true,
    orderUpdates: true,
    donationConfirmations: true,
  });

  function toggle(key: keyof ToggleState) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Notifications"
        onBack={() => go('account')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Session Updates ── */}
        <Text style={styles.sectionTitle}>SESSION UPDATES</Text>
        <View style={styles.group}>
          <ToggleRow
            label="Session review updates"
            value={toggles.sessionReview}
            onValueChange={() => toggle('sessionReview')}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Approval status updates"
            value={toggles.approvalStatus}
            onValueChange={() => toggle('approvalStatus')}
          />
        </View>

        {/* ── Tracking ── */}
        <Text style={styles.sectionTitle}>TRACKING</Text>
        <View style={styles.group}>
          <ToggleRow
            label="Photo checkpoint reminders"
            value={toggles.photoCheckpoint}
            onValueChange={() => toggle('photoCheckpoint')}
          />
        </View>

        {/* ── Events ── */}
        <Text style={styles.sectionTitle}>EVENTS</Text>
        <View style={styles.group}>
          <ToggleRow
            label="New event alerts"
            value={toggles.newEvents}
            onValueChange={() => toggle('newEvents')}
          />
        </View>

        {/* ── Shop + Donations ── */}
        <Text style={styles.sectionTitle}>SHOP + DONATIONS</Text>
        <View style={styles.group}>
          <ToggleRow
            label="Order updates"
            value={toggles.orderUpdates}
            onValueChange={() => toggle('orderUpdates')}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Donation confirmations"
            value={toggles.donationConfirmations}
            onValueChange={() => toggle('donationConfirmations')}
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: () => void;
}

function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={Colors.white}
        trackColor={{ true: Colors.primary, false: Colors.border }}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      />
    </View>
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

  sectionTitle: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
  } as TextStyle,

  group: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  } as ViewStyle,
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  } as ViewStyle,
  toggleLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 12,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  } as ViewStyle,

  bottomPad: {
    height: 40,
  } as ViewStyle,
});
