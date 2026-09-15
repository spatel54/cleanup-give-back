import { FreeTrialModal } from '@/features/session-tracking/components/FreeTrialModal';
import { colors, fontFamilies, radius, textStyles } from '@/constants/tokens';
import {
  CompanyCodeConfirmModal,
  CompanyCodeUpgradeSuccessModal,
} from '@/features/figma-screens/components/CompanyCodeModals';
import { redeemCompanyCode } from '@/lib/companyCodesApi';
import { markTrackerPaid } from '@/features/session-tracking/trackerPaymentStore';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

/**
 * Pre-track paywall. Pay now opens checkout; company code upgrades in place;
 * Pay later / hardware back returns Home without starting a session.
 */
export default function TrackerPaywallRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const leavingRef = useRef(false);
  const [companyCode, setCompanyCode] = useState('');
  const [companyCodeError, setCompanyCodeError] = useState<string | undefined>();
  const [confirmCodeVisible, setConfirmCodeVisible] = useState(false);
  const [upgradeSuccessVisible, setUpgradeSuccessVisible] = useState(false);
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  const goHome = useCallback(() => {
    if (leavingRef.current) {
      return;
    }
    leavingRef.current = true;
    try {
      router.dismissTo('/');
    } catch {
      router.replace('/');
    }
  }, [router]);

  const handlePayNow = useCallback(() => {
    leavingRef.current = true;
    router.replace('/checkout?mode=tracker' as Href);
  }, [router]);

  const handleApplyCode = useCallback(() => {
    if (companyCode.length !== 10 || redeemBusy) {
      return;
    }
    setCompanyCodeError(undefined);
    setConfirmCodeVisible(true);
  }, [companyCode.length, redeemBusy]);

  const handleConfirmRedeem = useCallback(async () => {
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
  }, [companyCode, redeemBusy]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [goHome]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (leavingRef.current) {
        return;
      }
      e.preventDefault();
      goHome();
    });
    return unsub;
  }, [navigation, goHome]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <FreeTrialModal
        variant="pre_track"
        onContinue={handlePayNow}
        onPayLater={goHome}
        companyCodeSlot={
          <View style={s.codeBlock}>
            <Text style={s.codeLabel}>or enter a company code</Text>
            <View style={s.codeRow}>
              <TextInput
                style={[s.codeInput, companyCodeError ? s.codeInputError : null]}
                value={companyCode}
                onChangeText={(text) => {
                  setCompanyCode(text.replace(/\D/g, '').slice(0, 10));
                  setCompanyCodeError(undefined);
                }}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10-digit code"
                placeholderTextColor={colors.textNavInactive}
                accessibilityLabel="Company code"
              />
              <AnimatedPressable
                style={[
                  s.codeApply,
                  (companyCode.length !== 10 || redeemBusy) && s.codeApplyDisabled,
                ]}
                disabled={companyCode.length !== 10 || redeemBusy}
                onPress={handleApplyCode}
                accessibilityRole="button"
                accessibilityLabel="Apply company code"
              >
                {redeemBusy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={s.codeApplyLabel}>Apply</Text>
                )}
              </AnimatedPressable>
            </View>
            {companyCodeError ? <Text style={s.codeError}>{companyCodeError}</Text> : null}
          </View>
        }
      />
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
          leavingRef.current = true;
          try {
            router.dismissTo('/');
          } catch {
            router.replace('/');
          }
        }}
      />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  codeBlock: {
    width: '100%',
    gap: 8,
  },
  codeLabel: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    ...textStyles.bodyDefault,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  codeInputError: {
    borderColor: colors.statusDeclinedBorder,
  },
  codeApply: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minWidth: 64,
    alignItems: 'center',
  },
  codeApplyDisabled: {
    opacity: 0.5,
  },
  codeApplyLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
  codeError: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusDeclinedText,
  },
});
