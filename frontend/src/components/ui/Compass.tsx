import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Polygon } from 'react-native-svg';
import * as Location from 'expo-location';

import {
  resolveCompassHeading,
  smoothHeadingEma,
} from '@/features/session-tracking/utils/routeFiltering';

// Figma 985:567 — compass geometry (47.25×47.25 frame)
const VIEW = 47.25;
const CENTER = VIEW / 2; // 23.625

const NEEDLE_HALF = 18.9; // radius to arrowhead tip
const DIAG_HALF = 17.48; // intercardinal spoke radius (slightly shorter)
const DIAG_W = 2.469; // tick width

const CARDINAL_ANGLES = [0, 90, 180, 270] as const;
const INTERCARDINAL_ANGLES = [22.5, 45, 67.5, 112.5, 135, 157.5] as const;

const GREEN = '#009540';
const RED = '#BA1A1A';
/** Default dial ticks / facing label when no theme color is passed. */
const DEFAULT_MUTED = '#6e7a6c';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

/** Keep short — store already adaptive-EMA-smoothes; long timing stacks lag. */
const HEADING_ANIM_MS = 70;
const HEADING_EASING = Easing.out(Easing.cubic);
const HEADING_DISPLAY_DEADBAND_DEG = 0.4;

function bearingToLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  return DIRECTIONS[Math.round(normalized / 45) % 8];
}

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Shortest signed delta from `from` → `to` in (-180, 180]. */
function shortestDeltaDegrees(from: number, to: number): number {
  return ((to - from + 180) % 360 + 360) % 360 - 180;
}

/**
 * Device heading subscription with accuracy gating + adaptive EMA.
 * When `headingDegrees` is provided (e.g. live-session store), uses that
 * instead of opening a second magnetometer watch — and skips a second EMA
 * pass so dial + map arrow stay in sync without stacked lag.
 */
function useCompassHeading(headingDegrees?: number | null) {
  const angle = useSharedValue(0);
  const [label, setLabel] = useState('N');
  const smoothedRef = useRef<number | null>(null);
  const displayRef = useRef(0);

  const applyHeading = (raw: number, alreadySmoothed: boolean) => {
    const smoothed = alreadySmoothed
      ? raw
      : smoothHeadingEma(smoothedRef.current, raw);
    smoothedRef.current = smoothed;

    const delta = shortestDeltaDegrees(displayRef.current, smoothed);
    // Ignore sub-degree noise after EMA — avoids micro-jitters.
    if (Math.abs(delta) < HEADING_DISPLAY_DEADBAND_DEG) {
      setLabel(bearingToLabel(smoothed));
      return;
    }

    const nextDisplay = displayRef.current + delta;
    displayRef.current = nextDisplay;
    angle.value = withTiming(nextDisplay, {
      duration: HEADING_ANIM_MS,
      easing: HEADING_EASING,
    });
    setLabel(bearingToLabel(smoothed));
  };

  // Controlled heading from parent (preferred on live tracker).
  useEffect(() => {
    if (headingDegrees == null || !Number.isFinite(headingDegrees)) {
      return;
    }
    applyHeading(normalizeDegrees(headingDegrees), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyHeading closes over refs/shared values
  }, [headingDegrees, angle]);

  // Standalone subscription when no controlled heading is passed.
  useEffect(() => {
    if (headingDegrees !== undefined) {
      return;
    }

    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== 'granted') return;

      sub = await Location.watchHeadingAsync((data) => {
        const raw = resolveCompassHeading({
          trueHeading: data.trueHeading,
          magHeading: data.magHeading,
          accuracy: data.accuracy,
          platform: Platform.OS,
        });
        if (raw == null) return;
        applyHeading(raw, false);
      });
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headingDegrees, angle]);

  return { angle, label };
}

type Props = {
  size?: number;
  borderColor?: string;
  backgroundColor?: string;
  /**
   * Facing-direction letter + non-green/red tick marks. Pass tracker
   * `chrome.textTertiary` so the dial matches location/weather contrast.
   */
  mutedColor?: string;
  /**
   * Optional controlled heading in degrees (0–360, clockwise from true/magnetic
   * north). When set, Compass does not open its own heading watch — pass the
   * live-session store heading on the tracker so map arrow + compass stay in sync.
   */
  headingDegrees?: number | null;
};

/**
 * Compass control: dial rotates so geographic N stays correct; red tip stays
 * fixed at the top (phone facing). Center label is the facing direction.
 */
export function Compass({
  size = 44,
  borderColor = '#C8C8C8',
  backgroundColor = '#FFFFFF',
  mutedColor = DEFAULT_MUTED,
  headingDegrees,
}: Props) {
  const { angle: headingAngle, label: directionLabel } = useCompassHeading(headingDegrees);

  // Dial counter-rotates with heading so N points north in the world.
  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-headingAngle.value}deg` }],
  }));

  const borderWidth = 1;
  const innerSize = size - borderWidth * 2;
  const fontSize = Math.max(7, Math.round(innerSize * 0.27));

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          backgroundColor,
          borderWidth,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Facing ${directionLabel}`}
    >
      <View style={[styles.content, { width: innerSize, height: innerSize }]}>
        <Animated.View style={[StyleSheet.absoluteFill, dialStyle]}>
          <Svg
            width={innerSize}
            height={innerSize}
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            style={StyleSheet.absoluteFill}
          >
            <G transform={`translate(${CENTER}, ${CENTER})`}>
              {INTERCARDINAL_ANGLES.map((a) => (
                <G key={a} transform={`rotate(${a})`} opacity={0.9}>
                  <Polygon
                    points={`0,${-DIAG_HALF} ${-DIAG_W},${-DIAG_HALF + 3} ${DIAG_W},${-DIAG_HALF + 3}`}
                    fill={mutedColor}
                  />
                  <Polygon
                    points={`0,${DIAG_HALF} ${-DIAG_W},${DIAG_HALF - 3} ${DIAG_W},${DIAG_HALF - 3}`}
                    fill={mutedColor}
                  />
                </G>
              ))}

              {CARDINAL_ANGLES.map((a) => (
                <G key={a} transform={`rotate(${a})`} opacity={0.8}>
                  <Polygon
                    points={`0,${-NEEDLE_HALF} ${-DIAG_W},${-NEEDLE_HALF + 3} ${DIAG_W},${-NEEDLE_HALF + 3}`}
                    fill={GREEN}
                  />
                </G>
              ))}
            </G>
          </Svg>
        </Animated.View>

        {/* Fixed phone-forward marker (top) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={innerSize} height={innerSize} viewBox={`0 0 ${VIEW} ${VIEW}`}>
            <G transform={`translate(${CENTER}, ${CENTER})`}>
              <Polygon
                points={`0,${-NEEDLE_HALF} ${-DIAG_W},${-NEEDLE_HALF + 3} ${DIAG_W},${-NEEDLE_HALF + 3}`}
                fill={RED}
                opacity={0.9}
              />
            </G>
          </Svg>
        </View>

        <View style={styles.labelLayer} pointerEvents="none">
          <Text
            style={[
              styles.directionLabel,
              { fontSize, lineHeight: fontSize, color: mutedColor },
            ]}
          >
            {directionLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionLabel: {
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
