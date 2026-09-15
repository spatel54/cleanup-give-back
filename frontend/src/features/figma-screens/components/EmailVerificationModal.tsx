import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';

import { colors, fontFamilies, radius, textStyles } from '../tokens';

type Props = {
  visible: boolean;
  email: string;
  submitting?: boolean;
  error?: string;
  onConfirm: (code: string) => void;
  onCancel: () => void;
};

/**
 * Modal to enter the 6-digit code sent when changing account email.
 */
export function EmailVerificationModal({
  visible,
  email,
  submitting = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [code, setCode] = useState('');

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <EmailVerificationContent
        email={email}
        code={code}
        submitting={submitting}
        error={error}
        onChangeCode={setCode}
        onConfirm={() => onConfirm(code.trim())}
        onCancel={() => {
          setCode('');
          onCancel();
        }}
      />
    </Modal>
  );
}

function EmailVerificationContent({
  email,
  code,
  submitting,
  error,
  onChangeCode,
  onConfirm,
  onCancel,
}: {
  email: string;
  code: string;
  submitting: boolean;
  error?: string;
  onChangeCode: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { cardStyle, scrimStyle } = useModalCardEnter();
  const canConfirm = /^\d{6}$/.test(code) && !submitting;

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.cardInner}>
          <Text style={s.title} accessibilityRole="header">
            Confirm email change
          </Text>
          <Text style={s.body}>
            Enter the 6-digit code we sent to {email}.
          </Text>
          <TextInput
            style={s.codeInput}
            value={code}
            onChangeText={(text) => onChangeCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textNavInactive}
            accessibilityLabel="Verification code"
            autoFocus
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <AnimatedPressable
            style={[s.primaryBtn, !canConfirm && s.primaryBtnDisabled]}
            onPress={onConfirm}
            disabled={!canConfirm}
            accessibilityRole="button"
            accessibilityLabel="Verify code"
            accessibilityState={{ disabled: !canConfirm }}
          >
            <Text style={s.primaryLabel}>{submitting ? 'Verifying…' : 'Verify'}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.secondaryBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.secondaryLabel}>Cancel</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 27, 27, 0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 24,
  },
  cardInner: {
    gap: 16,
  },
  title: {
    ...textStyles.headlineDetail,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  error: {
    ...textStyles.bodySmall,
    color: colors.statusDeclinedText,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLabel: {
    ...textStyles.bodyDefault,
    color: colors.textTertiary,
  },
});
