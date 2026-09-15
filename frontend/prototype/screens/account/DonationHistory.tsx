// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.29 — Donation History

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
import { Typography, Spacing } from '../../constants/Typography';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function DonationHistory({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Donation History"
        onBack={() => go('account')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Jun 3 ── */}
        <Text style={styles.dateLabel}>Jun 3, 2026</Text>
        <View style={styles.donationCard}>
          <Text style={styles.donationName}>Donation</Text>
          <Text style={styles.donationAmount}>$25.00</Text>
          <Text style={styles.donationMeta}>Confirmation email sent</Text>
        </View>

        {/* ── Apr 15 ── */}
        <Text style={styles.dateLabel}>Apr 15, 2026</Text>
        <View style={styles.donationCard}>
          <Text style={styles.donationName}>Donation</Text>
          <Text style={styles.donationAmount}>$10.00</Text>
          <Text style={styles.donationMeta}>Confirmation email sent</Text>
        </View>

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

  dateLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  } as TextStyle,
  donationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  } as ViewStyle,
  donationName: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  } as TextStyle,
  donationAmount: {
    ...(Typography.monoSmall as TextStyle),
    color: Colors.primary,
  } as TextStyle,
  donationMeta: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  bottomPad: {
    height: 40,
  } as ViewStyle,
});
