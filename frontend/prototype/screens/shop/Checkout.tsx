// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.23 — Checkout

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
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

export function Checkout({ go }: Props) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Checkout"
        onBack={() => go('cart')}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Contact ── */}
          <Text style={styles.sectionLabel}>CONTACT</Text>
          <Input
            label="Email"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            containerStyle={styles.inputGap}
          />

          {/* ── Shipping ── */}
          <Text style={styles.sectionLabel}>SHIPPING</Text>
          <Input
            label="Full Name"
            required
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Smith"
            containerStyle={styles.inputGap}
          />
          <Input
            label="Address"
            required
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St"
            containerStyle={styles.inputGap}
          />
          <View style={styles.cityRow}>
            <View style={styles.cityFlex}>
              <Input
                label="City"
                required
                value={city}
                onChangeText={setCity}
                placeholder="Chicago"
              />
            </View>
            <View style={styles.stateFlex}>
              <Input
                label="State"
                required
                value={state}
                onChangeText={setState}
                placeholder="IL"
              />
            </View>
            <View style={styles.zipFlex}>
              <Input
                label="ZIP"
                required
                keyboardType="numeric"
                value={zip}
                onChangeText={setZip}
                placeholder="60601"
              />
            </View>
          </View>

          {/* ── Payment ── */}
          <Text style={styles.sectionLabel}>PAYMENT</Text>
          <View style={styles.stripePlaceholder}>
            <View style={styles.stripeFieldRow}>
              <Text style={styles.stripeField}>Card Number</Text>
              <Text style={styles.stripeFieldDot}> · </Text>
              <Text style={styles.stripeField}>MM/YY</Text>
              <Text style={styles.stripeFieldDot}> · </Text>
              <Text style={styles.stripeField}>CVV</Text>
            </View>
            <Text style={styles.stripeNote}>
              Stripe payment fields — replace with @stripe/stripe-react-native
            </Text>
          </View>

          {/* ── Order Summary ── */}
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Products</Text>
              <Text style={styles.summaryValue}>$29.99</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Donation</Text>
              <Text style={styles.summaryValue}>$10.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Shipping</Text>
              <Text style={styles.summaryValue}>$4.99</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKeyBold}>Total</Text>
              <Text style={styles.summaryValueBold}>$44.98</Text>
            </View>
          </View>

          <View style={styles.gap32} />

          <PrimaryButton
            label="Place Order"
            onPress={() => go('purchase-confirmation')}
            accessibilityLabel="Place order"
          />

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  flex: {
    flex: 1,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  } as ViewStyle,

  sectionLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  } as TextStyle,

  inputGap: {
    marginBottom: 12,
  } as ViewStyle,
  cityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  } as ViewStyle,
  cityFlex: {
    flex: 2,
  } as ViewStyle,
  stateFlex: {
    flex: 1,
  } as ViewStyle,
  zipFlex: {
    flex: 1,
  } as ViewStyle,

  // Stripe placeholder
  stripePlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    height: 80,
    marginBottom: 12,
    justifyContent: 'center',
    gap: 6,
  } as ViewStyle,
  stripeFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  stripeField: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  stripeFieldDot: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  stripeNote: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textDisabled,
    fontStyle: 'italic',
  } as TextStyle,

  // Summary
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 8,
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
  } as ViewStyle,
  bottomPad: {
    height: 40,
  } as ViewStyle,
});
