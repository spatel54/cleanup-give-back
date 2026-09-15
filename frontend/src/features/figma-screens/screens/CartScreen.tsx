import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';

import {
  ShopCartHeartIcon,
  ShopCartIcon,
  ShopCartMinusIcon,
  ShopCartPlusIcon,
  ShopCartTrashIcon,
  ShopDonateIcon,
  ShopStripeLogo,
} from '../components/ShopIcons';
import { APP_BAR_CART_ICON_SIZE, appBarIconWrap } from '../components/appBarChrome';
import { CartBadge } from '../components/CartBadge';
import {
  removeCartItem,
  setCartDonation,
  updateCartQuantity,
  useCartDonation,
  useCartItemCount,
  useCartItems,
} from '../cartStore';
import {
  cartSubtotal,
  cartTotal,
  DEFAULT_CART_SUMMARY,
  donationValue,
  DONATION_PRESETS,
  formatUsd,
  type CartDonationAmount,
  type CartLineItem,
} from '../mocks/cart';
import { computeShippingFee, shippingFeeLabel } from '@/lib/shipping';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

const FOOTER_PAD = 20;

function CartTopBar({
  cartCount,
  onBack,
}: {
  cartCount: number;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarRow}>
        <AnimatedPressable
          style={s.topBarIconBtnLeft}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={colors.textPrimary} />
        </AnimatedPressable>

        <View style={s.topBarTitleOverlay} pointerEvents="none">
          <Text style={s.topBarTitle}>Cart</Text>
        </View>

        <View style={s.topBarIconBtnRight} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={appBarIconWrap}>
            <ShopCartIcon width={APP_BAR_CART_ICON_SIZE} height={APP_BAR_CART_ICON_SIZE} />
            <CartBadge count={cartCount} variant="cart" />
          </View>
        </View>
      </View>
    </View>
  );
}

function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={s.qtyBar}>
      <AnimatedPressable
        scaleTo={0.95}
        style={s.qtyBtn}
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityState={{ disabled: quantity <= 1 }}
      >
        <ShopCartMinusIcon width={11} height={2} />
      </AnimatedPressable>
      <Text style={s.qtyValue} accessibilityLabel={`Quantity: ${quantity}`}>
        {quantity}
      </Text>
      <AnimatedPressable
        scaleTo={0.95}
        style={s.qtyBtn}
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <ShopCartPlusIcon width={11} height={11} />
      </AnimatedPressable>
    </View>
  );
}

function CartItemCard({
  item,
  onRemove,
  onDecrement,
  onIncrement,
}: {
  item: CartLineItem;
  onRemove: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={s.itemCard}>
      <ExpoImage source={item.image} style={s.itemImage} contentFit="cover" cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
      <View style={s.itemBody}>
        <View style={s.itemTopRow}>
          <View style={s.itemCopy}>
            <Text style={s.itemName}>{item.name}</Text>
            {item.description ? (
              <Text style={s.itemDesc} numberOfLines={2} ellipsizeMode="tail">
                {item.description}
              </Text>
            ) : null}
          </View>
          <AnimatedPressable
            scaleTo={0.92}
            style={s.removeBtn}
            onPress={onRemove}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name}`}
          >
            <ShopCartTrashIcon width={14} height={15} />
          </AnimatedPressable>
        </View>
        <View style={s.itemBottomRow}>
          <QuantityStepper
            quantity={item.quantity}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
          />
          <Text style={s.itemPrice}>{formatUsd(item.unitPrice * item.quantity)}</Text>
        </View>
      </View>
    </View>
  );
}

function DonationSection({
  selected,
  onSelect,
  onCustomPress,
}: {
  selected: CartDonationAmount | null;
  onSelect: (amount: CartDonationAmount | null) => void;
  onCustomPress: () => void;
}) {
  return (
    <View style={s.donateCard}>
      <View style={s.donateHeader}>
        <View style={s.donateIconCircle}>
          <ShopDonateIcon width={24} height={24} />
        </View>
        <Text style={s.donateTitle}>Support our mission</Text>
      </View>
      <Text style={s.donateBody}>
        Your optional donation helps fund local{'\n'}
        community cleanup events and provides{'\n'}
        supplies to volunteers locally.
      </Text>
      <View style={s.donateGrid}>
        {DONATION_PRESETS.map((amount) => {
          const isSelected = selected === amount;
          return (
            <AnimatedPressable
              key={amount}
              scaleTo={0.96}
              style={[s.donateAmountBtn, isSelected && s.donateAmountBtnSelected]}
              onPress={() => onSelect(isSelected ? null : amount)}
              accessibilityRole="button"
              accessibilityLabel={`Donate ${formatUsd(amount)}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[s.donateAmountText, isSelected && s.donateAmountTextSelected]}>
                {`$${amount}`}
              </Text>
            </AnimatedPressable>
          );
        })}
        <AnimatedPressable
          style={s.donateCustomBtn}
          onPress={onCustomPress}
          accessibilityRole="button"
          accessibilityLabel="Custom donation amount"
        >
          <Text style={s.donateCustomText}>Custom</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

/**
 * Cart screen — Figma `shop_checkout` (`657:1585` / PRD §6.22).
 * Review items, optional donation, order summary; Continue → `/checkout`.
 */
export function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartItems();
  const itemCount = useCartItemCount();
  const donation = useCartDonation();

  const subtotal = cartSubtotal(items);
  const donationAmount = donationValue(donation);
  const tax = items.length > 0 ? DEFAULT_CART_SUMMARY.tax : 0;
  const shippingFee = computeShippingFee(items, 'usps_ship');
  const total = useMemo(
    () => cartTotal(items, donation, tax) + shippingFee,
    [items, donation, tax, shippingFee],
  );

  return (
    <View style={s.root}>
      <CartTopBar cartCount={itemCount} onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.pageTitleBlock}>
          <Text style={s.pageTitle}>Your Cart</Text>
          <Text style={s.pageSubtitle}>Review your items and continue to checkout.</Text>
        </View>

        <View style={s.mainStack}>
          {items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              body="Browse the shop to add cleanup gear."
              ctaLabel="Browse Shop"
              ctaAccessibilityLabel="Go to shop"
              onCtaPress={() =>
                router.replace({ pathname: '/shop', params: { enter: 'fade' } } as Href)
              }
            />
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onRemove={() => removeCartItem(item.id)}
                onDecrement={() => updateCartQuantity(item.id, item.quantity - 1)}
                onIncrement={() => updateCartQuantity(item.id, item.quantity + 1)}
              />
            ))
          )}

          <DonationSection
            selected={donation}
            onSelect={setCartDonation}
            onCustomPress={() => router.push('/donate?amount=custom&from=cart' as Href)}
          />

          <View style={s.summaryCard}>
            <View style={s.summaryHeader}>
              <Text style={s.summaryTitle}>Order Summary</Text>
            </View>

            <View style={s.summaryRows}>
              <View style={s.summaryRow}>
                <View style={s.subtotalLabelRow}>
                  <Text style={s.summaryLabel}>Subtotal </Text>
                  <Text style={s.summaryMuted}>
                    ({itemCount} item{itemCount === 1 ? '' : 's'})
                  </Text>
                </View>
                <Text style={s.summaryValue}>{formatUsd(subtotal)}</Text>
              </View>

              <View style={s.summaryRow}>
                <View style={s.donationLabelRow}>
                  <Text style={s.donationLabel}>Donation</Text>
                  <ShopCartHeartIcon width={16} height={16} />
                </View>
                <Text style={s.donationValue}>{formatUsd(donationAmount)}</Text>
              </View>

              <View style={s.summaryRow}>
                <Text style={s.summaryMuted}>Shipping</Text>
                <Text style={s.summaryMuted}>{shippingFeeLabel(shippingFee)}</Text>
              </View>

              <View style={s.summaryRow}>
                <Text style={s.summaryMuted}>Taxes</Text>
                <Text style={s.summaryMuted}>{formatUsd(tax)}</Text>
              </View>
            </View>

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatUsd(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) + FOOTER_PAD - 8 }]}>
        <AnimatedPressable
          style={[s.continueBtn, items.length === 0 && s.continueBtnDisabled]}
          onPress={() => router.push('/checkout' as Href)}
          disabled={items.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Continue to checkout"
          accessibilityState={{ disabled: items.length === 0 }}
        >
          <Text style={s.continueText}>Continue</Text>
        </AnimatedPressable>
        <View style={s.stripeRow}>
          <Text style={s.poweredBy}>powered by </Text>
          <ShopStripeLogo width={24} height={24} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topBar: {
    backgroundColor: colors.white,
    zIndex: 2,
  },
  topBarRow: {
    height: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  topBarIconBtnLeft: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarIconBtnRight: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
  },
  pageTitleBlock: {
    gap: 8,
  },
  pageTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 34,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textNavInactive,
  },
  mainStack: {
    gap: 30,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
  },
  itemImage: {
    width: 96,
    height: 96,
    borderRadius: 4,
  },
  itemBody: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 96,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  itemName: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  itemDesc: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  removeBtn: {
    paddingTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  itemPrice: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 18,
    lineHeight: 27,
    color: colors.textPrimary,
  },
  qtyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 4,
    backgroundColor: colors.chipBg,
    borderRadius: radius.sm,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    width: 16,
    textAlign: 'center',
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  donateCard: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 24,
    paddingHorizontal: 43,
    paddingVertical: 18,
    alignItems: 'center',
  },
  donateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  donateIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    lineHeight: 30,
    color: colors.textOnPrimary,
  },
  donateBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textOnPrimary,
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  donateGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  donateAmountBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateAmountBtnSelected: {
    backgroundColor: colors.statusApprovedBg,
    borderColor: colors.primary,
  },
  donateAmountText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  donateAmountTextSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.primary,
  },
  donateCustomBtn: {
    width: '100%',
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.chipSelectedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateCustomText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  summaryHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
    paddingBottom: 17,
    marginBottom: 24,
  },
  summaryTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  summaryRows: {
    gap: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtotalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  summaryMuted: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  summaryValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  donationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  donationLabel: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  donationValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderOutline,
    paddingTop: 17,
  },
  totalLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 18,
    lineHeight: 27,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1.4,
    color: colors.textPrimary,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderOutline,
    paddingHorizontal: 16,
    paddingTop: FOOTER_PAD,
    gap: 8,
    alignItems: 'stretch',
  },
  continueBtn: {
    alignSelf: 'stretch',
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueText: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
  },
  stripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  poweredBy: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
