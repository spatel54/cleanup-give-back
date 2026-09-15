// PROTOTYPE — NOT FINAL.
// Shared header component for all screens.
// Variant "root" — logo + optional right element (no back button).
// Variant "detail" — back chevron + centered title + optional right element.

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

export interface ScreenHeaderProps {
  variant: 'root' | 'detail';
  title?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  variant,
  title,
  onBack,
  rightElement,
  style,
}: ScreenHeaderProps) {
  return (
    <View className="h-14 flex-row items-center px-6 bg-background border-b border-surface" style={style}>
      {variant === 'root' ? (
        // ── Root variant: logo (or title) left, optional right element ───────
        <>
          {title != null ? (
            <Text
              className="font-headline text-2xl text-on-surface flex-1"
              accessibilityRole="header"
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            <LogoOrFallback />
          )}
          <View className="w-10 items-end justify-center">
            {rightElement ?? null}
          </View>
        </>
      ) : (
        // ── Detail variant: back left, title center, optional right element ──
        <>
          <TouchableOpacity
            onPress={onBack}
            className="w-10 items-start justify-center"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-2xl text-primary leading-7">←</Text>
          </TouchableOpacity>

          <Text
            className="font-label text-base text-on-surface flex-1 text-center font-medium"
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title ?? ''}
          </Text>

          <View className="w-10 items-end justify-center">
            {rightElement ?? null}
          </View>
        </>
      )}
    </View>
  );
}

function LogoOrFallback() {
  return (
    <Image
      source={require('../../../assets/images/logos/logo-main.png')}
      className="h-7 flex-1 self-center"
      resizeMode="contain"
      accessibilityLabel="Clean-Up Give Back"
      accessibilityRole="image"
    />
  );
}
