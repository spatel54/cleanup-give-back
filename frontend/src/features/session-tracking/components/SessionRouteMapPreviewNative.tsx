import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import { colors, radius } from '../tokens';
import { DEFAULT_MAP_LAYER, getNativeMapStyle, type MapLayerType } from '../utils/mapStyles';
import {
  getRouteMapCenter,
  getRouteMapZoom,
  type RouteCoordinate,
} from '../utils/geo';
import { simplifyRouteForLiveDisplay, computeBearingDegrees, sliceRouteByDistanceProgress } from '../utils/routeFiltering';
import { MapInteractionContainer } from './MapInteractionContainer';
import { SessionRouteMapPreviewCamera } from './SessionRouteMapPreviewCamera';
import { SessionCurrentArrowMarker, SessionEndMarker, SessionStartMarker } from './SessionMapMarkers';

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  replayProgress?: number;
  /** Bump to re-fit the route after the user pans/zooms away. */
  recenterToken?: number;
  interactive?: boolean;
  style?: object;
};

/** MapLibre branch for read-only session route previews. */
export function SessionRouteMapPreviewNative({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  replayProgress = 1,
  recenterToken = 0,
  interactive = true,
  style,
}: Props) {
  const displayRoute = useMemo(
    () => simplifyRouteForLiveDisplay(routeCoordinates),
    [routeCoordinates],
  );
  const visibleRoute = useMemo(
    () => sliceRouteByDistanceProgress(displayRoute, replayProgress),
    [displayRoute, replayProgress],
  );

  const mapCenter = getRouteMapCenter(displayRoute);
  const mapZoom = getRouteMapZoom(displayRoute);
  const routeStart = visibleRoute[0] ?? null;
  const routeHead = visibleRoute[visibleRoute.length - 1] ?? null;
  const replayHeading =
    visibleRoute.length >= 2
      ? computeBearingDegrees(visibleRoute[visibleRoute.length - 2], routeHead!)
      : null;
  const showFinalEnd = replayProgress >= 1;
  const mapStyle = getNativeMapStyle(mapLayer);
  const map = (
      <Map
        key={mapLayer}
        styles={{ light: mapStyle, dark: mapStyle }}
        center={mapCenter}
        zoom={mapZoom}
        showLoader
      >
        {visibleRoute.length >= 2 && (
          <MapRoute coordinates={visibleRoute} color={colors.primary} width={4} />
        )}

        {routeStart && (
          <MapMarker longitude={routeStart[0]} latitude={routeStart[1]}>
            <SessionStartMarker />
          </MapMarker>
        )}

        {routeHead && routeHead !== routeStart && showFinalEnd && (
          <MapMarker longitude={routeHead[0]} latitude={routeHead[1]}>
            <SessionEndMarker />
          </MapMarker>
        )}

        {routeHead && routeHead !== routeStart && !showFinalEnd && (
          <MapMarker longitude={routeHead[0]} latitude={routeHead[1]}>
            <SessionCurrentArrowMarker heading={replayHeading} />
          </MapMarker>
        )}

        <SessionRouteMapPreviewCamera
          routeCoordinates={displayRoute}
          recenterToken={recenterToken}
        />
      </Map>
  );

  if (!interactive) {
    return (
      <View style={[styles.container, style]} pointerEvents="none">
        {map}
      </View>
    );
  }

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      {map}
    </MapInteractionContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
