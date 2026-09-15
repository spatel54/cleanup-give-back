// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.28 — Order History

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
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function OrderHistory({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Order History"
        onBack={() => go('account')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Jun 3 ── */}
        <Text style={styles.dateLabel}>Jun 3, 2026</Text>
        <View style={styles.orderCard}>
          <Text style={styles.orderName}>Trash Cleanup Kit</Text>
          <Text style={styles.orderTotal}>Total: $29.99</Text>
          <Text style={styles.orderMeta}>Confirmation email sent</Text>
        </View>

        {/* ── May 20 ── */}
        <Text style={styles.dateLabel}>May 20, 2026</Text>
        <View style={styles.orderCard}>
          <Text style={styles.orderName}>Reusable Tote Bags</Text>
          <Text style={styles.orderTotal}>Total: $6.00</Text>
          <Text style={styles.orderMeta}>Confirmation email sent</Text>
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
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  } as ViewStyle,
  orderName: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  } as TextStyle,
  orderTotal: {
    ...(Typography.monoSmall as TextStyle),
    color: Colors.primary,
  } as TextStyle,
  orderMeta: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,

  bottomPad: {
    height: 40,
  } as ViewStyle,
});
