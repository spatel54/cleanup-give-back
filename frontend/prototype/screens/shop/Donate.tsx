// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.20 — Donate

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
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

const PRESET_AMOUNTS = ['$10', '$25', '$50'] as const;
type PresetAmount = typeof PRESET_AMOUNTS[number];

export function Donate({ go }: Props) {
  const [selectedAmount, setSelectedAmount] = useState<PresetAmount | null>('$25');
  const [customAmount, setCustomAmount] = useState('');

  const displayAmount = customAmount
    ? `$${customAmount}`
    : selectedAmount ?? '$0.00';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Donate"
        onBack={() => go('shop')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Headline ── */}
        <Text
          style={styles.headline}
          accessibilityRole="header"
        >
          Support the mission
        </Text>
        <Text style={styles.body}>
          Your donation helps fund cleanup supplies and community programs.
        </Text>

        {/* ── Amount chips ── */}
        <Text style={styles.fieldLabel}>Choose an amount</Text>
        <View style={styles.amountRow}>
          {PRESET_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
              }}
              style={[
                styles.amountChip,
                selectedAmount === amt && !customAmount
                  ? styles.amountChipActive
                  : styles.amountChipInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Donate ${amt}`}
              accessibilityState={{ selected: selectedAmount === amt && !customAmount }}
            >
              <Text
                style={[
                  styles.amountChipLabel,
                  selectedAmount === amt && !customAmount
                    ? styles.amountChipLabelActive
                    : styles.amountChipLabelInactive,
                ]}
              >
                {amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Custom amount ── */}
        <Text style={styles.fieldLabel}>Custom amount</Text>
        <Input
          label="Amount"
          placeholder="$"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={(val) => {
            setCustomAmount(val);
            if (val) setSelectedAmount(null);
          }}
          accessibilityLabel="Enter custom donation amount"
        />

        {/* ── Summary card ── */}
        <View style={styles.summaryCard}>
          <Text
            style={styles.summaryTitle}
            accessibilityRole="header"
          >
            Donation Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Amount</Text>
            <Text style={styles.summaryValue}>{displayAmount}</Text>
          </View>
        </View>

        <View style={styles.gap32} />

        <PrimaryButton
          label="Continue to Payment"
          onPress={() => go('checkout')}
          accessibilityLabel="Continue to payment"
        />

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

  headline: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 8,
  } as TextStyle,
  body: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 24,
  } as TextStyle,

  fieldLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  } as TextStyle,

  amountRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  } as ViewStyle,
  amountChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
  } as ViewStyle,
  amountChipActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  amountChipInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  amountChipLabel: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
  } as TextStyle,
  amountChipLabelActive: {
    color: Colors.white,
  } as TextStyle,
  amountChipLabelInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 24,
    gap: 12,
  } as ViewStyle,
  summaryTitle: {
    ...(Typography.labelLarge as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
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
    ...(Typography.monoBody as TextStyle),
    color: Colors.primary,
  } as TextStyle,

  gap32: {
    height: 32,
  } as ViewStyle,
  bottomPad: {
    height: 40,
  } as ViewStyle,
});
