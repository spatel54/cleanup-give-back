import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { cartoVoyagerRasterTileUrls } from '@/features/session-tracking/utils/cartoBasemap';

import { colors } from '../tokens';
import type { MapCoordinate } from '../utils/openLocationInMaps';

const PRIMARY = colors.primary;

/**
 * Carto Voyager *raster* tiles (not the vector GL style JSON). The vector
 * style paints its cream background even when `tiles-*.basemaps.cartocdn.com`
 * MVT fetches fail, which looks like a blank map with only the HTML pin.
 */
function voyagerRasterStyle() {
  return {
    version: 8 as const,
    sources: {
      voyager: {
        type: 'raster' as const,
        tiles: cartoVoyagerRasterTileUrls(),
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap',
      },
    },
    layers: [{ id: 'voyager', type: 'raster' as const, source: 'voyager' }],
  };
}

type Props = {
  address: string;
  coordinate: MapCoordinate;
  onPress: () => void;
};

function buildHtml(coordinate: MapCoordinate): string {
  const { latitude, longitude } = coordinate;
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html,body,#map{margin:0;padding:0;height:100%;width:100%;overflow:hidden;}
  .pin {
    width: 32px;
    height: 40px;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: ${JSON.stringify(voyagerRasterStyle())},
    center: [${longitude}, ${latitude}],
    zoom: 14,
    interactive: false,
    attributionControl: false,
  });
  const mapResizeObserver = new ResizeObserver(() => { map.resize(); });
  mapResizeObserver.observe(document.getElementById('map'));

  const el = document.createElement('div');
  el.className = 'pin';
  el.innerHTML = '<svg width="32" height="40" viewBox="0 0 32 40" fill="none">' +
    '<path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="${PRIMARY}"/>' +
    '<circle cx="16" cy="16" r="6" fill="#ffffff"/>' +
    '</svg>';
  // Anchor at the pin's tip (bottom-center) so it points at the coordinate.
  new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([${longitude}, ${latitude}])
    .addTo(map);

  map.on('load', () => {
    map.resize();
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  });
</script>
</body>
</html>`;
}

/**
 * Expo Go live location preview — MapLibre GL JS in a WebView with a brand pin.
 * Gestures are disabled; the native overlay opens Apple/Google Maps on tap.
 */
export function EventLocationMapWebView({ address, coordinate, onPress }: Props) {
  return (
    <View style={s.mapWrap}>
      <WebView
        style={s.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        pointerEvents="none"
        source={{ html: buildHtml(coordinate) }}
      />
      <AnimatedPressable
        scaleTo={1}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`Open ${address} in Maps`}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const s = StyleSheet.create({
  mapWrap: {
    width: '100%',
    aspectRatio: 382 / 203,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.chipSelectedBg,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.chipSelectedBg,
  },
});
