import { Platform, StyleSheet, Text } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { isExpoGoClient } from '@/utils/isExpoGoClient';

import { EventLocationPinIcon } from './EventIcons';
import { colors, fontFamilies } from '../tokens';
import type { MapCoordinate } from '../utils/openLocationInMaps';

type Props = {
  address: string;
  coordinate: MapCoordinate;
  onPress: () => void;
};

function EventLocationMapFallback({ address, onPress }: { address: string; onPress: () => void }) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`Open ${address} in Maps`}
      style={s.fallback}
    >
      <EventLocationPinIcon size={32} />
      <Text style={s.fallbackTitle}>Open in Maps</Text>
      <Text style={s.fallbackAddress} numberOfLines={2}>
        {address}
      </Text>
    </AnimatedPressable>
  );
}

/**
 * Event location map — live MapLibre pin (WebView in Expo Go, native in
 * dev-client/production). Web keeps a Maps CTA card. Tap opens Apple Maps
 * (iOS) or Google Maps (Android/web).
 */
export function EventLocationMap({ address, coordinate, onPress }: Props) {
  if (Platform.OS === 'web') {
    return <EventLocationMapFallback address={address} onPress={onPress} />;
  }

  if (isExpoGoClient()) {
    const { EventLocationMapWebView } =
      require('./EventLocationMapWebView') as typeof import('./EventLocationMapWebView');
    return (
      <EventLocationMapWebView address={address} coordinate={coordinate} onPress={onPress} />
    );
  }

  const { EventLocationMapNative } =
    require('./EventLocationMapNative') as typeof import('./EventLocationMapNative');

  return (
    <EventLocationMapNative address={address} coordinate={coordinate} onPress={onPress} />
  );
}

const s = StyleSheet.create({
  fallback: {
    width: '100%',
    aspectRatio: 382 / 203,
    borderRadius: 10,
    backgroundColor: colors.chipSelectedBg,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  fallbackAddress: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
});
