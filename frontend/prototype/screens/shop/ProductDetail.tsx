// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.21 — Product Detail

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { SceneImages } from '../../constants/Assets';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

export function ProductDetail({ go }: Props) {
  const [qty, setQty] = useState(1);

  function decrement() {
    setQty((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQty((q) => q + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="detail"
        title="Product Detail"
        onBack={() => go('shop')}
      />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Product image ── */}
        <Image
          source={SceneImages.volunteers}
          style={styles.productImage}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Trash Cleanup Kit in use — volunteers wearing safety vests"
        />

        {/* ── Content ── */}
        <View style={styles.content}>
          <Text
            style={styles.productName}
            accessibilityRole="header"
          >
            Trash Cleanup Kit
          </Text>
          <Text style={styles.productPrice}>$29.99</Text>

          <Text style={styles.productDescription}>
            Includes core supplies for cleanup participation. Contains: trash grabber,
            adult safety vest, and 10-count premium nitrile gloves.
          </Text>

          {/* ── Quantity ── */}
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              onPress={decrement}
              style={styles.qtyButton}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              accessibilityState={{ disabled: qty <= 1 }}
            >
              <Text style={styles.qtyButtonText}>−</Text>
            </TouchableOpacity>

            <Text
              style={styles.qtyValue}
              accessibilityLabel={`Quantity: ${qty}`}
            >
              {qty}
            </Text>

            <TouchableOpacity
              onPress={increment}
              style={styles.qtyButton}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gap24} />

          <PrimaryButton
            label="Add to Cart"
            onPress={() => go('cart')}
            accessibilityLabel="Add Trash Cleanup Kit to cart"
          />
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

  productImage: {
    height: 260,
    width: '100%',
  } as ImageStyle,

  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 20,
  } as ViewStyle,

  productName: {
    ...(Typography.headlineMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 8,
  } as TextStyle,
  productPrice: {
    ...(Typography.headlineSmall as TextStyle),
    fontFamily: 'JetBrainsMono',
    color: Colors.primary,
    marginBottom: 16,
  } as TextStyle,
  productDescription: {
    ...(Typography.bodyLarge as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 24,
  } as TextStyle,

  qtyLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    marginBottom: 12,
  } as TextStyle,
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  } as ViewStyle,
  qtyButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  qtyButtonText: {
    ...(Typography.labelLarge as TextStyle),
    color: Colors.textPrimary,
  } as TextStyle,
  qtyValue: {
    ...(Typography.labelLarge as TextStyle),
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  } as TextStyle,

  gap24: {
    height: 24,
  } as ViewStyle,
  bottomPad: {
    height: 40,
  } as ViewStyle,
});
