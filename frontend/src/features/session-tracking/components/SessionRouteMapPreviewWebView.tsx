import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors, radius } from '../tokens';
import { DEFAULT_MAP_LAYER, getMapStylePayload, type MapLayerType } from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
import { buildWebViewMapHelpers } from '../utils/webViewMapHelpers';
import { MapInteractionContainer } from './MapInteractionContainer';

const PRIMARY = colors.primary;
const START_COLOR = colors.textTertiary;
const MAP_HELPERS = buildWebViewMapHelpers(PRIMARY, START_COLOR);

function buildHtml() {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [-98, 39],
    zoom: 3,
    attributionControl: false,
  });
  let routeAdded = false;
  let startMarker = null;
  let endMarker = null;
  let replayMarker = null;
  let pendingCoords = [];
  let displayCoords = [];
  let replayProgress = 1;
  let boundsApplied = false;

  ${MAP_HELPERS}

  function sliceCoordsByProgress(coords, progress) {
    return sliceRouteByDistanceProgress(coords, progress);
  }

  function syncPreviewMarkers(coords, progress) {
    const start = coords && coords.length > 0 ? coords[0] : null;
    const end = coords && coords.length > 1 ? coords[coords.length - 1] : null;
    const showFinalEnd = progress >= 1;

    if (start) {
      if (!startMarker) {
        startMarker = new maplibregl.Marker({ element: createStartMarkerElement(), anchor: 'center' })
          .setLngLat(start)
          .addTo(map);
      } else {
        startMarker.setLngLat(start);
      }
    }

    if (endMarker) {
      endMarker.remove();
      endMarker = null;
    }

    if (replayMarker) {
      replayMarker.remove();
      replayMarker = null;
    }

    if (end) {
      if (showFinalEnd && (!start || end[0] !== start[0] || end[1] !== start[1])) {
        endMarker = new maplibregl.Marker({ element: createEndMarkerElement(), anchor: 'center' })
          .setLngLat(end)
          .addTo(map);
      } else if (!showFinalEnd) {
        var replayHeading = null;
        if (coords.length >= 2) {
          replayHeading = computeBearingDegrees(
            coords[coords.length - 2],
            coords[coords.length - 1]
          );
        }
        replayMarker = new maplibregl.Marker({ element: createArrowMarkerElement(replayHeading), anchor: 'center' })
          .setLngLat(end)
          .addTo(map);
      }
    }
  }

  function applyRouteGeometry(coords) {
    if (!map.isStyleLoaded() || coords.length < 2) return;

    const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
    if (!routeAdded) {
      map.addSource('route', { type: 'geojson', data });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '${PRIMARY}', 'line-width': 5, 'line-opacity': 1 },
      });
      routeAdded = true;
    } else if (map.getSource('route')) {
      map.getSource('route').setData(data);
    }
  }

  function applyRoute(coords) {
    pendingCoords = coords || [];
    if (pendingCoords.length === 0) return;

    if (pendingCoords.length === 1) {
      displayCoords = pendingCoords;
      syncPreviewMarkers(pendingCoords, 1);
      if (!boundsApplied) {
        boundsApplied = true;
        map.setCenter(pendingCoords[0]);
        map.setZoom(15);
      }
      return;
    }

    displayCoords = simplifyRouteForLiveDisplay(pendingCoords);
    const visibleCoords = sliceCoordsByProgress(displayCoords, replayProgress);
    applyRouteGeometry(visibleCoords);
    syncPreviewMarkers(visibleCoords, replayProgress);

    if (!boundsApplied && displayCoords.length >= 2) {
      boundsApplied = true;
      const lngs = displayCoords.map(c => c[0]);
      const lats = displayCoords.map(c => c[1]);
      const bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      map.fitBounds(bounds, { padding: 40, duration: 0 });
    }
  }

  function applyReplayProgress(progress) {
    replayProgress = Math.max(0, Math.min(1, progress));
    if (displayCoords.length >= 2) {
      const visibleCoords = sliceCoordsByProgress(displayCoords, replayProgress);
      applyRouteGeometry(visibleCoords);
      syncPreviewMarkers(visibleCoords, replayProgress);
    }
  }

  map.on('load', () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  });

  window.showRoute = function(coords) {
    boundsApplied = false;
    applyRoute(coords);
  };

  window.setRouteReplayProgress = function(progress) {
    applyReplayProgress(progress);
  };

  window.recenterRoute = function() {
    if (!displayCoords || displayCoords.length === 0) {
      return;
    }
    if (displayCoords.length === 1) {
      map.flyTo({ center: displayCoords[0], zoom: 15, duration: 700, bearing: 0 });
      return;
    }
    const lngs = displayCoords.map(c => c[0]);
    const lats = displayCoords.map(c => c[1]);
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 40, duration: 700, bearing: 0 });
  };

  window.setMapStyle = function(stylePayload) {
    routeAdded = false;
    startMarker = null;
    endMarker = null;
    replayMarker = null;
    boundsApplied = false;
    const style = stylePayload.type === 'url' ? stylePayload.value : stylePayload.value;
    map.setStyle(style);
    map.once('style.load', () => {
      applyRoute(pendingCoords);
    });
  };
</script>
</body>
</html>`;
}

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  replayProgress?: number;
  recenterToken?: number;
  interactive?: boolean;
  style?: object;
};

/** Read-only route preview for Expo Go (submission confirmation / session detail). */
export function SessionRouteMapPreviewWebView({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  replayProgress = 1,
  recenterToken = 0,
  interactive = true,
  style,
}: Props) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const lastRecenterToken = useRef(recenterToken);

  const pushRouteUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const script = `window.showRoute(${JSON.stringify(routeCoordinates)}); window.setRouteReplayProgress(${replayProgress}); true;`;
    webRef.current.injectJavaScript(script);
  };

  const pushReplayUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const script = `window.setRouteReplayProgress(${replayProgress}); true;`;
    webRef.current.injectJavaScript(script);
  };

  const pushStyleUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const stylePayload = getMapStylePayload(mapLayer);
    const script = `window.setMapStyle(${JSON.stringify(stylePayload)}); true;`;
    webRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    pushRouteUpdate();
  }, [routeCoordinates]);

  useEffect(() => {
    pushReplayUpdate();
  }, [replayProgress]);

  useEffect(() => {
    pushStyleUpdate();
  }, [mapLayer]);

  useEffect(() => {
    if (!readyRef.current || !webRef.current) {
      return;
    }
    if (recenterToken === lastRecenterToken.current) {
      return;
    }
    lastRecenterToken.current = recenterToken;
    webRef.current.injectJavaScript('window.recenterRoute(); true;');
  }, [recenterToken]);

  const webView = (
    <WebView
      ref={webRef}
      style={styles.webview}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      nestedScrollEnabled={interactive}
      pointerEvents={interactive ? 'auto' : 'none'}
      source={{ html: buildHtml() }}
      onMessage={(event) => {
        if (event.nativeEvent.data === 'ready') {
          readyRef.current = true;
          if (mapLayer !== 'standard') {
            pushStyleUpdate();
          }
          pushRouteUpdate();
          if (!interactive && webRef.current) {
            webRef.current.injectJavaScript(
              'map.dragPan.disable(); map.scrollZoom.disable(); map.touchZoomRotate.disable(); map.doubleClickZoom.disable(); true;',
            );
          }
        }
      }}
    />
  );

  if (!interactive) {
    return (
      <View style={[styles.container, style]} pointerEvents="none">
        {webView}
      </View>
    );
  }

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      {webView}
    </MapInteractionContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
});
