import { Platform, StyleSheet, Text, View } from 'react-native';

import { isExpoGoClient } from '@/utils/isExpoGoClient';

import { colors, radius, textStyles } from '../tokens';
import { DEFAULT_MAP_LAYER, type MapLayerType } from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
import { Icon } from './Icon';

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  replayProgress?: number;
  /** Bump to re-fit the route after the user pans/zooms away. */
  recenterToken?: number;
  /** When false, the map ignores touches so parent scroll/press still work. */
  interactive?: boolean;
  style?: object;
};

function SessionRouteMapPreviewFallback({
  routeCoordinates,
  style,
}: Props) {
  const pointCount = routeCoordinates.length;
  const trackingLabel =
    pointCount >= 2
      ? `Walking path recorded · ${pointCount} GPS points`
      : pointCount === 1
        ? 'Walking path started · waiting for more GPS points'
        : 'No GPS path recorded for this session';

  return (
    <View style={[styles.container, styles.fallback, style]}>
      <Icon name="locationPin" size={28} color={colors.textTertiary} />
      <Text style={[textStyles.bodySmall, styles.fallbackText]}>
        Map preview is unavailable on web{'\n'}(use Expo Go or a dev-client build)
      </Text>
      <Text style={[textStyles.bodySmall, styles.trackingText]}>{trackingLabel}</Text>
    </View>
  );
}

/** Read-only route preview for Session Detail / submission confirmation. */
export function SessionRouteMapPreview({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  replayProgress = 1,
  recenterToken = 0,
  interactive = true,
  style,
}: Props) {
  // Resolve at render time — module-scope Constants can be wrong on first evaluate.
  if (isExpoGoClient()) {
    const { SessionRouteMapPreviewWebView } =
      require('./SessionRouteMapPreviewWebView') as typeof import('./SessionRouteMapPreviewWebView');
    return (
      <SessionRouteMapPreviewWebView
        routeCoordinates={routeCoordinates}
        mapLayer={mapLayer}
        replayProgress={replayProgress}
        recenterToken={recenterToken}
        interactive={interactive}
        style={style}
      />
    );
  }

  if (Platform.OS === 'web') {
    return <SessionRouteMapPreviewFallback routeCoordinates={routeCoordinates} style={style} />;
  }

  const { SessionRouteMapPreviewNative } =
    require('./SessionRouteMapPreviewNative') as typeof import('./SessionRouteMapPreviewNative');

  return (
    <SessionRouteMapPreviewNative
      routeCoordinates={routeCoordinates}
      mapLayer={mapLayer}
      replayProgress={replayProgress}
      recenterToken={recenterToken}
      interactive={interactive}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
