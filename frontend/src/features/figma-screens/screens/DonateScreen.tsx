import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { createDonateCheckout, openStripeCheckout } from '@/lib/paymentsApi';

import {
  DonateCrownIcon,
  DonateRecycleWatermark,
  DonateStripeLogo,
  DonateTitleIcon,
} from '../components/DonateIcons.generated';
import { ShopDonateWave } from '../components/ShopIcons';
import {
  DONATE_ASSETS,
  DONATE_PRESETS,
  POPULAR_AMOUNT,
  getDonateImpact,
  getDonateTotalCents,
  parseDonateAmountParam,
  type DonateAmountSelection,
  type DonatePreset,
} from '../mocks/donate';
import { colors, fontFamilies, radius, textStyles } from '../tokens';

const FOOTER_PAD = 20;
/** Button + stripe + top pad — used to pad scroll content above the sticky footer. */
const FOOTER_CONTENT_HEIGHT = FOOTER_PAD + 52 + 8 + 24;

/**
 * Donate / Contribute — Figma `shop_donate` (`412:4` / PRD §6.20).
 * Opened from Shop donate presets, Shop Custom, or Cart Custom (`/donate?amount=5|10|15|custom`, Cart adds `from=cart`).
 */
export function DonateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount?: string; from?: string }>();
  const openedFromCart =
    (typeof params.from === 'string' ? params.from : params.from?.[0]) === 'cart';
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const customFieldWrapRef = useRef<View>(null);
  const customInputRef = useRef<TextInput>(null);
  const scrollViewportHeightRef = useRef(0);
  const openedAsCustomRef = useRef(
    parseDonateAmountParam(params.amount).kind === 'custom',
  );

  const [selection, setSelection] = useState<DonateAmountSelection>(() =>
    parseDonateAmountParam(params.amount),
  );
  /** iOS keyboard overlay height — footer floats above it; white filler below. */
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelection(parseDonateAmountParam(params.amount));
  }, [params.amount]);

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

  const impact = useMemo(() => getDonateImpact(selection), [selection]);
  const canContinue = getDonateTotalCents(selection) != null;
  const footerBottom = Math.max(insets.bottom, 12);
  const keyboardLift = Platform.OS === 'ios' ? keyboardHeight : 0;
  /** Clear absolute footer + breathing room when scrolling the custom field into view. */
  const keyboardScrollInset = FOOTER_CONTENT_HEIGHT + footerBottom + 16;
  const scrollBottomPad = keyboardScrollInset + keyboardLift;

  const scrollCustomIntoView = useCallback(() => {
    const scroll = scrollRef.current;
    const field = customFieldWrapRef.current;
    const content = scrollContentRef.current;
    if (!scroll || !field || !content) return;

    const delay = Platform.OS === 'ios' ? 380 : 150;
    setTimeout(() => {
      field.measureLayout(
        content,
        (_left, top, _width, height) => {
          const viewport = scrollViewportHeightRef.current;
          if (viewport <= 0) return;
          const overlayHeight = keyboardScrollInset + keyboardLift;
          const targetY = top + height + 16 - (viewport - overlayHeight);
          scroll.scrollTo({ y: Math.max(0, targetY), animated: true });
        },
        () => {
          const input = customInputRef.current;
          if (!input) return;
          scroll.scrollResponderScrollNativeHandleToKeyboard(
            input,
            keyboardScrollInset + 72,
            true,
          );
        },
      );
    }, delay);
  }, [keyboardScrollInset, keyboardLift]);

  useEffect(() => {
    if (openedAsCustomRef.current) {
      scrollCustomIntoView();
    }
  }, [scrollCustomIntoView]);

  useEffect(() => {
    if (keyboardLift > 0 && selection.kind === 'custom') {
      scrollCustomIntoView();
    }
  }, [keyboardLift, selection.kind, scrollCustomIntoView]);

  function selectPreset(amount: DonatePreset) {
    setSelection({ kind: 'preset', amount });
  }

  function selectCustom() {
    setSelection((prev) =>
      prev.kind === 'custom' ? prev : { kind: 'custom', value: '' },
    );
  }

  function onCustomChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized =
      parts.length <= 1 ? cleaned : `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
    setSelection({ kind: 'custom', value: normalized });
  }

  async function onContinue() {
    const cents = getDonateTotalCents(selection);
    if (cents == null || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const session = await createDonateCheckout(cents);
      const outcome = await openStripeCheckout(session.url);
      if (outcome === 'success') {
        const amount = (cents / 100).toFixed(2);
        const donationParam = session.donationId
          ? `&donationId=${session.donationId}`
          : '';
        router.replace(
          `/purchase-confirmation?mode=donation&amount=${amount}${donationParam}` as Href,
        );
      }
    } catch (error) {
      console.error('[donate] Stripe checkout failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onCustomFocus() {
    selectCustom();
    scrollCustomIntoView();
  }

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar
        title="Contribute"
        onBack={() => {
          if (openedFromCart) {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/cart' as Href);
            return;
          }
          router.back();
        }}
      />

      <View style={s.body}>
        {/* Figma `412:319` — same heart watermark as shop donate card (`627:438`) */}
        <View style={s.heartBgWrap} pointerEvents="none">
          <ShopDonateWave style={s.heartBg} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          onLayout={(e) => {
            scrollViewportHeightRef.current = e.nativeEvent.layout.height;
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View
            ref={scrollContentRef}
            collapsable={false}
            style={[s.scrollInner, { paddingBottom: scrollBottomPad }]}
          >
            <View style={s.topBlock}>
            <View style={s.intro}>
              <View style={s.titleRow}>
                <Text style={s.title}>Support the mission</Text>
                <DonateTitleIcon width={24} height={24} style={s.donateIcon} />
              </View>
              <Text style={s.subtitle}>
                Your donation funds cleanup supplies and community programs.
              </Text>
            </View>

            <Image
              source={DONATE_ASSETS.hero}
              style={s.hero}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
              accessibilityLabel="Earth Day cleanup supplies"
            />
          </View>

          <View style={s.impactSection}>
            <View style={s.impactCard}>
              <DonateRecycleWatermark width={91} height={76} style={s.impactRecycle} />
              <View style={s.impactCopy}>
                <Text style={s.impactHeadline}>
                  {impact.amountLabel === 'gift' ? (
                    <>
                      Your <Text style={s.impactAmount}>gift</Text>.
                    </>
                  ) : (
                    <>
                      Your <Text style={s.impactAmount}>{impact.amountLabel}</Text> gift.
                    </>
                  )}
                </Text>
                <Text style={s.impactBody}>{impact.body}</Text>
              </View>
            </View>

            <View style={s.amountCard}>
              <Text style={s.amountLabel}>Select Amount</Text>

              <View style={s.presetRow}>
                {DONATE_PRESETS.map((amount) => {
                  const selected =
                    selection.kind === 'preset' && selection.amount === amount;
                  const isPopular = amount === POPULAR_AMOUNT;
                  return (
                    <View key={amount} style={s.presetWrap}>
                      {isPopular ? (
                        <>
                          <DonateCrownIcon width={52} height={51} style={s.popularCrown} />
                          <View style={s.popularBadge} pointerEvents="none">
                            <Text style={s.popularText}>Popular</Text>
                          </View>
                        </>
                      ) : null}
                      <AnimatedPressable
                        style={[s.presetBtn, selected && s.presetBtnSelected]}
                        onPress={() => selectPreset(amount)}
                        accessibilityRole="button"
                        accessibilityLabel={`Donate $${amount}`}
                        accessibilityState={{ selected }}
                      >
                        <Text style={s.presetText}>${amount}</Text>
                      </AnimatedPressable>
                    </View>
                  );
                })}
              </View>

              <View
                ref={customFieldWrapRef}
                collapsable={false}
                style={[
                  s.customField,
                  selection.kind === 'custom' && s.customFieldSelected,
                ]}
              >
                <Text style={s.customDollar}>$</Text>
                <TextInput
                  ref={customInputRef}
                  style={s.customInput}
                  value={selection.kind === 'custom' ? selection.value : ''}
                  onChangeText={onCustomChange}
                  onFocus={onCustomFocus}
                  autoFocus={openedAsCustomRef.current}
                  keyboardType="decimal-pad"
                  placeholder="Custom Amount"
                  placeholderTextColor={colors.textNavInactive}
                  accessibilityLabel="Custom donation amount"
                />
              </View>
            </View>
          </View>
          </View>
        </ScrollView>

        {keyboardLift > 0 ? (
          <View
            pointerEvents="none"
            style={[s.keyboardFiller, { height: keyboardLift }]}
          />
        ) : null}

        <View style={[s.footer, { bottom: keyboardLift, paddingBottom: footerBottom }]}>
          <AnimatedPressable
            style={[s.continueBtn, (!canContinue || isSubmitting) && s.continueBtnDisabled]}
            disabled={!canContinue || isSubmitting}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to donation payment"
            accessibilityState={{ disabled: !canContinue || isSubmitting }}
          >
            <Text style={s.continueText}>{isSubmitting ? 'Opening Stripe…' : 'Continue'}</Text>
          </AnimatedPressable>
          <View style={s.stripeRow}>
            <Text style={s.poweredBy}>powered by </Text>
            <DonateStripeLogo width={24} height={24} style={s.stripeLogo} />
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
    overflow: 'hidden',
  },
  /** Figma `412:319` — large heart watermark behind title + hero (same path as shop `627:438`) */
  heartBgWrap: {
    position: 'absolute',
    top: 8,
    left: '38.46%',
    width: 346,
    height: 324,
    zIndex: 0,
  },
  heartBg: {
    width: '100%',
    height: '100%',
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 30,
  },
  /** Figma `415:318` — title + hero */
  topBlock: {
    gap: 30,
    width: '100%',
  },
  /** Figma `610:1554` — impact card + amount card */
  impactSection: {
    gap: 20,
    width: '100%',
  },
  intro: {
    gap: 20,
    maxWidth: 303,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 28,
    lineHeight: 34,
    color: colors.primary,
  },
  donateIcon: {
    width: 24,
    height: 24,
  },
  subtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  hero: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  impactCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 108,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  /** Figma `414:28` — left watermark on impact card */
  impactRecycle: {
    position: 'absolute',
    left: -8,
    top: -5,
    width: 91,
    height: 76,
  },
  impactCopy: {
    gap: 5,
    zIndex: 1,
  },
  impactHeadline: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textOnPrimary,
  },
  impactAmount: {
    color: colors.statusPendingBorder,
  },
  impactBody: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textOnPrimary,
  },
  amountCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    paddingHorizontal: 23,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 5,
    overflow: 'visible',
  },
  amountLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    marginBottom: 15,
    overflow: 'visible',
  },
  presetWrap: {
    flex: 1,
    position: 'relative',
    paddingTop: 12,
    overflow: 'visible',
  },
  /** Figma `414:26` — crown above Popular, rotated 13.18° */
  popularCrown: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -8,
    width: 48,
    height: 47,
    transform: [{ rotate: '13deg' }],
    zIndex: 1,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 2,
    backgroundColor: colors.statusPendingBorder,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  popularText: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 14,
    lineHeight: 16,
    color: colors.textPrimary,
  },
  presetBtn: {
    height: 61,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  presetText: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  customField: {
    height: 61,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    backgroundColor: colors.bgApp,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  customFieldSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  customDollar: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  customInput: {
    flex: 1,
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
    padding: 0,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    paddingHorizontal: 16,
    paddingTop: FOOTER_PAD,
    gap: 8,
    alignItems: 'stretch',
    zIndex: 2,
  },
  keyboardFiller: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 1,
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
    lineHeight: 16,
    color: colors.textNavInactive,
  },
  stripeLogo: {
    width: 24,
    height: 24,
  },
});
