import { Platform, StyleSheet, Text, View } from 'react-native';

import { isExpoGoClient } from '@/utils/isExpoGoClient';

import { useLiveSession } from '../liveSessionStore';
import { colors, radius, textStyles } from '../tokens';
import { Icon } from './Icon';

type Props = {
  style?: object;
};

/**
 * Real mapcn-react-native (CARTO basemap) map for Live Session / Session
 * Review. MapLibre is required lazily so Expo Go / web can register the
 * `/live-session` route without evaluating the native map module at import time.
 */
export function LiveSessionMap({ style }: Props) {
  if (isExpoGoClient()) {
    const { LiveSessionMapWebView } =
      require('./LiveSessionMapWebView') as typeof import('./LiveSessionMapWebView');
    return <LiveSessionMapWebView style={style} />;
  }

  if (Platform.OS === 'web') {
    return <ExpoGoMapFallback style={style} />;
  }

  const { LiveSessionMapNative } =
    require('./LiveSessionMapNative') as typeof import('./LiveSessionMapNative');

  return <LiveSessionMapNative style={style} />;
}

/**
 * Expo Go and web can't load MapLibre — show a static, styled placeholder
 * instead of crashing, so the rest of the flow stays previewable there.
 */
function ExpoGoMapFallback({ style }: Props) {
  const { distanceMiles, currentCoordinate } = useLiveSession();
  const trackingLabel = currentCoordinate
    ? `GPS active · ${distanceMiles.toFixed(1)} mi tracked`
    : 'Waiting for GPS fix…';

  return (
    <View style={[styles.container, styles.fallback, style]}>
      <Icon name="locationPin" size={28} color={colors.textTertiary} />
      <Text style={[textStyles.bodySmall, styles.fallbackText]}>
        Map preview needs a dev-client build{'\n'}(MapLibre isn't available in Expo Go or web)
      </Text>
      <Text style={[textStyles.bodySmall, styles.trackingText]}>{trackingLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  trackingText: {
    color: colors.primary,
    textAlign: 'center',
    fontFamily: 'NotoSans_500Medium',
  },
});
