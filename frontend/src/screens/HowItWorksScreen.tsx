import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import { colors, fontFamilies, radius, textStyles } from '@/features/figma-screens/tokens';
import {
  CompanyCodeConfirmModal,
  CompanyCodeUpgradeSuccessModal,
} from '@/features/figma-screens/components/CompanyCodeModals';
import {
  HowItWorksCameraIcon,
  HowItWorksCheckIcon,
  HowItWorksKeyIcon,
  HowItWorksLetterIcon,
  HowItWorksTrackIcon,
} from '@/features/figma-screens/components/HowItWorksIcons';
import { ShopStripeLogo } from '@/features/figma-screens/components/ShopIcons';
import { DEVICE_PERMISSIONS_HREF } from '@/lib/onboardingNavigation';
import { redeemCompanyCode } from '@/lib/companyCodesApi';
import { getTrackerHasPaid, markTrackerPaid } from '@/features/session-tracking/trackerPaymentStore';

/** Space reserved for the sticky Pay footer + Stripe row when the keyboard is closed. */
const FOOTER_SCROLL_PAD = 154;

type HowItWorksSection = {
  id: string;
  icon: ReactNode;
  title: string;
  body: ReactNode;
};

const emStyle = {
  fontFamily: fontFamilies.notoSansSemiBold,
  color: colors.primary,
} as const;

const sectionBodyStyle = {
  fontFamily: fontFamilies.notoSansRegular,
  fontSize: 14,
  lineHeight: 20,
  color: colors.textNavInactive,
} as const;

function Em({ children }: { children: string }) {
  return <Text style={emStyle}>{children}</Text>;
}

const SECTIONS: HowItWorksSection[] = [
  {
    id: 'track',
    icon: <HowItWorksTrackIcon size={22} color={colors.primary} />,
    title: 'Track your cleanup',
    body: (
      <Text style={sectionBodyStyle}>
        Start a session from <Em>Track</Em>, keep <Em>location</Em> on while you walk, and log
        real outdoor cleanup time.
      </Text>
    ),
  },
  {
    id: 'photos',
    icon: <HowItWorksCameraIcon size={22} color={colors.primary} />,
    title: 'Checkpoint photos',
    body: (
      <Text style={sectionBodyStyle}>
        Adults take periodic <Em>selfie</Em> and <Em>progress</Em> photos so your hours can be
        verified. Do not pay if you will not turn <Em>camera</Em> or <Em>location</Em> on.
      </Text>
    ),
  },
  {
    id: 'review',
    icon: <HowItWorksLetterIcon size={22} color={colors.primary} />,
    title: 'Review and letters',
    body: (
      <Text style={sectionBodyStyle}>
        After you end a session, hours go <Em>under review</Em>. When approved, download a{' '}
        <Em>service record</Em> from Sessions or Account.
      </Text>
    ),
  },
  {
    id: 'access',
    icon: <HowItWorksKeyIcon size={22} color={colors.primary} />,
    title: 'Unlimited tracking',
    body: (
      <Text style={sectionBodyStyle}>
        Pay once for tracker access (optional free cleanup kit at checkout), or enter a{' '}
        <Em>company code</Em> for free access.
      </Text>
    ),
  },
];

/**
 * Condensed how-the-app-works onboarding — Pay now / company code on the same screen.
 * Free-hour / free-kit / tours remain in the repo but are skipped from this path.
 */
export function HowItWorksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const companyCodeFocusedRef = useRef(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [companyCodeError, setCompanyCodeError] = useState<string | undefined>();
  const [confirmCodeVisible, setConfirmCodeVisible] = useState(false);
  const [upgradeSuccessVisible, setUpgradeSuccessVisible] = useState(false);
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const continueAfterAccess = useCallback(() => {
    router.push(DEVICE_PERMISSIONS_HREF);
  }, [router]);

  const scrollCompanyCodeIntoView = useCallback(() => {
    const delay = Platform.OS === 'ios' ? 280 : 120;
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, delay);
  }, []);

  useEffect(() => {
    if (getTrackerHasPaid()) {
      continueAfterAccess();
    }
  }, [continueAfterAccess]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      if (companyCodeFocusedRef.current) {
        scrollCompanyCodeIntoView();
      }
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [scrollCompanyCodeIntoView]);

  function handlePayNow() {
    if (!acceptedTerms) {
      setCompanyCodeError('Please acknowledge the terms and conditions first.');
      return;
    }
    setCompanyCodeError(undefined);
    router.push('/checkout?mode=tracker&returnTo=onboarding' as Href);
  }

  function handleApplyCode() {
    if (!acceptedTerms) {
      setCompanyCodeError('Please acknowledge the terms and conditions first.');
      return;
    }
    if (companyCode.length !== 10) {
      return;
    }
    setCompanyCodeError(undefined);
    setConfirmCodeVisible(true);
  }

  async function handleConfirmRedeem() {
    if (companyCode.length !== 10 || redeemBusy) {
      return;
    }
    setRedeemBusy(true);
    setCompanyCodeError(undefined);
    try {
      const result = await redeemCompanyCode(companyCode);
      if ('error' in result) {
        setConfirmCodeVisible(false);
        setCompanyCodeError(result.error);
        return;
      }
      setConfirmCodeVisible(false);
      markTrackerPaid();
      setCompanyCode('');
      setUpgradeSuccessVisible(true);
    } finally {
      setRedeemBusy(false);
    }
  }

  const keyboardOpen = keyboardHeight > 0;
  const scrollBottomPad = keyboardOpen
    ? keyboardHeight + 24
    : insets.bottom + FOOTER_SCROLL_PAD;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={s.title}>How Clean Up Give Back works</Text>
        <Text style={s.intro}>
          A quick overview before you unlock tracking. Read each section, then pay or enter a
          company code.
        </Text>

        <View style={s.sections}>
          {SECTIONS.map((section) => (
            <View key={section.id} style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <View style={s.iconWrap}>{section.icon}</View>
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>
              {section.body}
            </View>
          ))}
        </View>

        <Text style={s.warning}>
          Do not pay if you will not turn your camera or location on. Tracking depends on both.
        </Text>

        <AnimatedPressable
          onPress={() => setAcceptedTerms((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          accessibilityLabel="I agree to the terms and conditions"
          style={s.termsRow}
        >
          <View style={[s.checkbox, acceptedTerms && s.checkboxChecked]}>
            {acceptedTerms ? <HowItWorksCheckIcon size={14} color={colors.white} /> : null}
          </View>
          <Text style={s.termsLabel}>
            I acknowledge the terms and conditions and understand camera and location are required.
          </Text>
        </AnimatedPressable>

        <Text style={s.orCompany}>Have a company code?</Text>
        <View style={s.companyCodeRow}>
          <TextInput
            style={[s.companyCodeInput, companyCodeError ? s.companyCodeInputError : null]}
            value={companyCode}
            onChangeText={(text) => {
              setCompanyCode(text.replace(/\D/g, '').slice(0, 10));
              setCompanyCodeError(undefined);
            }}
            onFocus={() => {
              companyCodeFocusedRef.current = true;
              scrollCompanyCodeIntoView();
            }}
            onBlur={() => {
              companyCodeFocusedRef.current = false;
            }}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="10-digit company code"
            placeholderTextColor={colors.textNavInactive}
            accessibilityLabel="Company code"
          />
          <AnimatedPressable
            style={[
              s.companyCodeApply,
              (companyCode.length !== 10 || redeemBusy || !acceptedTerms) &&
                s.companyCodeApplyDisabled,
            ]}
            disabled={companyCode.length !== 10 || redeemBusy || !acceptedTerms}
            onPress={() => void handleApplyCode()}
            accessibilityRole="button"
            accessibilityLabel="Apply company code"
          >
            {redeemBusy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={s.companyCodeApplyLabel}>Apply</Text>
            )}
          </AnimatedPressable>
        </View>
        {companyCodeError ? <Text style={s.companyCodeError}>{companyCodeError}</Text> : null}
      </ScrollView>

      {!keyboardOpen ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <AnimatedPressable
            style={[s.payBtn, !acceptedTerms && s.payBtnDisabled]}
            disabled={!acceptedTerms}
            onPress={handlePayNow}
            accessibilityRole="button"
            accessibilityLabel={`Pay ${TRACKER_ACCESS_PRICE.toFixed(2)} now`}
            accessibilityState={{ disabled: !acceptedTerms }}
          >
            <Text style={s.payBtnLabel}>{`Pay $${TRACKER_ACCESS_PRICE.toFixed(2)} now`}</Text>
          </AnimatedPressable>
          <View style={s.stripeRow}>
            <Text style={s.poweredBy}>powered by </Text>
            <ShopStripeLogo width={24} height={24} />
          </View>
        </View>
      ) : null}

      <CompanyCodeConfirmModal
        visible={confirmCodeVisible}
        onCancel={() => {
          if (redeemBusy) return;
          setConfirmCodeVisible(false);
        }}
        onConfirm={() => {
          void handleConfirmRedeem();
        }}
      />
      <CompanyCodeUpgradeSuccessModal
        visible={upgradeSuccessVisible}
        onDone={() => {
          setUpgradeSuccessVisible(false);
          continueAfterAccess();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 28,
    color: colors.textPrimary,
  },
  intro: {
    ...textStyles.bodyDefault,
    color: colors.textNavInactive,
  },
  sections: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...textStyles.headlineTopBar,
    flex: 1,
    color: colors.textPrimary,
  },
  sectionBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  em: {
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.primary,
  },
  warning: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.statusDeclinedText,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingRight: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderOutline,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsLabel: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  orCompany: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  companyCodeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  companyCodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  companyCodeInputError: {
    borderColor: colors.statusDeclinedBorder,
  },
  companyCodeApply: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 72,
    alignItems: 'center',
  },
  companyCodeApplyDisabled: {
    opacity: 0.5,
  },
  companyCodeApplyLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
  companyCodeError: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusDeclinedText,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.bgApp,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 18,
    alignItems: 'center',
  },
  payBtnDisabled: {
    opacity: 0.45,
  },
  payBtnLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 17,
    color: colors.white,
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
