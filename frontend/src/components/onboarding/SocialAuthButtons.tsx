import { type ReactNode, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  AppleIcon,
  FacebookIcon,
  GoogleIcon,
} from '@/components/onboarding/OnboardingIcons';
import { colors as C, radius, textStyles } from '@/features/figma-screens/tokens';
import { isAuthCanceledError, mapAuthErrorMessage } from '@/lib/authHelpers';
import { signInWithSocial, type SocialProvider } from '@/lib/auth';

type SocialAuthButtonsProps = {
  onSuccess?: (session: Session) => void;
  /**
   * When set, tapping a provider calls this instead of OAuth — used to defer
   * social sign-in until after personal details + the under-13 age gate.
   */
  onSelectProvider?: (provider: SocialProvider) => void;
  disabled?: boolean;
  /** Tighter vertical spacing for create-account (non-scrolling layout). */
  compact?: boolean;
  /** Icon-only horizontal row (Welcome login under OR). */
  layout?: 'stack' | 'row';
};

export function SocialAuthButtons({
  onSuccess,
  onSelectProvider,
  disabled,
  compact,
  layout = 'stack',
}: SocialAuthButtonsProps) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (provider: SocialProvider) => {
    if (disabled || busy) {
      return;
    }
    if (onSelectProvider) {
      onSelectProvider(provider);
      return;
    }
    if (!onSuccess) {
      return;
    }
    setError(null);
    setBusy(provider);
    try {
      const session = await signInWithSocial(provider);
      onSuccess(session);
    } catch (caught) {
      if (!isAuthCanceledError(caught)) {
        setError(mapAuthErrorMessage(caught));
      }
    } finally {
      setBusy(null);
    }
  };

  if (layout === 'row') {
    return (
      <View style={s.rowWrap}>
        {error ? (
          <Text style={s.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <View style={s.row}>
          <SocialIconButton
            label="Continue with Apple"
            icon={<AppleIcon />}
            busy={busy === 'apple'}
            disabled={Boolean(disabled || busy)}
            onPress={() => void run('apple')}
          />
          <SocialIconButton
            label="Continue with Google"
            icon={<GoogleIcon />}
            busy={busy === 'google'}
            disabled={Boolean(disabled || busy)}
            onPress={() => void run('google')}
          />
          <SocialIconButton
            label="Continue with Facebook"
            icon={<FacebookIcon />}
            busy={busy === 'facebook'}
            disabled={Boolean(disabled || busy)}
            onPress={() => void run('facebook')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.stack, compact && s.stackCompact]}>
      {error ? (
        <Text style={s.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <SocialButton
        label="Continue with Apple"
        icon={<AppleIcon />}
        busy={busy === 'apple'}
        disabled={Boolean(disabled || busy)}
        onPress={() => void run('apple')}
      />
      <SocialButton
        label="Continue with Google"
        icon={<GoogleIcon />}
        busy={busy === 'google'}
        disabled={Boolean(disabled || busy)}
        onPress={() => void run('google')}
      />
      <SocialButton
        label="Continue with Facebook"
        icon={<FacebookIcon />}
        busy={busy === 'facebook'}
        disabled={Boolean(disabled || busy)}
        onPress={() => void run('facebook')}
      />
    </View>
  );
}

function SocialIconButton({
  label,
  icon,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <AnimatedPressable
      style={[s.iconBtn, disabled && s.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled }}
    >
      {busy ? <ActivityIndicator color={C.textOnPrimary} /> : icon}
    </AnimatedPressable>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <AnimatedPressable
      style={[s.btn, disabled && s.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled }}
    >
      <View style={s.inner}>
        {busy ? <ActivityIndicator color={C.textOnPrimary} /> : icon}
        <Text style={s.text}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  stack: {
    gap: 18,
  },
  stackCompact: {
    gap: 12,
  },
  error: {
    ...textStyles.bodySmall,
    color: C.statusDeclinedText,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: C.textPrimary,
    borderRadius: radius.md,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  text: {
    ...textStyles.labelButton,
    color: C.textOnPrimary,
  },
  rowWrap: {
    gap: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  iconBtn: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: C.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
