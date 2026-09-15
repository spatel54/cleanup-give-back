// PROTOTYPE — NOT FINAL. All data mocked. No business logic.

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

type ServiceStatus = 'yes' | 'no' | null;

export function AccountDetails({ go }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Account Details"
        onBack={() => go('create-account')}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Headline + subtext ────────────────────────────────────── */}
        <Text style={styles.headline} accessibilityRole="header">
          A few details
        </Text>
        <Text style={styles.body}>
          We need this for your service records.
        </Text>

        {/* ── Age field ────────────────────────────────────────────── */}
        <Input
          label="Age"
          placeholder="e.g. 24"
          required
          keyboardType="numeric"
          maxLength={3}
          containerStyle={styles.ageInput}
        />

        {/* ── Service status toggle ─────────────────────────────────── */}
        <Text style={styles.toggleLabel}>
          Are you completing court-ordered service hours?
        </Text>
        <View
          style={styles.toggleRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Court-ordered service hours selection"
        >
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleLeft,
              selectedStatus === 'yes' && styles.toggleActive,
            ]}
            onPress={() => setSelectedStatus('yes')}
            accessibilityRole="radio"
            accessibilityLabel="Yes, completing court-ordered service hours"
            accessibilityState={{ checked: selectedStatus === 'yes' }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                selectedStatus === 'yes' && styles.toggleTextActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleRight,
              selectedStatus === 'no' && styles.toggleActive,
            ]}
            onPress={() => setSelectedStatus('no')}
            accessibilityRole="radio"
            accessibilityLabel="No, not completing court-ordered service hours"
            accessibilityState={{ checked: selectedStatus === 'no' }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                selectedStatus === 'no' && styles.toggleTextActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Continue"
            onPress={() => go('notification-pref')}
            accessibilityLabel="Continue to notification preferences"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  } as ViewStyle,

  // ── Headline + body ───────────────────────────────────────────────────────
  headline: {
    ...(Typography.headlineLarge as TextStyle),
    color: Colors.black,
    marginBottom: 8,
  } as TextStyle,
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  } as TextStyle,

  // ── Age input ─────────────────────────────────────────────────────────────
  ageInput: {
    marginBottom: 16,
  } as ViewStyle,

  // ── Toggle ────────────────────────────────────────────────────────────────
  toggleLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 12,
  } as TextStyle,
  toggleRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  toggleButton: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  toggleLeft: {
    borderTopLeftRadius: Radius.sm,
    borderBottomLeftRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRightWidth: 0.75,
  } as ViewStyle,
  toggleRight: {
    borderTopRightRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderLeftWidth: 0.75,
  } as ViewStyle,
  toggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  } as ViewStyle,
  toggleText: {
    ...(Typography.labelLarge as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  toggleTextActive: {
    color: Colors.white,
  } as TextStyle,

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaWrap: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
  } as ViewStyle,
});
