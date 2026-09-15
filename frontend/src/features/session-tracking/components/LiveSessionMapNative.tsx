import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import { getLiveSessionMapZoom, useLiveSession } from '../liveSessionStore';
import { useEffectiveMapTheme } from '../mapThemeStore';
import { colors, radius, textStyles } from '../tokens';
import { getNativeMapStyle } from '../utils/mapStyles';
import { simplifyRouteForDisplay, appendLiveTipToDisplayRoute } from '../utils/routeFiltering';
import { LiveSessionMapCamera } from './LiveSessionMapCamera';
import { MapInteractionContainer } from './MapInteractionContainer';
import { SessionCurrentArrowMarker } from './SessionMapMarkers';

type Props = {
  style?: object;
};

/** MapLibre map branch — loaded only when not on Expo Go / web. */
export function LiveSessionMapNative({ style }: Props) {
  const {
    routeCoordinates,
    displayRouteCoordinates,
    displayCoordinate,
    currentCoordinate,
    currentHeading,
    mapRecenterToken,
    mapFollowEnabled,
    mapLayer,
  } = useLiveSession();
  const mapTheme = useEffectiveMapTheme();
  // Derived from the store snapshot, not getLiveSessionMapCenter(): that helper
  // takes no arguments and reads module state, so React Compiler memoizes it
  // with an empty dependency set and caches the first result for the life of
  // the component — freezing this map on the "Getting precise location…"
  // spinner whenever the screen mounts before the first GPS seed lands.
  const mapCenter = displayCoordinate ?? currentCoordinate ?? routeCoordinates[0] ?? null;
  const mapStyle = getNativeMapStyle(mapLayer, mapTheme);
  const displayRoute =
    displayRouteCoordinates.length >= 2
      ? displayRouteCoordinates
      : simplifyRouteForDisplay(routeCoordinates);
  const routeForMap = useMemo(
    () => appendLiveTipToDisplayRoute(displayRoute, displayCoordinate),
    [displayRoute, displayCoordinate],
  );

  // Wait for a GPS seed before mounting the map so we never flash the
  // continental US default center, then jump to the user.
  if (!mapCenter) {
    return (
      <MapInteractionContainer style={[styles.container, style]}>
        <View style={styles.waiting}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[textStyles.bodySmall, styles.waitingText]}>
            Getting precise location…
          </Text>
        </View>
      </MapInteractionContainer>
    );
  }

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      <Map
        mapStyle={mapStyle}
        center={mapCenter}
        zoom={getLiveSessionMapZoom()}
        showLoader
      >
        {routeForMap.length >= 2 && (
          <MapRoute coordinates={routeForMap} color={colors.primary} width={4} />
        )}

        {displayCoordinate && (
          <MapMarker longitude={displayCoordinate[0]} latitude={displayCoordinate[1]}>
            <SessionCurrentArrowMarker heading={currentHeading} />
          </MapMarker>
        )}

        <LiveSessionMapCamera
          currentCoordinate={displayCoordinate}
          currentHeading={currentHeading}
          recenterToken={mapRecenterToken}
          mapFollowEnabled={mapFollowEnabled}
        />
      </Map>
    </MapInteractionContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.bgSurface,
  },
  waitingText: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
