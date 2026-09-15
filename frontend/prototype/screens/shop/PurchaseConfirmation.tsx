// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.24 — Purchase Confirmation / Thank You

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function PurchaseConfirmation({ go }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ── Checkmark ── */}
        <View
          style={styles.checkCircle}
          accessibilityLabel="Order complete"
          accessibilityRole="image"
        >
          <Text style={styles.checkMark}>✓</Text>
        </View>

        {/* ── Headline ── */}
        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          Thank you
        </Text>
        <Text style={styles.body}>
          Your order and donation were completed. A confirmation email has been sent to you.
        </Text>

        <View style={styles.gap32} />

        {/* ── Summary card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Trash Cleanup Kit</Text>
            <Text style={styles.summaryValue}>$29.99</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Donation</Text>
            <Text style={styles.summaryValue}>$10.00</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKeyBold}>Total</Text>
            <Text style={styles.summaryValueBold}>$39.99</Text>
          </View>
        </View>

        <View style={styles.gap32} />

        <PrimaryButton
          label="Continue Shopping"
          onPress={() => go('shop')}
          accessibilityLabel="Continue shopping"
        />
        <View style={styles.gap12} />
        <SecondaryButton
          label="Go Home"
          onPress={() => go('home')}
          accessibilityLabel="Go to home screen"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  } as ViewStyle,
  checkMark: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '700',
  } as TextStyle,

  headline: {
    ...(Typography.headlineLarge as TextStyle),
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  } as TextStyle,

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    width: '100%',
  } as ViewStyle,
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  summaryKey: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  summaryValue: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  summaryKeyBold: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
  summaryValueBold: {
    ...(Typography.monoBody as TextStyle),
    color: Colors.primary,
    fontWeight: '700',
  } as TextStyle,
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  } as ViewStyle,

  gap32: {
    height: 32,
    width: '100%',
  } as ViewStyle,
  gap12: {
    height: 12,
    width: '100%',
  } as ViewStyle,
});
