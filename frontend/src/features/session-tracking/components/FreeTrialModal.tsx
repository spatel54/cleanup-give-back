import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';
import { PlayOnceLottie } from '@/components/ui/PlayOnceLottie';
import { colors, fontFamilies, radius, spacing } from '@/constants/tokens';
import { TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import { ShopStripeLogo } from '@/features/figma-screens/components/ShopAssetIcons.generated';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export type FreeTrialModalVariant = 'orientation_end' | 'orientation_complete' | 'pre_track';

type Props = {
  variant?: FreeTrialModalVariant;
  onContinue: () => void;
  onPayLater?: () => void;
  /** Optional company-code UI (e.g. pre-track paywall). */
  companyCodeSlot?: ReactNode;
};

const COPY: Record<
  FreeTrialModalVariant,
  { title: string; subtitle: string }
> = {
  orientation_end: {
    title: 'Your one hour is up!',
    subtitle:
      'Pay a one-time fee to redeem this orientation hour for review. Pay now, or pay later to go home without saving this session.',
  },
  orientation_complete: {
    title: 'Orientation complete!',
    subtitle:
      'You finished orientation early. Pay a one-time fee to redeem this hour for review. Pay now, or pay later to go home without saving this session.',
  },
  pre_track: {
    title: 'Pay to start tracking',
    subtitle:
      'Unlimited tracking requires a one-time payment (or a company code). Pay now, or pay later to go home. This will not start a session until you pay.',
  },
};

/**
 * Figma `free_trial_done` (`1141:2178`) — orientation-end paywall after the
 * free hour, or pre-track paywall once that hour is already consumed.
 */
export function FreeTrialModal({
  variant = 'orientation_end',
  onContinue,
  onPayLater,
  companyCodeSlot,
}: Props) {
  const copy = COPY[variant];
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.scrim, scrimStyle]} />
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <Animated.View style={[s.card, cardStyle]}>
          <View style={s.heroBlock}>
            <PlayOnceLottie
              source={require('@/assets/animations/hourglass.json')}
            size={150}
              style={s.hourglass}
              accessibilityLabel="Hourglass"
              loop
            />

            <View style={s.titleBlock}>
              <Text style={s.title}>{copy.title}</Text>
              <Text style={s.subtitle}>{copy.subtitle}</Text>
            </View>
          </View>

          <View style={s.priceCard}>
            <View style={s.priceRow}>
              <View style={s.priceDescription}>
                <Text style={s.priceLabel}>One-time</Text>
                <Text style={s.priceSublabel}>Unlimited tracking access · Free shipping on your kit</Text>
              </View>
              <Text style={s.priceValue}>${TRACKER_ACCESS_PRICE.toFixed(2)}</Text>
            </View>
          </View>

          <View style={s.footer}>
            <AnimatedPressable
              style={s.continueBtn}
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel="Pay now"
            >
              <Text style={s.continueBtnText}>Pay now</Text>
            </AnimatedPressable>

            {companyCodeSlot}

            {onPayLater ? (
              <AnimatedPressable
                style={s.payLaterBtn}
                onPress={onPayLater}
                accessibilityRole="button"
                accessibilityLabel="Pay later"
              >
                <Text style={s.payLaterText}>Pay Later</Text>
              </AnimatedPressable>
            ) : null}

            <View style={s.stripeRow}>
              <Text style={s.poweredByText}>powered by </Text>
              <ShopStripeLogo width={24} height={24} />
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrim: {
    backgroundColor: colors.overlayScrim,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    paddingHorizontal: 13,
    paddingTop: 0,
    paddingBottom: 24,
    gap: spacing.lg,
  },
  heroBlock: {
    gap: 0,
  },
  hourglass: {
    alignSelf: 'center',
    marginTop: -20,
  },
  titleBlock: {
    gap: 6,
    marginTop: -20,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
  },
  priceCard: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceDescription: {
    flex: 1,
    gap: 5,
  },
  priceLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.primary,
  },
  priceSublabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textNavInactive,
  },
  priceValue: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 18,
    color: colors.primary,
  },
  footer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  payLaterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  payLaterText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textNavInactive,
  },
  stripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  poweredByText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
