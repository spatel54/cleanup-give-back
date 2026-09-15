import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  CLEAN_UP_GIVE_BACK_LOCATION,
  PICKUP_HOURS_OF_OPERATION,
} from '@/constants/orgLocations';
import { TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import { EyeOffIcon, EyeOpenIcon } from '@/components/onboarding/OnboardingIcons';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { SessionSetupValidationToast } from '@/components/session-setup/SessionSetupValidationToast';

import {
  ShopCartHeartIcon,
  ShopCartIcon,
  ShopCartTrashIcon,
  ShopCheckoutBagIcon,
  ShopCheckoutCardIcon,
  ShopCheckoutPaymentsIcon,
  ShopCheckoutShieldIcon,
  ShopCheckoutTruckIcon,
  ShopStripeLogo,
} from '../components/ShopIcons';
import { APP_BAR_CART_ICON_SIZE, appBarIconWrap } from '../components/appBarChrome';
import { CartBadge } from '../components/CartBadge';
import { EmptyCartToast, useCartIconPress } from '../components/EmptyCartToast';
import { useCartDonation, useCartItems } from '../cartStore';
import { markTrackerPaid } from '@/features/session-tracking/trackerPaymentStore';
import { formatUsd, getCheckoutSummary, getTrackerCheckoutSummary } from '../mocks/checkout';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';
import {
  createShopOrder,
  type FulfillmentMethod,
} from '@/lib/shopOrders';
import { createShopCheckout, openStripeCheckout } from '@/lib/paymentsApi';
import { sendOrderPlacedEmail } from '@/lib/emailsApi';
import { clearCart } from '../cartStore';
import { CART_ASSETS, donationValue, type CartLineItem } from '../mocks/cart';
import { openLocationInMaps } from '../utils/openLocationInMaps';

const FULFILLMENT_OPTIONS: { value: FulfillmentMethod; label: string; hint: string }[] = [
  { value: 'usps_ship', label: 'Ship via USPS', hint: 'Clean Up Give Back ships your order via USPS.' },
  {
    value: 'office_pickup',
    label: 'Pick up at the office',
    hint: 'Clean Up Give Back will coordinate pickup at the office.',
  },
];

const TRACKER_ACCESS_ITEM: CartLineItem = {
  id: 'tracker-access',
  name: 'Tracking access (one-time)',
  description: 'Unlimited tracking',
  unitPrice: TRACKER_ACCESS_PRICE,
  quantity: 1,
  image: 0,
};

const TRACKER_KIT_ITEM: CartLineItem = {
  id: 'cleanup-kit',
  name: 'Trash Cleanup Kit',
  description: 'Included with tracking access',
  unitPrice: 0,
  quantity: 1,
  image: CART_ASSETS.kitThumb,
};

function trackerOrderItems(includeKit: boolean): CartLineItem[] {
  return includeKit ? [TRACKER_ACCESS_ITEM, TRACKER_KIT_ITEM] : [TRACKER_ACCESS_ITEM];
}

function trackerLineHint(includeKit: boolean, method: FulfillmentMethod): string {
  if (!includeKit) return 'App access only';
  const receive = method === 'usps_ship' ? 'free shipping' : 'office pickup';
  return `App access + cleanup kit, ${receive}`;
}

function trackerConfirmationHref(includeKit: boolean, returnTo?: string): Href {
  const kit = includeKit ? '1' : '0';
  const base = `/purchase-confirmation?mode=tracker&includesKit=${kit}`;
  return (returnTo ? `${base}&returnTo=${returnTo}` : base) as Href;
}

const FOOTER_PAD = 20;

type ShippingForm = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

type PaymentForm = {
  cardNumber: string;
  expiry: string;
  cvv: string;
  nameOnCard: string;
};

type FieldKey =
  | 'fullName'
  | 'street'
  | 'city'
  | 'state'
  | 'zip'
  | 'cardNumber'
  | 'expiry'
  | 'cvv'
  | 'nameOnCard';

type FieldErrors = Record<FieldKey, boolean>;

const EMPTY_FIELD_ERRORS: FieldErrors = {
  fullName: false,
  street: false,
  city: false,
  state: false,
  zip: false,
  cardNumber: false,
  expiry: false,
  cvv: false,
  nameOnCard: false,
};

function CheckoutTopBar({
  cartCount,
  onBack,
  onCartPress,
  isTrackerMode,
}: {
  cartCount: number;
  onBack: () => void;
  onCartPress: () => void;
  isTrackerMode: boolean;
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
          <Text style={s.topBarTitle}>{isTrackerMode ? 'Payment' : 'Checkout'}</Text>
        </View>

        {isTrackerMode ? (
          <View style={s.topBarIconBtnRight} />
        ) : (
          <AnimatedPressable
            style={s.topBarIconBtnRight}
            onPress={onCartPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          >
            <View style={appBarIconWrap}>
              <ShopCartIcon width={APP_BAR_CART_ICON_SIZE} height={APP_BAR_CART_ICON_SIZE} />
              <CartBadge count={cartCount} variant="cart" />
            </View>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

function FieldLabel({
  label,
  muted,
  hasError,
}: {
  label: string;
  muted?: boolean;
  hasError?: boolean;
}) {
  return (
    <Text
      style={[
        s.fieldLabel,
        muted ? s.fieldLabelMuted : null,
        hasError ? s.fieldLabelError : null,
      ]}
    >
      {label}
    </Text>
  );
}

const FormField = React.forwardRef<TextInput, {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
  keyboardType?: 'default' | 'number-pad' | 'numeric';
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  textAlign?: 'left' | 'center';
  style?: object;
  trailing?: React.ReactNode;
  hasError?: boolean;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  blurOnSubmit?: boolean;
  editable?: boolean;
}>(function FormField(
  {
    value,
    onChangeText,
    placeholder,
    accessibilityLabel,
    keyboardType = 'default',
    maxLength,
    secureTextEntry,
    autoCapitalize = 'none',
    textAlign = 'left',
    style,
    trailing,
    hasError,
    returnKeyType = 'next',
    onSubmitEditing,
    onFocus,
    onBlur,
    blurOnSubmit = false,
    editable = true,
  },
  ref,
) {
  return (
    <View style={[s.fieldWrap, hasError ? s.fieldWrapError : null, !editable ? s.fieldWrapDisabled : null, style]}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textNavInactive}
        accessibilityLabel={accessibilityLabel}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
        textAlign={textAlign}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
        blurOnSubmit={blurOnSubmit}
        editable={editable}
        style={[s.fieldInput, trailing ? s.fieldInputWithIcon : null]}
      />
      {trailing ? <View style={s.fieldTrailing}>{trailing}</View> : null}
    </View>
  );
});

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

/**
 * Checkout — Figma `shop_checkout_final` (`657:1809` / PRD §6.23).
 * Shipping + payment forms; Place Order → `/purchase-confirmation`.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, returnTo } = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const isTrackerMode = mode === 'tracker';
  const items = useCartItems();
  const donation = useCartDonation();
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('usps_ship');
  const [includeFreeKit, setIncludeFreeKit] = useState(true);
  const summary = isTrackerMode
    ? getTrackerCheckoutSummary(includeFreeKit)
    : getCheckoutSummary(items, donation, fulfillmentMethod);
  const { onCartPress, toastVisible, toastKey, dismissToast } = useCartIconPress();
  const footerBottom = Math.max(insets.bottom, 12);
  /** iOS: pad the sticky footer so its white surface fills to the screen bottom above the keyboard. */
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // Android typically resizes the window; only extend footer padding on iOS.
  const footerPaddingBottom =
    Platform.OS === 'ios' && keyboardHeight > 0
      ? keyboardHeight + 12
      : footerBottom + FOOTER_PAD - 8;

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [payment, setPayment] = useState<PaymentForm>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });
  const [validationToastVisible, setValidationToastVisible] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELD_ERRORS);
  const [showCvv, setShowCvv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const needsShippingAddress =
    fulfillmentMethod === 'usps_ship' && (!isTrackerMode || includeFreeKit);
  const showTrackerFulfillment = isTrackerMode && includeFreeKit;
  const cartHasKit = items.some((item) => item.id === 'cleanup-kit');
  const includesKit = isTrackerMode ? includeFreeKit : cartHasKit;
  const shippingLabel = isTrackerMode
    ? includeFreeKit
      ? fulfillmentMethod === 'usps_ship'
        ? summary.shippingLabel
        : 'Office pickup'
      : 'Not applicable'
    : fulfillmentMethod === 'usps_ship'
      ? summary.shippingLabel
      : 'Office pickup';
  const trackerHint = trackerLineHint(includeFreeKit, fulfillmentMethod);

  const streetRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const zipRef = useRef<TextInput>(null);
  const cardNumberRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);
  const nameOnCardRef = useRef<TextInput>(null);

  function collectValidation(
    nextShipping = shipping,
    nextPayment = payment,
    method = fulfillmentMethod,
  ): { missing: string[]; errors: FieldErrors } {
    const missing: string[] = [];
    const errors: FieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (method === 'usps_ship') {
      if (!nextShipping.fullName.trim()) {
        missing.push('Full Name');
        errors.fullName = true;
      }
      if (!nextShipping.street.trim()) {
        missing.push('Street Address');
        errors.street = true;
      }
      if (!nextShipping.city.trim()) {
        missing.push('City');
        errors.city = true;
      }
      if (!nextShipping.state.trim()) {
        missing.push('State');
        errors.state = true;
      }
      if (!nextShipping.zip.trim()) {
        missing.push('ZIP Code');
        errors.zip = true;
      }
    }

    if (isTrackerMode) {
      const rawCard = nextPayment.cardNumber.replace(/\s/g, '');
      if (rawCard.length < 15) {
        missing.push('Card Number');
        errors.cardNumber = true;
      }
      const rawExpiry = nextPayment.expiry.replace(/\s/g, '').replace('/', '');
      if (rawExpiry.length < 4) {
        missing.push('Expiry');
        errors.expiry = true;
      }
      if (nextPayment.cvv.length < 3) {
        missing.push('CVV');
        errors.cvv = true;
      }
      if (!nextPayment.nameOnCard.trim()) {
        missing.push('Name on Card');
        errors.nameOnCard = true;
      }
    }

    return { missing, errors };
  }

  function applyValidation(
    nextShipping = shipping,
    nextPayment = payment,
    method = fulfillmentMethod,
  ): boolean {
    const { missing, errors } = collectValidation(nextShipping, nextPayment, method);
    setFieldErrors(errors);
    setMissingFields(missing);
    setValidationToastVisible(missing.length > 0);
    return missing.length === 0;
  }

  function refreshValidationFeedback(
    nextShipping = shipping,
    nextPayment = payment,
    method = fulfillmentMethod,
  ) {
    if (!validationToastVisible) return;
    applyValidation(nextShipping, nextPayment, method);
  }

  function handleIncludeKitChange(next: boolean) {
    setIncludeFreeKit(next);
    if (next) {
      setFulfillmentMethod('usps_ship');
      requestAnimationFrame(() =>
        refreshValidationFeedback(shipping, payment, 'usps_ship'),
      );
      return;
    }
    setFulfillmentMethod('office_pickup');
    requestAnimationFrame(() =>
      refreshValidationFeedback(shipping, payment, 'office_pickup'),
    );
  }

  async function handlePlaceOrder() {
    const isValid = applyValidation();
    if (!isValid || isSubmitting) return;
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setValidationToastVisible(false);

    const shippingPayload =
      fulfillmentMethod === 'usps_ship' && (!isTrackerMode || includeFreeKit)
        ? {
            fullName: shipping.fullName,
            street: shipping.street,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
          }
        : null;

    if (!isTrackerMode) {
      setIsSubmitting(true);
      try {
        const donationCents = Math.round(donationValue(donation) * 100);
        const session = await createShopCheckout({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          donationCents: donationCents > 0 ? donationCents : null,
          fulfillmentMethod,
          shipping: shippingPayload,
        });

        const outcome = await openStripeCheckout(session.url);
        if (outcome === 'success' && session.orderId) {
          clearCart();
          router.replace(`/purchase-confirmation?orderId=${session.orderId}` as Href);
        }
      } catch (error) {
        console.error('[checkout] Stripe checkout failed:', error);
        setMissingFields(['Payment']);
        setValidationToastVisible(true);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const trackerFulfillment = includeFreeKit ? fulfillmentMethod : 'office_pickup';
      const orderResult = await createShopOrder({
        items: trackerOrderItems(includeFreeKit),
        donation: null,
        shipping: shippingPayload,
        tax: 0,
        shippingFee: 0,
        fulfillmentMethod: trackerFulfillment,
        includesKit,
      });

      markTrackerPaid();
      if (orderResult.success) {
        void sendOrderPlacedEmail({ orderId: orderResult.orderId }).catch((err: unknown) => {
          console.warn('[checkout] Order-placed email failed:', err);
        });
      }
      router.replace(
        trackerConfirmationHref(includeFreeKit, typeof returnTo === 'string' ? returnTo : undefined),
      );
    } catch (error) {
      console.error('[checkout] Unexpected error during tracker checkout:', error);
      router.replace(trackerConfirmationHref(includeFreeKit));
    }
  }

  return (
    <View style={s.root}>
      <CheckoutTopBar
        cartCount={summary.itemCount}
        onBack={() => router.back()}
        onCartPress={onCartPress}
        isTrackerMode={isTrackerMode}
      />
      {!isTrackerMode ? (
        <EmptyCartToast key={toastKey} visible={toastVisible} onDismiss={dismissToast} />
      ) : null}
      <SessionSetupValidationToast
        visible={validationToastVisible}
        missingLabels={missingFields}
        onDismiss={() => setValidationToastVisible(false)}
      />

      <View style={s.body}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode="interactive"
        >
          {/* Order Summary */}
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutBagIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Order Summary</Text>
            </View>

            {summary.lines.map((line) => {
              if (isTrackerMode && line.id === 'cleanup-kit') {
                return (
                  <View key={line.id} style={s.kitLineBlock}>
                    <View style={s.kitCard}>
                      <ExpoImage
                        source={line.image}
                        style={s.kitCardImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        accessibilityIgnoresInvertColors
                        accessibilityLabel="Trash Cleanup Kit"
                      />
                      <View style={s.kitCardCopy}>
                        <Text style={s.kitCardTitle}>{line.name}</Text>
                        <Text style={s.kitCardHint}>Free with tracking access</Text>
                      </View>
                      <AnimatedPressable
                        onPress={() => handleIncludeKitChange(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Remove free cleanup kit"
                        hitSlop={8}
                        style={s.kitRemoveBtn}
                      >
                        <ShopCartTrashIcon width={14} height={15} color={colors.white} />
                      </AnimatedPressable>
                    </View>
                  </View>
                );
              }

              return (
                <View key={line.id} style={s.lineBlock}>
                  <View style={s.lineRow}>
                    <Text style={[s.lineName, s.lineNameFlex]}>{line.name}</Text>
                    <Text style={s.linePrice}>{formatUsd(line.lineTotal)}</Text>
                  </View>
                  {isTrackerMode && line.id === 'tracker-access' ? (
                    <Text style={s.lineQty}>{trackerHint}</Text>
                  ) : !isTrackerMode ? (
                    <Text style={s.lineQty}>{`Qty: ${line.quantity}`}</Text>
                  ) : null}
                </View>
              );
            })}

            {isTrackerMode && !includeFreeKit ? (
              <AnimatedPressable
                onPress={() => handleIncludeKitChange(true)}
                accessibilityRole="button"
                accessibilityLabel="Add free cleanup kit to order"
                style={s.kitAddCard}
              >
                <View style={s.kitAddCopy}>
                  <Text style={s.kitAddTitle}>Add free cleanup kit</Text>
                  <Text style={s.kitAddHint}>
                    Vest, grabber, and gloves. Same $59.99 total.
                  </Text>
                </View>
                <Text style={s.kitAddAction}>Add</Text>
              </AnimatedPressable>
            ) : null}

            <View style={s.divider} />

            <View style={s.charges}>
            {!isTrackerMode && summary.donation > 0 ? (
              <View style={s.summaryRow}>
                <View style={s.donationLabelRow}>
                  <Text style={s.donationLabel}>Donation</Text>
                  <ShopCartHeartIcon width={16} height={16} />
                </View>
                <Text style={s.donationValue}>{formatUsd(summary.donation)}</Text>
              </View>
            ) : null}
              <View style={s.summaryRow}>
                <Text style={s.mutedLabel}>Shipping</Text>
                <Text style={s.mutedLabel}>{shippingLabel}</Text>
              </View>
              {!isTrackerMode ? (
                <View style={s.summaryRow}>
                  <Text style={s.mutedLabel}>Taxes</Text>
                  <Text style={s.mutedLabel}>{formatUsd(summary.tax)}</Text>
                </View>
              ) : null}
            </View>

            <View style={s.divider} />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatUsd(summary.total)}</Text>
            </View>
          </View>

          {showTrackerFulfillment || !isTrackerMode ? (
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutTruckIcon width={18} height={18} />
              <Text style={s.sectionTitle}>How you&apos;ll receive it</Text>
            </View>
            <View style={s.optionStack}>
              {FULFILLMENT_OPTIONS.map((option) => {
                const selected = fulfillmentMethod === option.value;
                return (
                  <AnimatedPressable
                    key={option.value}
                    onPress={() => {
                      setFulfillmentMethod(option.value);
                      requestAnimationFrame(() =>
                        refreshValidationFeedback(shipping, payment, option.value),
                      );
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    style={[s.optionRow, selected ? s.optionRowSelected : null]}
                  >
                    <View style={[s.radioOuter, selected ? s.radioOuterSelected : null]}>
                      {selected ? <View style={s.radioInner} /> : null}
                    </View>
                    <View style={s.optionCopy}>
                      <Text style={s.optionLabel}>{option.label}</Text>
                      <Text style={s.optionHint}>{option.hint}</Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
            {fulfillmentMethod === 'office_pickup' ? (
              <AnimatedPressable
                onPress={() => {
                  void openLocationInMaps(CLEAN_UP_GIVE_BACK_LOCATION.fullAddress);
                }}
                accessibilityRole="link"
                accessibilityLabel={`Open ${CLEAN_UP_GIVE_BACK_LOCATION.name} in Maps`}
                accessibilityHint="Opens Apple Maps or Google Maps"
                style={s.officeAddressBlock}
              >
                <Text style={s.officeAddressName}>{CLEAN_UP_GIVE_BACK_LOCATION.name}</Text>
                <Text style={s.officeAddressLine}>{CLEAN_UP_GIVE_BACK_LOCATION.street}</Text>
                <Text style={s.officeAddressLine}>{CLEAN_UP_GIVE_BACK_LOCATION.cityStateZip}</Text>
                <Text style={s.officeAddressLine}>Hours: {PICKUP_HOURS_OF_OPERATION}</Text>
                <Text style={s.officeAddressHint}>Tap to open in Maps</Text>
              </AnimatedPressable>
            ) : null}
          </View>
          ) : null}

          {needsShippingAddress ? (
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutTruckIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Shipping Information</Text>
            </View>

            <View style={s.formStack}>
              <View style={s.fieldBlock}>
                <FieldLabel label="Full Name" muted hasError={fieldErrors.fullName} />
                <FormField
                  value={shipping.fullName}
                  onChangeText={(fullName) => {
                    const next = { ...shipping, fullName };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                  }}
                  accessibilityLabel="Full name"
                  autoCapitalize="words"
                  hasError={fieldErrors.fullName}
                  returnKeyType="next"
                  onSubmitEditing={() => streetRef.current?.focus()}
                />
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="Street Address" muted hasError={fieldErrors.street} />
                <FormField
                  ref={streetRef}
                  value={shipping.street}
                  onChangeText={(street) => {
                    const next = { ...shipping, street };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                  }}
                  accessibilityLabel="Street address"
                  hasError={fieldErrors.street}
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                />
              </View>
              <View style={s.halfRow}>
                <View style={s.halfField}>
                  <FieldLabel label="City" muted hasError={fieldErrors.city} />
                  <FormField
                    ref={cityRef}
                    value={shipping.city}
                    onChangeText={(city) => {
                      const next = { ...shipping, city };
                      setShipping(next);
                      requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                    }}
                    accessibilityLabel="City"
                    hasError={fieldErrors.city}
                    returnKeyType="next"
                    onSubmitEditing={() => stateRef.current?.focus()}
                  />
                </View>
                <View style={s.halfField}>
                  <FieldLabel label="State" muted hasError={fieldErrors.state} />
                  <FormField
                    ref={stateRef}
                    value={shipping.state}
                    onChangeText={(state) => {
                      const next = { ...shipping, state };
                      setShipping(next);
                      requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                    }}
                    accessibilityLabel="State"
                    maxLength={2}
                    autoCapitalize="characters"
                    hasError={fieldErrors.state}
                    returnKeyType="next"
                    onSubmitEditing={() => zipRef.current?.focus()}
                  />
                </View>
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="ZIP Code" muted hasError={fieldErrors.zip} />
                <FormField
                  ref={zipRef}
                  value={shipping.zip}
                  onChangeText={(zip) => {
                    const next = {
                      ...shipping,
                      zip: zip.replace(/\D/g, '').slice(0, 10),
                    };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                  }}
                  accessibilityLabel="ZIP code"
                  keyboardType="number-pad"
                  maxLength={10}
                  hasError={fieldErrors.zip}
                  returnKeyType="next"
                  onSubmitEditing={() => cardNumberRef.current?.focus()}
                />
              </View>
            </View>
          </View>
          ) : null}

          {fulfillmentMethod === 'office_pickup' ? (
            <View style={s.card}>
              <Text style={s.pickupCopy}>
                No mailing address needed. Clean Up Give Back will coordinate your pickup time.
              </Text>
            </View>
          ) : null}

          {/* Payment */}
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutPaymentsIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Payment</Text>
            </View>

            {isTrackerMode ? (
              <View style={s.formStack}>
                <View style={s.fieldBlock}>
                  <FieldLabel label="Card Number" hasError={fieldErrors.cardNumber} />
                  <FormField
                    ref={cardNumberRef}
                    value={payment.cardNumber}
                    onChangeText={(text) => {
                      const next = { ...payment, cardNumber: formatCardNumber(text) };
                      setPayment(next);
                      requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                    }}
                    placeholder="1234 5678 9012 3456"
                    accessibilityLabel="Card number"
                    keyboardType="number-pad"
                    maxLength={19}
                    trailing={<ShopCheckoutCardIcon width={24} height={24} />}
                    hasError={fieldErrors.cardNumber}
                    returnKeyType="next"
                    onSubmitEditing={() => expiryRef.current?.focus()}
                  />
                </View>
                <View style={s.halfRow}>
                  <View style={s.halfField}>
                    <FieldLabel label="Expiry" hasError={fieldErrors.expiry} />
                    <FormField
                      ref={expiryRef}
                      value={payment.expiry}
                      onChangeText={(text) => {
                        const next = { ...payment, expiry: formatExpiry(text) };
                        setPayment(next);
                        requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                      }}
                      placeholder="MM / YY"
                      accessibilityLabel="Expiry date"
                      keyboardType="number-pad"
                      maxLength={7}
                      textAlign="center"
                      hasError={fieldErrors.expiry}
                      returnKeyType="next"
                      onSubmitEditing={() => cvvRef.current?.focus()}
                    />
                  </View>
                  <View style={s.halfField}>
                    <FieldLabel label="CVV" hasError={fieldErrors.cvv} />
                    <FormField
                      ref={cvvRef}
                      value={payment.cvv}
                      onChangeText={(cvv) => {
                        const next = {
                          ...payment,
                          cvv: cvv.replace(/\D/g, '').slice(0, 3),
                        };
                        setPayment(next);
                        requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                      }}
                      placeholder="•••"
                      accessibilityLabel="CVV"
                      keyboardType="number-pad"
                      maxLength={3}
                      secureTextEntry={!showCvv}
                      textAlign="center"
                      hasError={fieldErrors.cvv}
                      returnKeyType="next"
                      onSubmitEditing={() => nameOnCardRef.current?.focus()}
                      trailing={
                        <AnimatedPressable
                          onPress={() => setShowCvv((v) => !v)}
                          accessibilityRole="button"
                          accessibilityLabel={showCvv ? 'Hide CVV' : 'Show CVV'}
                          hitSlop={8}
                        >
                          {showCvv
                            ? <EyeOpenIcon size={20} color={colors.textNavInactive} />
                            : <EyeOffIcon size={20} color={colors.textNavInactive} />
                          }
                        </AnimatedPressable>
                      }
                    />
                  </View>
                </View>
                <View style={s.fieldBlock}>
                  <FieldLabel label="Name on Card" hasError={fieldErrors.nameOnCard} />
                  <FormField
                    ref={nameOnCardRef}
                    value={payment.nameOnCard}
                    onChangeText={(nameOnCard) => {
                      const next = { ...payment, nameOnCard };
                      setPayment(next);
                      requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                    }}
                    accessibilityLabel="Name on card"
                    autoCapitalize="words"
                    hasError={fieldErrors.nameOnCard}
                    returnKeyType="done"
                    onSubmitEditing={handlePlaceOrder}
                    blurOnSubmit
                  />
                </View>
                <View style={s.secureRow}>
                  <ShopCheckoutShieldIcon width={18} height={18} />
                  <Text style={s.secureText}>
                    Your payment info is encrypted and never stored on our servers.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={s.formStack}>
                <Text style={s.stripeCheckoutCopy}>
                  Tap Place Order to pay securely on the next screen with Stripe. Card details are
                  never stored on our servers.
                </Text>
                <View style={s.secureRow}>
                  <ShopCheckoutShieldIcon width={18} height={18} />
                  <Text style={s.secureText}>
                    Your payment info is encrypted and never stored on our servers.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: footerPaddingBottom }]}>
          <AnimatedPressable
            style={[s.placeOrderBtn, (isSubmitting || (!isTrackerMode && items.length === 0)) && s.placeOrderBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={isSubmitting || (!isTrackerMode && items.length === 0)}
            accessibilityRole="button"
            accessibilityLabel="Place order"
            accessibilityState={{ disabled: isSubmitting || (!isTrackerMode && items.length === 0) }}
          >
            <Text style={s.placeOrderText}>{isSubmitting ? 'Opening Stripe…' : 'Place Order'}</Text>
          </AnimatedPressable>
          <View style={s.stripeRow}>
            <Text style={s.poweredBy}>powered by </Text>
            <ShopStripeLogo width={24} height={24} />
          </View>
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
  body: {
    flex: 1,
  },
  topBar: {
    backgroundColor: colors.white,
    zIndex: 2,
  },
  topBarRow: {
    height: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    justifyContent: 'center',
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
    paddingBottom: 16,
    gap: 30,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 20,
    gap: 16,
    overflow: 'visible',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  lineBlock: {
    gap: 4,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineNameFlex: {
    flex: 1,
    paddingRight: 4,
  },
  lineName: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  lineQty: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  linePrice: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  kitLineBlock: {
    gap: 12,
  },
  kitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  kitCardImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  kitCardCopy: {
    flex: 1,
    gap: 4,
    paddingRight: 4,
  },
  kitCardTitle: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
  },
  kitCardHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
    alignSelf: 'stretch',
  },
  charges: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  mutedLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  optionStack: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...textStyles.bodySemiBold,
    color: colors.textPrimary,
  },
  optionHint: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
  },
  kitRemoveBtn: {
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitAddCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
  },
  kitAddCopy: {
    flex: 1,
    gap: 4,
  },
  kitAddTitle: {
    ...textStyles.bodyDefault,
    color: colors.textPrimary,
  },
  kitAddHint: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
  },
  kitAddAction: {
    ...textStyles.bodyDefault,
    color: colors.primary,
  },
  pickupCopy: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  officeAddressBlock: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    gap: 2,
  },
  officeAddressName: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  officeAddressLine: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  officeAddressHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
    marginTop: 4,
  },
  formStack: {
    gap: 15,
    width: '100%',
  },
  fieldBlock: {
    gap: 6,
    width: '100%',
    zIndex: 2,
  },
  halfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfField: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  fieldLabelMuted: {
    color: colors.textNavInactive,
  },
  fieldLabelError: {
    color: colors.statusDeclinedText,
  },
  fieldWrap: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
    justifyContent: 'center',
  },
  fieldWrapError: {
    borderColor: colors.statusDeclinedBorder,
  },
  fieldWrapDisabled: {
    opacity: 0.55,
  },
  fieldInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 15,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  fieldInputWithIcon: {
    paddingRight: 44,
  },
  fieldTrailing: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  secureText: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  stripeCheckoutCopy: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
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
  placeOrderBtn: {
    alignSelf: 'stretch',
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnDisabled: {
    opacity: 0.55,
  },
  placeOrderText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
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
