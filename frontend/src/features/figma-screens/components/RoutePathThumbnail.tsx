import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { colors } from '../tokens';

type Props = {
  coordinates: readonly [number, number][];
  width: number;
  height: number;
};

const PAD = 6;

/** Lightweight walking-path glyph for Home impact tiles (no MapLibre WebView). */
export function RoutePathThumbnail({ coordinates, width, height }: Props) {
  if (coordinates.length < 2) {
    return null;
  }

  const longitudes = coordinates.map((point) => point[0]);
  const latitudes = coordinates.map((point) => point[1]);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const lonSpan = Math.max(maxLon - minLon, 0.0001);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const innerW = Math.max(width - PAD * 2, 1);
  const innerH = Math.max(height - PAD * 2, 1);

  const points = coordinates
    .map(([lon, lat]) => {
      const x = PAD + ((lon - minLon) / lonSpan) * innerW;
      const y = PAD + (1 - (lat - minLat) / latSpan) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={[s.wrap, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.bgSurfaceElevated,
  },
});
