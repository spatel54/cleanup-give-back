// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.22 — Shopping Cart

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { ProductImages } from '../../constants/Assets';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

const DONATION_CHIPS = ['$5', '$10', '$25', 'Custom'] as const;
type DonationChip = typeof DONATION_CHIPS[number];

const DONATION_VALUES: Record<string, number> = {
  '$5': 5,
  '$10': 10,
  '$25': 25,
};

export function Cart({ go }: Props) {
  const [itemQty, setItemQty] = useState(1);
  const [itemRemoved, setItemRemoved] = useState(false);
  const [donationAmount, setDonationAmount] = useState<DonationChip | null>('$10');
  const [customAmount, setCustomAmount] = useState('');

  const subtotal = itemRemoved ? 0 : 29.99 * itemQty;
  const donation = donationAmount && donationAmount !== 'Custom'
    ? DONATION_VALUES[donationAmount] ?? 0
    : donationAmount === 'Custom'
    ? parseFloat(customAmount) || 0
    : 0;
  const total = subtotal + donation;

  function decrementItem() {
    setItemQty((q) => Math.max(1, q - 1));
  }

  function incrementItem() {
    setItemQty((q) => q + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ── */}
        <Text
          style={styles.title}
          accessibilityRole="header"
        >
          Cart
        </Text>

        {/* ── Cart item ── */}
        {itemRemoved ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>Your cart is empty.</Text>
            <TouchableOpacity onPress={() => go('shop')} accessibilityRole="button">
              <Text style={styles.emptyCartLink}>Continue shopping →</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!itemRemoved && <View style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Image
              source={ProductImages.safetyVest}
              style={styles.itemThumb}
              resizeMode="cover"
              accessibilityRole="image"
              accessibilityLabel="Safety vest — Trash Cleanup Kit"
            />
            <View style={styles.itemMeta}>
              <Text style={styles.itemName}>Trash Cleanup Kit</Text>
              <Text style={styles.itemPrice}>${(29.99 * itemQty).toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.itemFooter}>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                onPress={decrementItem}
                style={styles.qtyButton}
                accessibilityRole="button"
                accessibilityLabel="Decrease item quantity"
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </TouchableOpacity>
              <Text
                style={styles.qtyValue}
                accessibilityLabel={`Quantity: ${itemQty}`}
              >
                {itemQty}
              </Text>
              <TouchableOpacity
                onPress={incrementItem}
                style={styles.qtyButton}
                accessibilityRole="button"
                accessibilityLabel="Increase item quantity"
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setItemRemoved(true)}
              accessibilityRole="button"
              accessibilityLabel="Remove Trash Cleanup Kit from cart"
            >
              <Text style={styles.removeLabel}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>}

        {/* ── Add a donation ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          Add a donation
        </Text>
        <View style={styles.donationChipsRow}>
          {DONATION_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              onPress={() => setDonationAmount(donationAmount === chip ? null : chip)}
              style={[
                styles.donationChip,
                donationAmount === chip ? styles.donationChipActive : styles.donationChipInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${chip} donation`}
              accessibilityState={{ selected: donationAmount === chip }}
            >
              <Text
                style={[
                  styles.donationChipLabel,
                  donationAmount === chip
                    ? styles.donationChipLabelActive
                    : styles.donationChipLabelInactive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {donationAmount === 'Custom' && (
          <TextInput
            style={styles.customInput}
            placeholder="Enter amount"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="decimal-pad"
            value={customAmount}
            onChangeText={setCustomAmount}
            accessibilityLabel="Custom donation amount"
          />
        )}

        {/* ── Totals ── */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {donation > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Donation</Text>
              <Text style={styles.totalValue}>${donation.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.separator} />
          <View style={styles.totalRow}>
            <Text style={styles.totalKeyBold}>Total</Text>
            <Text style={styles.totalValueBold}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.gap24} />

        <PrimaryButton
          label="Checkout"
          onPress={() => go('checkout')}
          accessibilityLabel="Proceed to checkout"
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

  title: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 20,
  } as TextStyle,

  // Cart item
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  } as ViewStyle,
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  itemThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceVariant,
  } as ImageStyle,
  itemMeta: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  itemName: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
  itemPrice: {
    ...(Typography.monoSmall as TextStyle),
    color: Colors.primary,
  } as TextStyle,
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  qtyButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  qtyButtonText: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  qtyValue: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  } as TextStyle,
  removeLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.error,
  } as TextStyle,

  // Donation chips
  sectionLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  } as TextStyle,
  donationChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  } as ViewStyle,
  donationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  } as ViewStyle,
  donationChipActive: {
    backgroundColor: Colors.accent,
  } as ViewStyle,
  donationChipInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  donationChipLabel: {
    ...(Typography.labelSmall as TextStyle),
    fontWeight: '600',
  } as TextStyle,
  donationChipLabelActive: {
    color: Colors.accentDark,
  } as TextStyle,
  donationChipLabelInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  // Totals
  totalsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  } as ViewStyle,
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  totalKey: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  totalValue: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  totalKeyBold: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
  totalValueBold: {
    ...(Typography.monoBody as TextStyle),
    color: Colors.primary,
    fontWeight: '700',
  } as TextStyle,
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  } as ViewStyle,

  emptyCart: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  } as ViewStyle,
  emptyCartText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  emptyCartLink: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.primary,
  } as TextStyle,
  customInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 16,
  } as TextStyle,
  gap24: {
    height: 24,
  } as ViewStyle,
  bottomPad: {
    height: 40,
  } as ViewStyle,
});
