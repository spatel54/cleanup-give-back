import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../tokens';

type ArrowProps = {
  heading: number | null;
};

/** Overall square footprint of the heading marker, in px. Kept square so the
 * rotation transform below pivots around the dot's own center. Sized to
 * comfortably fit the beam's outer radius with margin to spare. */
const HEADING_MARKER_SIZE = 100;
const HEADING_MARKER_CENTER = HEADING_MARKER_SIZE / 2;
/** Outer white halo / inner primary dot radii, in px. */
const HEADING_DOT_OUTER_RADIUS = 11;
const HEADING_DOT_INNER_RADIUS = 7;
/**
 * Google Maps-style location beam: flared cone-cylinder — wider at the dot,
 * sides diverge outward (never converge to a point), rounded inner cap on the
 * dot, semicircular far arc. Opacity falls off with distance and reaches 0 at
 * the tip via stacked length slices (no gradient refs — native Marker safety).
 */
const HEADING_BEAM_LENGTH = 66;
const HEADING_BEAM_INNER_HALF_WIDTH = 11;
const HEADING_BEAM_OUTER_HALF_WIDTH = 30;
const HEADING_BEAM_LAYER_COUNT = 14;
const HEADING_BEAM_MAX_OPACITY = 0.24;

function beamHalfWidthAt(progress: number): number {
  return (
    HEADING_BEAM_INNER_HALF_WIDTH +
    (HEADING_BEAM_OUTER_HALF_WIDTH - HEADING_BEAM_INNER_HALF_WIDTH) * progress
  );
}

/** Opacity at the outer edge of a slice; 0 when progress reaches 1. */
function beamOpacityAt(progress: number): number {
  return HEADING_BEAM_MAX_OPACITY * (1 - progress);
}

/** One band of the beam from progress t0 → t1 along its length. */
function buildBeamSlicePath(
  cx: number,
  cy: number,
  t0: number,
  t1: number,
  innerCapRadius: number,
): string {
  const length0 = HEADING_BEAM_LENGTH * t0;
  const length1 = HEADING_BEAM_LENGTH * t1;
  const w0 = beamHalfWidthAt(t0);
  const w1 = beamHalfWidthAt(t1);
  const atTip = t1 >= 1;

  if (t0 === 0) {
    const innerCapOffsetY = Math.sqrt(Math.max(0, innerCapRadius * innerCapRadius - w0 * w0));
    const innerLeft = { x: cx - w0, y: cy - innerCapOffsetY };
    const innerRight = { x: cx + w0, y: cy - innerCapOffsetY };
    const outerLeft = { x: cx - w1, y: cy - length1 };
    const outerRight = { x: cx + w1, y: cy - length1 };
    return [
      `M ${innerLeft.x} ${innerLeft.y}`,
      `A ${innerCapRadius} ${innerCapRadius} 0 0 1 ${innerRight.x} ${innerRight.y}`,
      `L ${outerRight.x} ${outerRight.y}`,
      atTip
        ? `A ${w1} ${w1} 0 0 0 ${outerLeft.x} ${outerLeft.y}`
        : `L ${outerLeft.x} ${outerLeft.y}`,
      `L ${innerLeft.x} ${innerLeft.y}`,
      'Z',
    ].join(' ');
  }

  const innerLeft = { x: cx - w0, y: cy - length0 };
  const innerRight = { x: cx + w0, y: cy - length0 };
  const outerLeft = { x: cx - w1, y: cy - length1 };
  const outerRight = { x: cx + w1, y: cy - length1 };
  return [
    `M ${innerLeft.x} ${innerLeft.y}`,
    `L ${innerRight.x} ${innerRight.y}`,
    `L ${outerRight.x} ${outerRight.y}`,
    atTip ? `A ${w1} ${w1} 0 0 0 ${outerLeft.x} ${outerLeft.y}` : `L ${outerLeft.x} ${outerLeft.y}`,
    `L ${innerLeft.x} ${innerLeft.y}`,
    'Z',
  ].join(' ');
}

function buildBeamLayers(cx: number, cy: number, innerCapRadius: number) {
  const layers: { path: string; opacity: number }[] = [];
  for (let i = 0; i < HEADING_BEAM_LAYER_COUNT; i++) {
    const t0 = i / HEADING_BEAM_LAYER_COUNT;
    const t1 = (i + 1) / HEADING_BEAM_LAYER_COUNT;
    const opacity = beamOpacityAt(t1);
    if (opacity <= 0) continue;
    layers.push({
      path: buildBeamSlicePath(cx, cy, t0, t1, innerCapRadius),
      opacity,
    });
  }
  return layers;
}

/** Circle at the session start point. Live tracker uses gray; route
 * replay/preview passes fill/border from `getReplayStartMarkerColors` so the
 * pin stays visible on both light Standard and dark Satellite/Hybrid maps. */
export function SessionStartMarker({
  color = colors.textTertiary,
  borderColor = colors.textOnPrimary,
}: {
  color?: string;
  borderColor?: string;
}) {
  return <View style={[styles.startMarker, { backgroundColor: color, borderColor }]} />;
}

/**
 * Live current-position marker: a primary-green dot with a white halo and,
 * once a GPS heading is available, a soft directional beam (flared
 * cone-cylinder: rounded inner cap on the dot, sides widen toward the tip,
 * opacity fading to zero at the far arc)
 * pointing the way the user is heading. The beam only appears when
 * `heading` is a valid number; otherwise a plain dot is shown. The whole
 * SVG rotates around its own center (which is also the dot's center), so
 * the dot stays pinned to the coordinate while the cone sweeps around it.
 */
export function SessionCurrentArrowMarker({ heading }: ArrowProps) {
  const hasHeading = heading != null && Number.isFinite(heading);

  return (
    <View
      style={[
        styles.headingMarker,
        hasHeading && { transform: [{ rotate: `${heading}deg` }] },
      ]}
    >
      <View style={styles.headingDotShadow} pointerEvents="none" />
      <Svg width={HEADING_MARKER_SIZE} height={HEADING_MARKER_SIZE}>
        {hasHeading &&
          buildBeamLayers(HEADING_MARKER_CENTER, HEADING_MARKER_CENTER, HEADING_DOT_OUTER_RADIUS).map(
            (layer, index) => (
              <Path
                key={index}
                d={layer.path}
                fill={colors.primary}
                fillOpacity={layer.opacity}
              />
            ),
          )}
        <Circle
          cx={HEADING_MARKER_CENTER}
          cy={HEADING_MARKER_CENTER}
          r={HEADING_DOT_OUTER_RADIUS}
          fill={colors.textOnPrimary}
        />
        <Circle
          cx={HEADING_MARKER_CENTER}
          cy={HEADING_MARKER_CENTER}
          r={HEADING_DOT_INNER_RADIUS}
          fill={colors.primary}
        />
      </Svg>
    </View>
  );
}

/** Green ring marker for the session end point on previews. */
export function SessionEndMarker() {
  return (
    <View style={styles.endMarker}>
      <View style={styles.endMarkerDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  headingMarker: {
    width: HEADING_MARKER_SIZE,
    height: HEADING_MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingDotShadow: {
    position: 'absolute',
    width: HEADING_DOT_OUTER_RADIUS * 2,
    height: HEADING_DOT_OUTER_RADIUS * 2,
    borderRadius: HEADING_DOT_OUTER_RADIUS,
    backgroundColor: colors.textOnPrimary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  endMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  endMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
});
