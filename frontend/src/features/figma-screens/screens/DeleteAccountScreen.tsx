import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAttentionShake } from '@/components/motion/hooks';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionBottomNavStack,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import {
  ACCOUNT_DELETE_CONFIRM_WORD,
  deleteVolunteerAccount,
  isAccountDeleteConfirmed,
} from '@/lib/volunteerAccount';
import { downloadVolunteerDataExport } from '@/lib/downloadVolunteerData';

import { WarningTriangleIcon } from '../components/AccountIcons';
import { layout, colors, fontFamilies, radius, textStyles } from '../tokens';

function ValidationToastAlert({ message }: { message: string }) {
  const shakeStyle = useAttentionShake();

  return (
    <Animated.View
      style={[s.validationToast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.validationToastTitle}>Confirmation required</Text>
      <Text style={s.validationToastLine}>
        {'\u2022  '}
        {message}
      </Text>
    </Animated.View>
  );
}

/**
 * Delete account confirmation (Figma `delete_account`, node `725:361` / PRD §6.35).
 * Requires typing DELETE before confirming; otherwise shows a session-setup-style toast.
 */
export function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const [confirmText, setConfirmText] = useState('');
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [inputHasError, setInputHasError] = useState(false);
  const [busy, setBusy] = useState(false);

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 32;

  async function handleConfirmDelete() {
    if (busy) {
      return;
    }

    if (!isAccountDeleteConfirmed(confirmText)) {
      setToastKey((key) => key + 1);
      setShowValidationToast(true);
      setInputHasError(true);
      return;
    }

    setShowValidationToast(false);
    setInputHasError(false);
    setBusy(true);
    try {
      const result = await deleteVolunteerAccount();
      if (result.courtLogsRetained) {
        Alert.alert(
          'Account deleted',
          'Court-ordered service logs may be kept as required by law.',
          [{ text: 'OK', onPress: () => router.replace('/welcome' as Href) }],
        );
        return;
      }
      router.replace('/welcome' as Href);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete your account. Try again.';
      Alert.alert('Could not delete account', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <SessionSetupTopAppBar title="Account" onBack={() => router.back()} />
        {showValidationToast ? (
          <ValidationToastAlert key={toastKey} message={`Type ${ACCOUNT_DELETE_CONFIRM_WORD} to confirm`} />
        ) : null}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.contentStack}>
          <View style={s.deleteSection}>
            <View style={s.copyBlock}>
              <Text style={s.headline}>Delete your account?</Text>
              <Text style={s.body}>
                This permanently deletes your profile, sessions, and photos. Court-ordered logs may be
                retained as required by law.
              </Text>
            </View>

            <View style={s.warningBanner}>
              <WarningTriangleIcon width={16} height={16} />
              <Text style={s.warningText}>This action cannot be undone</Text>
            </View>
          </View>

          <AnimatedPressable
            onPress={() => {
              void (async () => {
                try {
                  await downloadVolunteerDataExport();
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : 'Could not prepare your data export.';
                  Alert.alert('Download failed', message);
                }
              })();
            }}
            accessibilityRole="button"
            accessibilityLabel="Download my data"
            style={s.downloadBtn}
          >
            <Text style={s.downloadBtnLabel}>Download my data</Text>
          </AnimatedPressable>
          <Text style={s.downloadHint}>
            Saves a JSON file of your profile and sessions. After you delete, a new account must pay
            again for tracker access.
          </Text>

          <View style={s.confirmBlock}>
            <Text style={s.confirmHint}>
              <Text style={s.confirmHintMuted}>To confirm this action, type </Text>
              <Text style={s.confirmHintEmphasis}>{ACCOUNT_DELETE_CONFIRM_WORD} </Text>
              <Text style={s.confirmHintMuted}>below.</Text>
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={(next) => {
                setConfirmText(next);
                if (showValidationToast || inputHasError) {
                  setShowValidationToast(false);
                  setInputHasError(false);
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={`Type ${ACCOUNT_DELETE_CONFIRM_WORD} to confirm account deletion`}
              style={[s.input, inputHasError ? s.inputError : null]}
            />
          </View>
        </View>

        <AnimatedPressable
          onPress={() => {
            void handleConfirmDelete();
          }}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
          accessibilityState={{ disabled: busy, busy }}
          style={[s.deleteBtn, busy ? s.deleteBtnBusy : null]}
        >
          {busy ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={s.deleteBtnLabel}>Delete my account</Text>
          )}
        </AnimatedPressable>
      </ScrollView>

      <LiveSessionBottomNavStack
        isActive={isActive}
        barStyle={barStyle}
        expandLiveSession={expandLiveSession}
        bottomInset={bottomInset}
      >
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => {}}
          onTrackPress={onTrackPress}
          onSessionsPress={() => {}}
          onProfilePress={() => router.replace('/account' as Href)}
        />
      </LiveSessionBottomNavStack>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topSection: {
    zIndex: 10,
    backgroundColor: colors.bgApp,
  },
  validationToast: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.statusDeclinedBg,
    borderWidth: 1,
    borderColor: colors.statusDeclinedText,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  validationToastTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.statusDeclinedText,
    marginBottom: 2,
  },
  validationToastLine: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 32,
  },
  contentStack: {
    gap: 30,
  },
  deleteSection: {
    gap: 20,
  },
  downloadBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  downloadBtnLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  downloadHint: {
    ...textStyles.bodySmall,
    color: colors.textNavInactive,
  },
  copyBlock: {
    gap: 19,
  },
  headline: {
    ...textStyles.headlineDetail,
    color: colors.statusDeclinedText,
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  warningBanner: {
    minHeight: 53,
    backgroundColor: colors.statusPendingBg,
    borderWidth: 1,
    borderColor: colors.statusPendingBorder,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  warningText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusPendingText,
  },
  confirmBlock: {
    gap: 11,
  },
  confirmHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
  },
  confirmHintMuted: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.copyright,
  },
  confirmHintEmphasis: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textPrimary,
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.statusDeclinedText,
  },
  deleteBtn: {
    height: 56,
    backgroundColor: colors.statusDeclinedText,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnBusy: {
    opacity: 0.8,
  },
  deleteBtnLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
