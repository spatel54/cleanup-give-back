import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import {
  mockRouteCenter,
  mockRouteCoordinates,
  mockRouteCurrent,
  mockRouteStart,
} from '../mocks/session';
import { colors, radius, textStyles } from '../tokens';
import { Icon } from './Icon';

/**
 * True in Expo Go (MapLibre is a native module and cannot run there) or on
 * web (`@maplibre/maplibre-react-native`'s native components call
 * `codegenNativeComponent`, unimplemented by `react-native-web` — see
 * `@/components/ui/map.web.tsx`). See README.md "Previewing this feature"
 * for the dev-client build steps.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const needsFallback = isExpoGo || Platform.OS === 'web';

type Props = {
  style?: object;
};

/**
 * Real mapcn-react-native (CARTO basemap) map for Live Session / Session
 * Review, wrapping the shadcn-style primitive at `@/components/ui/map`.
 * Route + markers are static mock data (mocks/session.ts) — no live GPS.
 */
export function LiveSessionMap({ style }: Props) {
  if (needsFallback) {
    return <ExpoGoMapFallback style={style} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Map center={mockRouteCenter} zoom={14.5} showLoader>
        <MapRoute coordinates={mockRouteCoordinates} color={colors.primary} width={4} />
        <MapMarker longitude={mockRouteStart[0]} latitude={mockRouteStart[1]}>
          <View style={styles.startMarker} />
        </MapMarker>
        <MapMarker longitude={mockRouteCurrent[0]} latitude={mockRouteCurrent[1]}>
          <View style={styles.currentMarker}>
            <View style={styles.currentMarkerDot} />
          </View>
        </MapMarker>
      </Map>
    </View>
  );
}

/**
 * Expo Go and web can't load MapLibre — show a static, styled placeholder
 * instead of crashing, so the rest of the flow stays previewable there.
 */
function ExpoGoMapFallback({ style }: Props) {
  return (
    <View style={[styles.container, styles.fallback, style]}>
      <Icon name="locationPin" size={28} color={colors.textTertiary} />
      <Text style={[textStyles.bodySmall, styles.fallbackText]}>
        Map preview needs a dev-client build{'\n'}(MapLibre isn't available in Expo Go or web)
      </Text>
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
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textTertiary,
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  currentMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  currentMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
});
