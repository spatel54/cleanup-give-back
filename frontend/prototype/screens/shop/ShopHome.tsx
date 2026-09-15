// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.19 — Shop Home

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
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Screen } from '../../App';

interface Props {
  go: (screen: Screen) => void;
}

const FILTER_CHIPS = ['All', 'Kits', 'Tools', 'Safety', 'Bags'] as const;
type FilterChip = typeof FILTER_CHIPS[number];

const PRODUCTS = [
  { id: '1', name: 'Reusable Tote Bags', price: '$3.00', category: 'Bags' as FilterChip },
  { id: '2', name: 'Trash Grabber', price: '$23.99', category: 'Tools' as FilterChip },
  { id: '3', name: 'Adult Safety Vest', price: '$12.99', category: 'Safety' as FilterChip },
  { id: '4', name: 'Child Safety Vest', price: '$9.99', category: 'Safety' as FilterChip },
];

export function ShopHome({ go }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const filteredProducts = activeFilter === 'All'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeFilter);

  const cartButton = (
    <TouchableOpacity
      onPress={() => go('cart')}
      style={styles.cartButton}
      accessibilityRole="button"
      accessibilityLabel="View cart"
    >
      <CartIcon />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        variant="root"
        rightElement={cartButton}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Donation Card ── */}
        <View style={styles.donationCard}>
          <Text style={styles.donationTitle}>
            Donate to Clean-Up Give Back
          </Text>
          <Text style={styles.donationBody}>
            Help fund cleanup efforts, supplies, and community work.
          </Text>
          <View style={styles.donationButtonRow}>
            <TouchableOpacity
              onPress={() => go('donate')}
              style={styles.donateSmallButton}
              accessibilityRole="button"
              accessibilityLabel="Donate to Clean-Up Give Back"
            >
              <Text style={styles.donateSmallLabel}>Donate →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Featured section ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          FEATURED
        </Text>

        <View style={styles.featuredCard}>
          <View style={styles.featuredImagePlaceholder} />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredName}>Trash Cleanup Kit</Text>
            <Text style={styles.featuredSub}>Grabber, vest, and gloves</Text>
            <View style={styles.featuredRow}>
              <Text style={styles.featuredPrice}>$29.99</Text>
              <PrimaryButton
                label="View Kit"
                onPress={() => go('product-detail')}
                accessibilityLabel="View Trash Cleanup Kit"
                style={styles.viewKitButton}
              />
            </View>
          </View>
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              onPress={() => setActiveFilter(chip)}
              style={[
                styles.filterChip,
                activeFilter === chip ? styles.filterChipActive : styles.filterChipInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${chip}`}
              accessibilityState={{ selected: activeFilter === chip }}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  activeFilter === chip
                    ? styles.filterChipLabelActive
                    : styles.filterChipLabelInactive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Products grid ── */}
        <Text
          style={styles.sectionLabel}
          accessibilityRole="header"
        >
          PRODUCTS
        </Text>

        <View style={styles.productGrid}>
          {filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => go('product-detail')}
              style={styles.productCard}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${product.name}, ${product.price}`}
            >
              <View style={styles.productImagePlaceholder} />
              <View style={styles.productContent}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CartIcon() {
  return (
    <View style={styles.cartIconContainer}>
      <View style={styles.cartIconBody} />
      <View style={styles.cartIconHandle} />
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
    paddingBottom: 32,
  } as ViewStyle,

  cartButton: {
    padding: 4,
  } as ViewStyle,
  cartIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  cartIconBody: {
    width: 20,
    height: 14,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    borderRadius: 3,
    marginTop: 6,
  } as ViewStyle,
  cartIconHandle: {
    position: 'absolute',
    top: 2,
    width: 12,
    height: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    borderBottomWidth: 0,
  } as ViewStyle,

  // Donation card
  donationCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  } as ViewStyle,
  donationTitle: {
    ...(Typography.labelXLarge as TextStyle),
    color: Colors.white,
    marginBottom: 8,
  } as TextStyle,
  donationBody: {
    ...(Typography.bodyMedium as TextStyle),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  } as TextStyle,
  donationButtonRow: {
    alignSelf: 'flex-start',
  } as ViewStyle,
  donateSmallButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  donateSmallLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.primary,
  } as TextStyle,

  // Section label
  sectionLabel: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  } as TextStyle,

  // Featured card
  featuredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  } as ViewStyle,
  featuredImagePlaceholder: {
    height: 140,
    backgroundColor: Colors.surfaceVariant,
  } as ViewStyle,
  featuredContent: {
    padding: 16,
  } as ViewStyle,
  featuredName: {
    ...(Typography.labelXLarge as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  featuredSub: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
    marginBottom: 12,
  } as TextStyle,
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  featuredPrice: {
    ...(Typography.monoBody as TextStyle),
    color: Colors.primary,
  } as TextStyle,
  viewKitButton: {
    width: 120,
  } as ViewStyle,

  // Filter chips
  filterRow: {
    gap: 8,
    paddingRight: Spacing.screenPadding,
    marginBottom: 20,
  } as ViewStyle,
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  } as ViewStyle,
  filterChipActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  filterChipInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  filterChipLabel: {
    ...(Typography.labelSmall as TextStyle),
    fontWeight: '600',
  } as TextStyle,
  filterChipLabelActive: {
    color: Colors.white,
  } as TextStyle,
  filterChipLabelInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  // Product grid
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  } as ViewStyle,
  productCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
  productImagePlaceholder: {
    height: 100,
    backgroundColor: Colors.surfaceVariant,
  } as ViewStyle,
  productContent: {
    padding: 12,
    gap: 4,
  } as ViewStyle,
  productName: {
    ...(Typography.labelMedium as TextStyle),
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
  productPrice: {
    ...(Typography.monoSmall as TextStyle),
    color: Colors.primary,
  } as TextStyle,

  bottomPad: {
    height: 32,
  } as ViewStyle,
});
