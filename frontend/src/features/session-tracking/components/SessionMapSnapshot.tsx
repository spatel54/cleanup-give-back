import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { colors } from '../tokens';
import { cartoVoyagerRasterTileUrl } from '../utils/cartoBasemap';
import type { RouteCoordinate } from '../utils/geo';
import {
  MERCATOR_TILE_SIZE,
  getSnapshotLayout,
} from '../utils/mercator';

type Props = {
  anchor: RouteCoordinate;
  coordinates?: readonly RouteCoordinate[];
  width: number;
  height: number;
};

/** Mirrors `SessionStartMarker` — 14px gray dot with a white rim. */
const START_MARKER_RADIUS = 6;
/** Mirrors `SessionEndMarker` — 22px primary ring with a white center dot. */
const END_MARKER_RADIUS = 10;
const END_MARKER_DOT_RADIUS = 4;
const MARKER_RIM_WIDTH = 2;

/** Static CARTO Voyager mosaic + SVG path for Home Recent Cleanups tiles. */
export function SessionMapSnapshot({
  anchor,
  coordinates = [],
  width,
  height,
}: Props) {
  const layout = getSnapshotLayout({ anchor, coordinates, width, height });
  if (!layout) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const hasPath = layout.pathPoints.length >= 2;
  const path = hasPath
    ? layout.pathPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
    : null;
  const start = hasPath ? layout.pathPoints[0] : null;
  const end = layout.anchorPoint;

  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      {layout.tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: cartoVoyagerRasterTileUrl(tile.z, tile.x, tile.y) }}
          style={{
            position: 'absolute',
            left: tile.left,
            top: tile.top,
            width: MERCATOR_TILE_SIZE,
            height: MERCATOR_TILE_SIZE,
          }}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      ))}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {path ? (
          <Polyline
            points={path}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {start ? (
          <Circle
            cx={start.x}
            cy={start.y}
            r={START_MARKER_RADIUS}
            fill={colors.textTertiary}
            stroke={colors.textOnPrimary}
            strokeWidth={MARKER_RIM_WIDTH}
          />
        ) : null}
        <Circle
          cx={end.x}
          cy={end.y}
          r={END_MARKER_RADIUS}
          fill={colors.primary}
          stroke={colors.textOnPrimary}
          strokeWidth={MARKER_RIM_WIDTH}
        />
        <Circle
          cx={end.x}
          cy={end.y}
          r={END_MARKER_DOT_RADIUS}
          fill={colors.textOnPrimary}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.bgSurface,
  },
  placeholder: {
    backgroundColor: colors.bgSurface,
  },
});
