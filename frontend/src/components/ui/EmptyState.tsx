import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors, fontFamilies, radius, textStyles } from '@/constants/tokens';

type Props = {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  ctaAccessibilityLabel?: string;
};

/**
 * Shared blank-state card: title + optional body copy + optional CTA button.
 * Matches the look already used ad-hoc on Cart/Sessions before this existed.
 */
export function EmptyState({ title, body, ctaLabel, onCtaPress, ctaAccessibilityLabel }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      {body ? <Text style={s.body}>{body}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <AnimatedPressable
          style={s.cta}
          onPress={onCtaPress}
          accessibilityRole="button"
          accessibilityLabel={ctaAccessibilityLabel ?? ctaLabel}
        >
          <Text style={s.ctaText}>{ctaLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 24,
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
    textAlign: 'center',
    marginBottom: 8,
  },
  cta: {
    alignSelf: 'stretch',
    width: '100%',
    height: 52,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...textStyles.labelButton,
    color: colors.textOnPrimary,
  },
});
