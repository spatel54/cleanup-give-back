import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import { durations, easing, popSpring } from '@/motion';

import {
  PurchaseDonationIcon,
  PurchaseHeart1,
  PurchaseHeart2,
  PurchaseHeart3,
  PurchaseReceiptBg,
} from '../components/PurchaseConfirmationIcons.generated';
import { markTrackerPaid } from '@/features/session-tracking/trackerPaymentStore';
import { getDonationById } from '@/lib/donations';
import { getOrderById } from '@/lib/shopOrders';
import { clearCart } from '../cartStore';
import {
  formatUsd,
  getDonationConfirmation,
  getDonationConfirmationFromRow,
  getPurchaseConfirmationFromCart,
  getPurchaseConfirmationFromOrder,
  getTrackerPurchaseConfirmation,
  parseDonationAmountParam,
  type PurchaseConfirmationData,
} from '../mocks/purchaseConfirmation';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

const RECEIPT_WIDTH = 358;
const RECEIPT_HEIGHT = 619;
/** Center of side notch arcs in receipt SVG (`245.369` in viewBox). */
const PERFORATION_TOP = 245;
/** Shorter receipt used in donation-only mode (no product line items). */
const DONATION_RECEIPT_HEIGHT = 504;

// Order receipt reuses the donation screen's clipped/rounded-bottom card
// design (see `receiptWrapCompact`), sized to the order's own content
// (product line items + optional donation row + details + total) instead of
// the donation screen's fixed height, since order carts can hold >1 item.
const ORDER_HEADER_HEIGHT = 192; // hearts(84) + gap16 + title lineHeight36 + gap16 + subtitle 2-line(40)
const ORDER_PRODUCT_ROW_HEIGHT = 82; // padding17*2 + thumbWrap(48)
const ORDER_DONATION_ROW_HEIGHT = 58; // padding17*2 + icon(24)
const ORDER_DETAIL_ROW_HEIGHT = 20;
const ORDER_TOTAL_BLOCK_HEIGHT = 36; // marginTop2 + gap13 + divider1 + totalRow20
const ORDER_INNER_VERTICAL_PADDING = 45; // receiptInner paddingTop17 + paddingBottom28
const ORDER_INNER_HEADER_GAP = 25; // receiptInner gap between header and body
const ORDER_BODY_SECTION_GAP = 10; // body gap between lineItems / details / totalBlock
/** Extra breathing room added on top of the exact-fit calculation below. */
const ORDER_RECEIPT_EXTRA_HEIGHT = 34;

function computeOrderReceiptHeight(data: PurchaseConfirmationData): number {
  const rowCount = data.lines.length + (data.donationAmount > 0 ? 1 : 0);
  const lineItemsHeight =
    data.lines.length * ORDER_PRODUCT_ROW_HEIGHT +
    (data.donationAmount > 0 ? ORDER_DONATION_ROW_HEIGHT : 0) +
    Math.max(rowCount - 1, 0) * ORDER_BODY_SECTION_GAP;
  const detailsHeight =
    data.details.length * ORDER_DETAIL_ROW_HEIGHT +
    Math.max(data.details.length - 1, 0) * ORDER_BODY_SECTION_GAP +
    2; // details marginTop
  const bodyHeight = lineItemsHeight + detailsHeight + ORDER_TOTAL_BLOCK_HEIGHT + ORDER_BODY_SECTION_GAP * 2;
  return (
    ORDER_INNER_VERTICAL_PADDING +
    ORDER_HEADER_HEIGHT +
    ORDER_INNER_HEADER_GAP +
    bodyHeight +
    ORDER_RECEIPT_EXTRA_HEIGHT
  );
}

/** Each heart bounces in independently with a staggered popSpring. */
function AnimatedConfirmationHearts() {
  const reducedMotion = useReducedMotion();

  const scale1 = useSharedValue(reducedMotion ? 1 : 0.4);
  const opacity1 = useSharedValue(reducedMotion ? 1 : 0);
  const translateY1 = useSharedValue(reducedMotion ? 0 : 14);

  const scale2 = useSharedValue(reducedMotion ? 1 : 0.4);
  const opacity2 = useSharedValue(reducedMotion ? 1 : 0);
  const translateY2 = useSharedValue(reducedMotion ? 0 : 14);

  const scale3 = useSharedValue(reducedMotion ? 1 : 0.4);
  const opacity3 = useSharedValue(reducedMotion ? 1 : 0);
  const translateY3 = useSharedValue(reducedMotion ? 0 : 14);

  useEffect(() => {
    if (reducedMotion) return;
    const fadeConfig = { duration: durations.modalEnter, easing: easing.easeOut };

    // Heart 1 (large center) — first
    opacity1.value = withTiming(1, fadeConfig);
    scale1.value = withSpring(1, popSpring);
    translateY1.value = withSpring(0, popSpring);

    // Heart 2 (orange right) — 80ms later
    opacity2.value = withDelay(80, withTiming(1, fadeConfig));
    scale2.value = withDelay(80, withSpring(1, popSpring));
    translateY2.value = withDelay(80, withSpring(0, popSpring));

    // Heart 3 (dark green left) — 160ms later
    opacity3.value = withDelay(160, withTiming(1, fadeConfig));
    scale3.value = withDelay(160, withSpring(1, popSpring));
    translateY3.value = withDelay(160, withSpring(0, popSpring));
  }, [opacity1, opacity2, opacity3, reducedMotion, scale1, scale2, scale3, translateY1, translateY2, translateY3]);

  const style1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [{ scale: scale1.value }, { translateY: translateY1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ scale: scale2.value }, { translateY: translateY2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
    transform: [{ scale: scale3.value }, { translateY: translateY3.value }],
  }));

  return (
    <View style={s.hearts}>
      {/* Large lime-green center heart */}
      <Animated.View style={[s.heart1, style1]}>
        <PurchaseHeart1 />
      </Animated.View>
      {/* Small orange right heart */}
      <Animated.View style={[s.heart2, style2]}>
        <PurchaseHeart2 />
      </Animated.View>
      {/* Small dark-green left heart */}
      <Animated.View style={[s.heart3, style3]}>
        <PurchaseHeart3 />
      </Animated.View>
    </View>
  );
}

function trackerThankYouCopy(includesKit: boolean): string {
  return includesKit
    ? 'Your order is on its way!\nWe will notify you once your cleanup kit ships.'
    : 'Your tracking access is ready.\nYou can start tracking cleanups anytime.';
}

/**
 * Purchase / donation confirmation — Figma `shop_confirmation` (`494:262` / PRD §6.24).
 * Order mode: Checkout **Place Order**. Donation mode: Contribute Continue (`?mode=donation&amount=`).
 */
export function PurchaseConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{
    mode?: string;
    amount?: string;
    returnTo?: string;
    orderId?: string;
    donationId?: string;
    includesKit?: string;
  }>();
  const isDonation = params.mode === 'donation';
  const isTracker = params.mode === 'tracker';
  const trackerIncludesKit = (Array.isArray(params.includesKit) ? params.includesKit[0] : params.includesKit) !== '0';
  const orderId = typeof params.orderId === 'string' ? params.orderId : undefined;
  const donationId = typeof params.donationId === 'string' ? params.donationId : undefined;
  const screenOpacity = useSharedValue(1);
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const [liveData, setLiveData] = useState<PurchaseConfirmationData | null>(null);

  useEffect(() => {
    if (isTracker) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 4;
    const delayMs = 1200;

    async function loadLiveReceipt(): Promise<boolean> {
      if (isDonation && donationId) {
        const result = await getDonationById(donationId);
        if (cancelled || !result.success || !result.donation) return false;
        setLiveData(getDonationConfirmationFromRow(result.donation));
        return result.donation.status !== 'pending' || Boolean(result.donation.payment_method_label);
      }
      if (!isDonation && orderId) {
        const result = await getOrderById(orderId);
        if (cancelled || !result.success || !result.order) return false;
        setLiveData(getPurchaseConfirmationFromOrder(result.order));
        return result.order.status !== 'pending' || Boolean(result.order.payment_method_label);
      }
      return true;
    }

    async function poll() {
      const done = await loadLiveReceipt();
      if (cancelled || done || attempts >= maxAttempts) return;
      attempts += 1;
      setTimeout(() => {
        void poll();
      }, delayMs);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [donationId, isDonation, isTracker, orderId]);

  const fallbackData = useMemo(() => {
    if (isTracker) {
      return getTrackerPurchaseConfirmation();
    }
    if (isDonation) {
      return getDonationConfirmation(parseDonationAmountParam(params.amount));
    }
    return getPurchaseConfirmationFromCart();
  }, [isDonation, isTracker, params.amount]);

  const data = liveData ?? fallbackData;

  const orderReceiptHeight = useMemo(
    () => (!isDonation ? Math.max(computeOrderReceiptHeight(data), DONATION_RECEIPT_HEIGHT) : RECEIPT_HEIGHT),
    [data, isDonation],
  );

  useEffect(() => {
    if (isTracker) {
      markTrackerPaid();
    }
  }, [isTracker]);

  const leave = (href: Href) => {
    if (!isDonation && !isTracker) {
      clearCart();
    }
    if (reducedMotion) {
      router.replace(href);
      return;
    }
    const navigate = () => router.replace(href);
    screenOpacity.value = withTiming(0, { duration: durations.modalExit, easing: easing.easeInOut }, (finished) => {
      if (finished) runOnJS(navigate)();
    });
  };

  const trackerReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const trackerReturnHref = (
    trackerReturnTo === 'live-session'
      ? '/live-session'
      : trackerReturnTo === 'account'
        ? '/account?enter=fade'
        : trackerReturnTo === 'onboarding'
          ? '/device-permissions'
          : '/'
  ) as Href;

  return (
    <Animated.View
      style={[
        s.root,
        {
          paddingTop: Math.max(insets.top, 12),
          // Same bottom inset as donation thank-you (`mode=donation`).
          paddingBottom: Math.max(insets.bottom, 16),
        },
        screenStyle,
      ]}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            s.receiptWrap,
            isDonation && s.receiptWrapDonation,
            !isDonation && [s.receiptWrapCompact, { height: orderReceiptHeight }],
          ]}
        >
          <PurchaseReceiptBg width={RECEIPT_WIDTH} height={RECEIPT_HEIGHT} style={s.receiptBg} />

          {/* Dashed perforation across ticket notches */}
          <View style={s.perforation} pointerEvents="none" />

          <View style={s.receiptInner}>
            <View style={s.header}>
              <AnimatedConfirmationHearts />
              <Text style={s.title}>Thank you!</Text>
              <Text style={s.subtitle}>
                {isTracker
                  ? trackerThankYouCopy(trackerIncludesKit)
                  : isDonation
                    ? 'Your donation was complete.\nThank you for supporting Clean Up Give Back.'
                    : 'Your order was complete.\nA confirmation email has been sent to you.'}
              </Text>
            </View>

            <View style={[s.body, isDonation && s.bodyDonation, isTracker && s.bodyTracker]}>
              <View style={s.lineItems}>
                {data.lines.map((line) => (
                  <View key={line.id} style={s.productRow}>
                    <View style={s.productLeft}>
                      <View
                        style={[s.productThumbWrap, isTracker && s.productThumbWrapIcon]}
                      >
                        {isTracker ? (
                          <LocationPinIcon color={colors.primary} size={24} />
                        ) : (
                          <Image
                            source={line.image}
                            style={s.productThumb}
                            contentFit="cover"
                            accessibilityIgnoresInvertColors
                          />
                        )}
                      </View>
                      <View style={s.productCopy}>
                        <Text style={s.productName}>{line.name}</Text>
                        <Text style={s.productQty}>{`Qty: ${line.quantity}`}</Text>
                      </View>
                    </View>
                    <Text style={s.productPrice}>{formatUsd(line.lineTotal)}</Text>
                  </View>
                ))}

                {data.donationAmount > 0 ? (
                  <View style={s.donationRow}>
                    <View style={s.donationLeft}>
                      <PurchaseDonationIcon width={24} height={24} style={s.donationIcon} />
                      <Text style={s.donationLabel}>Donation</Text>
                    </View>
                    <Text style={s.donationValue}>{formatUsd(data.donationAmount)}</Text>
                  </View>
                ) : null}
              </View>

              <View style={s.details}>
                {data.details.map((row) => (
                  <View key={row.label} style={s.detailRow}>
                    <Text style={s.detailLabel}>{row.label}</Text>
                    <Text style={s.detailValue}>{row.value}</Text>
                  </View>
                ))}
                {params.orderId && (
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Order ID</Text>
                    <Text style={s.detailValue}>{params.orderId}</Text>
                  </View>
                )}
              </View>

              <View style={s.totalBlock}>
                <View style={s.totalDivider} />
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>
                    {isTracker ? 'Total Paid' : isDonation ? 'Total Gift' : 'Total Impact'}
                  </Text>
                  <Text style={s.totalValue}>{formatUsd(data.totalImpact)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={s.actions}>
          {isTracker ? (
            <AnimatedPressable
              style={s.continueBtn}
              onPress={() => router.replace(trackerReturnHref)}
              accessibilityRole="button"
              accessibilityLabel="Continue tracking"
            >
              <Text style={s.continueText}>Continue</Text>
            </AnimatedPressable>
          ) : (
            <>
              <AnimatedPressable
                style={s.continueBtn}
                onPress={() => leave('/shop' as Href)}
                accessibilityRole="button"
                accessibilityLabel={isDonation ? 'Back to shop' : 'Continue shopping'}
              >
                <Text style={s.continueText}>{isDonation ? 'Back to Shop' : 'Continue Shopping'}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={s.homeHit}
                onPress={() => leave('/' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Go home"
              >
                <Text style={s.homeText}>Go Home</Text>
              </AnimatedPressable>
            </>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 24,
  },
  receiptWrap: {
    width: RECEIPT_WIDTH,
    height: RECEIPT_HEIGHT,
    maxWidth: '100%',
  },
  receiptWrapDonation: {
    height: DONATION_RECEIPT_HEIGHT,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  // Same clipped/rounded-bottom card treatment as `receiptWrapDonation`,
  // but height is computed per order (see `computeOrderReceiptHeight`).
  receiptWrapCompact: {
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  receiptBg: {
    ...StyleSheet.absoluteFill,
    width: RECEIPT_WIDTH,
    height: RECEIPT_HEIGHT,
  },
  perforation: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: PERFORATION_TOP,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderOutline,
  },
  receiptInner: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 17,
    paddingBottom: 28,
    gap: 25,
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  hearts: {
    width: 117,
    height: 84,
  },
  // Each heart is absolutely positioned to reconstruct the composite image.
  // Positions derived from path bounding boxes in the original 117×84 viewBox.
  heart1: {
    position: 'absolute',
    left: 28,
    top: 0,
    width: 60,
    height: 71,
  },
  heart2: {
    position: 'absolute',
    left: 84,
    top: 44,
    width: 30,
    height: 33,
  },
  heart3: {
    position: 'absolute',
    left: 2,
    top: 44,
    width: 30,
    height: 33,
  },
  title: {
    ...textStyles.headlinePage,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: 10,
    justifyContent: 'flex-start',
  },
  bodyDonation: {
    marginTop: 24,
  },
  bodyTracker: {
    marginTop: 14,
  },
  lineItems: {
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    paddingRight: 8,
  },
  productThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productThumbWrapIcon: {
    backgroundColor: colors.chipBg,
  },
  productThumb: {
    width: 42,
    height: 40,
  },
  productCopy: {
    gap: 0,
    flexShrink: 1,
  },
  productName: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  productQty: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  productPrice: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  donationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
  },
  donationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donationIcon: {
    width: 24,
    height: 24,
  },
  donationLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  donationValue: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  details: {
    gap: 10,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 20,
  },
  detailLabel: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  detailValue: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  totalBlock: {
    gap: 13,
    marginTop: 2,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderOutline,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  totalValue: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 20,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  actions: {
    width: '100%',
    maxWidth: RECEIPT_WIDTH,
    gap: 10,
    alignItems: 'stretch',
  },
  continueBtn: {
    alignSelf: 'stretch',
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    ...textStyles.labelButton,
    color: colors.primary,
  },
  homeHit: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
});
