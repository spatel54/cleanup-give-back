import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { CameraView, type FlashMode, useCameraPermissions } from 'expo-camera';
import {
  ZOOM_MAX_FACTOR,
  ZOOM_MIN_FACTOR,
  crossesLensBoundary,
  dialToFactor as zoomToFactor,
  factorToDial as factorToZoom,
  resolveZoomPlan,
  type AvailableLensesPayload,
} from '@/lib/cameraZoom';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { BrandLoadingView } from '@/components/ui/BrandLoadingView';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { durations, easing, staggerDelay } from '@/motion';
import { finalizeAndLeaveSession } from '@/features/session-tracking/finalizeAndLeaveSession';
import { addPhotoCheckpoint, resetCheckpointCountdown, resolveCheckpointCaptureCoords, useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { startPendingLiveSession } from '@/features/session-tracking/startPendingLiveSession';
import {
  clearPendingSessionStartPhotos,
} from '@/features/session-tracking/pendingSessionSetup';
import { persistCheckpointPhotos } from '@/features/session-tracking/utils/persistCheckpointPhotos';
import { FlashWarningModal } from '@/features/session-tracking/components/FlashWarningModal';
import { isNighttime } from '@/utils/sunTimes';
import { colors as tokens, radius, textStyles } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  overlay: tokens.overlayScrimStrong,
  footer: tokens.textPrimary,
  footerDim: 'rgba(28, 27, 27, 0.75)',
  zoomAccent: tokens.statusPendingBorder,
  statusDeclinedText: tokens.statusDeclinedText,
} as const;

const PIP_SIZE = 170;
const PIP_RIGHT = 17;
const PIP_TOP = 14;

const FLASH_CYCLE: FlashMode[] = ['off', 'on', 'auto'];

const ZOOM_MAJOR_STOPS = [0.5, 1, 2, 3, 5] as const;
const ZOOM_TICK_STEP = 0.1;
// ZOOM_DIAL_TOP_INSET is 0 so the dial's topmost point (the 0.5× tick) starts
// right at the container's top edge — putting the fixed caret + value label
// (zoomOverlay, top:8) visually inside the dial's dark circle instead of
// floating in blank space above it. ZOOM_WHEEL_HEIGHT is increased by the
// same amount removed from the inset so the visible arc keeps its prior
// breathing room at the bottom rather than crowding the pills below.
const ZOOM_WHEEL_HEIGHT = 266;
const ZOOM_DIAL_TOP_INSET = 0;
/** Finger travel in px to traverse the full 0–1 zoom range. */
const ZOOM_PAN_SENSITIVITY = 0.012;
const ZOOM_ARC_SPAN_DEG = 80;
// Distance ticks are pulled in from the dial's rim. Near the top of a circle
// the curve is nearly flat, so ticks close to the rim (small gap) sit almost
// on top of one another in y — and right where the fixed caret/value label
// render (they overlap the currently-selected tick, which is always rotated
// to the top). Pulling ticks in creates a plain dark collar at the rim for
// the caret to sit in without touching any tick line or label.
const ZOOM_TICK_RIM_GAP = 48;
const ZOOM_PILL_FACTORS = [0.5, 1, 3] as const;
const ZOOM_PILL = {
  height: 44,
  border: 2,
  minWidth: 56,
  paddingH: 18,
} as const;
const ZOOM_PILL_RADIUS = ZOOM_PILL.height / 2;
const ZOOM_PILL_INNER_RADIUS = ZOOM_PILL_RADIUS - ZOOM_PILL.border;
const ZOOM_PILL_RING_IDLE = 'rgba(255,255,255,0.35)';
const ZOOM_PILL_FILL_IDLE = tokens.overlayScrimStrong;
/** Same dark face when selected — gold ring alone marks the active preset. */
const ZOOM_PILL_FILL_ACTIVE = ZOOM_PILL_FILL_IDLE;
// Width of the gradient overlays that fade ticks near the screen edges,
// standing in for a hard overflow:'hidden' clip as the dial rotates.
const ZOOM_FADE_WIDTH = 64;

const SCREEN_WIDTH = Dimensions.get('window').width;

function nextFlashMode(current: FlashMode): FlashMode {
  const index = FLASH_CYCLE.indexOf(current);
  return FLASH_CYCLE[(index + 1) % FLASH_CYCLE.length] ?? 'off';
}

function flashLabel(mode: FlashMode): string {
  switch (mode) {
    case 'off':
      return 'Flash off';
    case 'on':
      return 'Flash on';
    case 'auto':
      return 'Flash auto';
    case 'screen':
      return 'Screen flash';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function formatZoomFactor(factor: number): string {
  if (Math.abs(factor - Math.round(factor)) < 0.05) {
    return `${Math.round(factor)}×`;
  }
  return `${factor.toFixed(1)}×`;
}

function FlashIcon({ mode }: { mode: FlashMode }) {
  const stroke = C.textOnPrimary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"
        fill={mode === 'off' ? 'none' : stroke}
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      {mode === 'off' ? (
        <Path
          d="M4 4l16 16"
          stroke={stroke}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
      ) : null}
      {mode === 'auto' ? (
        <Path
          d="M17.5 4.5h3M19 3v3"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

function FlashToggle({
  mode,
  onPress,
}: {
  mode: FlashMode;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={s.flashBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={flashLabel(mode)}
      accessibilityHint="Cycles flash off, on, and auto"
    >
      <FlashIcon mode={mode} />
      <Text style={s.flashBtnText}>
        {mode === 'off' ? 'Off' : mode === 'on' ? 'On' : 'Auto'}
      </Text>
    </AnimatedPressable>
  );
}

type ZoomTick = {
  factor: number;
  major: boolean;
  label?: string;
};

function buildZoomTicks(): ZoomTick[] {
  const ticks: ZoomTick[] = [];
  const steps = Math.round((ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR) / ZOOM_TICK_STEP);
  for (let i = 0; i <= steps; i += 1) {
    const factor = Number((ZOOM_MIN_FACTOR + i * ZOOM_TICK_STEP).toFixed(1));
    const major = (ZOOM_MAJOR_STOPS as readonly number[]).includes(factor);
    ticks.push({
      factor,
      major,
      label: major ? String(factor) : undefined,
    });
  }
  return ticks;
}

const ZOOM_TICKS = buildZoomTicks();

type ZoomPillProps = {
  factor: number;
  isActive: boolean;
  gesture: ReturnType<typeof Gesture.Exclusive>;
  pressed: SharedValue<number>;
};

/** Tap/drag zoom preset — inset ring (padding) draws an even 2px border on all sides. */
function ZoomPill({ factor, isActive, gesture, pressed }: ZoomPillProps) {
  const idleRingColor = isActive ? C.zoomAccent : ZOOM_PILL_RING_IDLE;

  const containerAnim = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(1 - 0.08 * pressed.value, { duration: 80 }) }],
  }));

  const ringAnim = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [idleRingColor, C.zoomAccent],
      ),
    }),
    [idleRingColor],
  );

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={containerAnim}
        accessibilityRole="button"
        accessibilityLabel={`${factor}× zoom`}
        accessibilityHint="Tap to zoom, drag to open wheel"
      >
        <Animated.View style={[s.zoomPillRing, ringAnim]}>
          <View
            style={[
              s.zoomPillFace,
              { backgroundColor: isActive ? ZOOM_PILL_FILL_ACTIVE : ZOOM_PILL_FILL_IDLE },
            ]}
          >
            <Text style={[s.zoomPillLabel, isActive && s.zoomPillLabelActive]}>
              {factor}
              <Text style={s.zoomPillSuffix}>×</Text>
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * Zoom control: three tap-to-zoom pills. Dragging any pill reveals the arc
 * wheel; swipe RIGHT on the wheel = zoom IN.
 *
 * All gesture handling is worklet-only (UI thread). The isDragging guard
 * prevents the JS-thread useEffect from stomping on mid-drag zoomSV values.
 * Used on the **back** camera step only — selfie hides zoom UI and stays at 0.5×.
 */
function ZoomControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (zoom: number) => void;
}) {
  const wheelReveal = useSharedValue(0);
  const zoomSV = useSharedValue(value);
  const dragStartSV = useSharedValue(value);
  const isDragging = useSharedValue(false);

  // One shared value per pill (fixed count — ZOOM_PILL_FACTORS has exactly 3
  // entries) drives the pressed-state animation below.
  const pill0Pressed = useSharedValue(0);
  const pill1Pressed = useSharedValue(0);
  const pill2Pressed = useSharedValue(0);
  const pillPressedSVs = [pill0Pressed, pill1Pressed, pill2Pressed];

  const wheelWidth = SCREEN_WIDTH;
  const radius = wheelWidth * 0.72;
  const cx = radius;
  const cy = radius;
  const degPerFactor = ZOOM_ARC_SPAN_DEG / (ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR);
  const range = ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR;

  const currentFactor = zoomToFactor(value);
  const label = formatZoomFactor(currentFactor);

  // Only sync from React state when no gesture is active — mid-drag syncs
  // would reset zoomSV to a stale JS value, causing the dial to jump backward.
  useEffect(() => {
    if (!isDragging.value) {
      zoomSV.value = value;
      dragStartSV.value = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values stable
  }, [value]);

  const notifyChange = useCallback((v: number) => { onChange(v); }, [onChange]);

  // ── Animated styles ────────────────────────────────────────────────────────

  // Pills rest near the footer; sliding up toward the wheel's centered
  // position (rather than fading in place) makes the transition read as the
  // controls moving up to meet the revealed dial.
  const pillsAnim = useAnimatedStyle(() => ({
    opacity: 1 - wheelReveal.value,
    transform: [{ translateY: -wheelReveal.value * 80 }],
  }));

  // opacity + translateY: opacity keeps the arc invisible when not in use even
  // if overflow:hidden fails to clip absolutely-positioned children (Android).
  const wheelAnim = useAnimatedStyle(() => ({
    opacity: wheelReveal.value,
    transform: [{ translateY: (1 - wheelReveal.value) * ZOOM_WHEEL_HEIGHT }],
  }));

  // Negative rotation: higher zoom brings right-side ticks under the caret.
  // Positive would scroll into the blank arc left of 0.5×.
  const dialStyle = useAnimatedStyle(() => {
    const factor = ZOOM_MIN_FACTOR + zoomSV.value * range;
    const rotation = -(factor - ZOOM_MIN_FACTOR) * degPerFactor;
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  // ── Gestures ───────────────────────────────────────────────────────────────

  // Wheel pan — drag LEFT = zoom in (higher values scroll rightward past the caret).
  const wheelPan = useMemo(() => Gesture.Pan()
    .onBegin(() => {
      'worklet';
      isDragging.value = true;
      dragStartSV.value = zoomSV.value;
    })
    .onUpdate((e) => {
      'worklet';
      const next = dragStartSV.value - e.translationX * ZOOM_PAN_SENSITIVITY;
      const clamped = Math.min(1, Math.max(0, next));
      zoomSV.value = clamped;
      runOnJS(notifyChange)(clamped);
    })
    .onFinalize(() => {
      'worklet';
      isDragging.value = false;
      wheelReveal.value = withTiming(0, { duration: 200 });
    })
    .minDistance(0)
    .activeOffsetX([-3, 3]),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values stable
  [notifyChange]);

  // Per-pill: tap sets zoom only; drag reveals the wheel and fine-tunes.
  // Drag LEFT = zoom in. onStart compensates for pre-activation drift so the
  // dial pins exactly to this pill's zoom the instant the wheel appears.
  const pillGestures = useMemo(() => {
    return (ZOOM_PILL_FACTORS as readonly number[]).map((factor, i) => {
      const targetZoom = factorToZoom(factor);
      const pressed = pillPressedSVs[i]!;

      const tap = Gesture.Tap()
        .onBegin(() => {
          'worklet';
          pressed.value = withTiming(1, { duration: 80 });
        })
        .onEnd(() => {
          'worklet';
          zoomSV.value = targetZoom;
          dragStartSV.value = targetZoom;
          runOnJS(notifyChange)(targetZoom);
        })
        .onFinalize(() => {
          'worklet';
          pressed.value = withTiming(0, { duration: 120 });
        });

      const drag = Gesture.Pan()
        .onBegin(() => {
          'worklet';
          pressed.value = withTiming(1, { duration: 80 });
        })
        .onStart((e: { translationX: number }) => {
          'worklet';
          isDragging.value = true;
          // With negated pan (left = zoom in): next = dragStart - translationX * sens.
          // At activation: next = targetZoom → dragStart = targetZoom + translationX * sens.
          dragStartSV.value = targetZoom + e.translationX * ZOOM_PAN_SENSITIVITY;
          zoomSV.value = targetZoom;
          runOnJS(notifyChange)(targetZoom);
          wheelReveal.value = withTiming(1, { duration: 200 });
        })
        .onUpdate((e: { translationX: number }) => {
          'worklet';
          const next = dragStartSV.value - e.translationX * ZOOM_PAN_SENSITIVITY;
          const clamped = Math.min(1, Math.max(0, next));
          zoomSV.value = clamped;
          runOnJS(notifyChange)(clamped);
        })
        .onFinalize(() => {
          'worklet';
          isDragging.value = false;
          wheelReveal.value = withTiming(0, { duration: 200 });
          pressed.value = withTiming(0, { duration: 120 });
        })
        .minDistance(0)
        .activeOffsetX([-5, 5])
        .failOffsetY([-20, 20]);

      return Gesture.Exclusive(tap, drag);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values stable
  }, [notifyChange]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={s.zoomControlRoot}>
      {/* Arc wheel — slides up from below when dragging a pill */}
      <Animated.View
        style={[StyleSheet.absoluteFill, wheelAnim]}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={wheelPan}>
          <View
            style={s.zoomDialHit}
            accessibilityLabel={`Zoom ${label}`}
            accessibilityHint="Swipe left to zoom in, right to zoom out"
          >
            <View style={s.zoomOverlay} pointerEvents="none">
              <Text style={s.zoomValue}>{label}</Text>
              <View style={s.zoomCaret} />
            </View>

            <Animated.View
              style={[
                s.zoomDialSpin,
                {
                  position: 'absolute',
                  top: ZOOM_DIAL_TOP_INSET,
                  left: wheelWidth / 2 - radius,
                  width: radius * 2,
                  height: radius * 2,
                },
                dialStyle,
              ]}
              renderToHardwareTextureAndroid
            >
              <Svg width={radius * 2} height={radius * 2}>
                <Circle cx={cx} cy={cy} r={radius - 0.5} fill="rgba(28,27,27,0.5)" />
                {ZOOM_TICKS.map((tick) => {
                  const angleDeg = -90 + (tick.factor - ZOOM_MIN_FACTOR) * degPerFactor;
                  const rad = (angleDeg * Math.PI) / 180;
                  const outer = radius - ZOOM_TICK_RIM_GAP;
                  const inner = tick.major ? outer - 18 : outer - 10;
                  const x1 = cx + outer * Math.cos(rad);
                  const y1 = cy + outer * Math.sin(rad);
                  const x2 = cx + inner * Math.cos(rad);
                  const y2 = cy + inner * Math.sin(rad);
                  const labelR = outer - 34;
                  const lx = cx + labelR * Math.cos(rad);
                  const ly = cy + labelR * Math.sin(rad);
                  return (
                    <G key={`tick-${tick.factor}`}>
                      <Line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="rgba(255,255,255,0.88)"
                        strokeWidth={tick.major ? 2 : 1}
                        strokeLinecap="round"
                      />
                      {tick.label ? (
                        <SvgText
                          x={lx} y={ly}
                          fill="rgba(255,255,255,0.95)"
                          fontSize={13} fontWeight="600"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          rotation={angleDeg + 90}
                          origin={`${lx},${ly}`}
                        >
                          {tick.label}
                        </SvgText>
                      ) : null}
                    </G>
                  );
                })}
              </Svg>
            </Animated.View>

            {/* Fixed (non-rotating) edge fade, clipped to the same circle as
                the dial's own rim so the fade follows the round dial shape
                instead of cutting a straight rectangular edge across it. */}
            <Svg
              width={wheelWidth}
              height={ZOOM_WHEEL_HEIGHT}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Defs>
                <ClipPath id="zoomDialRimClip">
                  <Circle
                    cx={wheelWidth / 2}
                    cy={radius + ZOOM_DIAL_TOP_INSET}
                    r={radius - 0.5}
                  />
                </ClipPath>
                <LinearGradient id="zoomTickFadeLeft" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0"    stopColor="#1c1b1b" stopOpacity={0.85} />
                  <Stop offset="0.35" stopColor="#1c1b1b" stopOpacity={0.45} />
                  <Stop offset="0.7"  stopColor="#1c1b1b" stopOpacity={0.15} />
                  <Stop offset="1"    stopColor="#1c1b1b" stopOpacity={0} />
                </LinearGradient>
                <LinearGradient id="zoomTickFadeRight" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0"    stopColor="#1c1b1b" stopOpacity={0} />
                  <Stop offset="0.3"  stopColor="#1c1b1b" stopOpacity={0.15} />
                  <Stop offset="0.65" stopColor="#1c1b1b" stopOpacity={0.45} />
                  <Stop offset="1"    stopColor="#1c1b1b" stopOpacity={0.85} />
                </LinearGradient>
              </Defs>
              <G clipPath="url(#zoomDialRimClip)">
                <Rect
                  x={0} y={0}
                  width={ZOOM_FADE_WIDTH} height={ZOOM_WHEEL_HEIGHT}
                  fill="url(#zoomTickFadeLeft)"
                />
                <Rect
                  x={wheelWidth - ZOOM_FADE_WIDTH} y={0}
                  width={ZOOM_FADE_WIDTH} height={ZOOM_WHEEL_HEIGHT}
                  fill="url(#zoomTickFadeRight)"
                />
              </G>
            </Svg>
          </View>
        </GestureDetector>
      </Animated.View>

      {/* Pills — tap for instant zoom, drag to reveal wheel */}
      <Animated.View style={[s.zoomPillsRow, pillsAnim]} pointerEvents="box-none">
        {(ZOOM_PILL_FACTORS as readonly number[]).map((factor, i) => (
          <ZoomPill
            key={factor}
            factor={factor}
            isActive={Math.abs(currentFactor - factor) < 0.2}
            gesture={pillGestures[i]!}
            pressed={pillPressedSVs[i]!}
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Shutter button ───────────────────────────────────────────────────────────

function ShutterButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <AnimatedPressable
      style={s.shutterOuter}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Take photo"
      accessibilityState={{ disabled: !!disabled }}
    >
      <View style={s.shutterInner} />
    </AnimatedPressable>
  );
}

// ─── BeReal-style preview ─────────────────────────────────────────────────────

function BeRealPreview({
  selfieUri,
  progressUri,
  onSubmit,
  onRetake,
  isSubmitting,
  submitError,
}: {
  selfieUri: string;
  progressUri: string;
  onSubmit: () => void;
  onRetake: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const actionsStyle = useFadeUpEnter(staggerDelay(1));

  return (
    <View style={s.previewRoot}>
      <Image
        source={{ uri: progressUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessibilityLabel="Cleanup progress photo"
      />

      <View style={[s.pip, { top: insets.top + PIP_TOP, left: PIP_RIGHT }]} pointerEvents="none">
        <Image
          source={{ uri: selfieUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Selfie"
        />
      </View>

      <SafeAreaView style={s.previewActions} edges={['bottom']}>
        <Animated.View style={[{ gap: 8 }, actionsStyle]}>
          {submitError ? (
            <Text style={s.errorText} accessibilityRole="alert">
              {submitError}
            </Text>
          ) : null}
          <AnimatedPressable
            style={s.retakeBtn}
            onPress={onRetake}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Retake photos"
          >
            <Text style={s.retakeBtnText}>Retake Photos</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[s.submitBtn, isSubmitting && s.disabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Submit photos"
          >
            <Text style={s.submitBtnText}>
              {isSubmitting ? 'Saving…' : 'Submit'}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Sequential capture (front → back) using expo-camera ─────────────────────

function SequentialCapture({
  onDone,
  onCancel,
  endSessionMode = false,
}: {
  onDone: (progressUri: string, selfieUri: string) => void;
  onCancel: () => void;
  endSessionMode?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(() => factorToZoom(0.5));
  const [lensPayload, setLensPayload] = useState<AvailableLensesPayload | null>(null);
  const cameraRef = useRef<CameraView>(null);
  /** Masks the framing jump when the requested zoom crosses a physical lens hand-off
   * (e.g. ultra-wide -> wide at 1x) with a brief dark flash instead of a hard cut. */
  const lensCrossingFlash = useSharedValue(0);
  const prevAbsoluteZoomRef = useRef<number | undefined>(undefined);
  const [isNight, setIsNight] = useState(false);
  const [nightWarningVisible, setNightWarningVisible] = useState(false);
  const nightWarningShownRef = useRef(false);

  // Best-effort GPS+date nighttime check; fails open (stays false) if location is unavailable.
  useEffect(() => {
    let cancelled = false;
    void resolveCheckpointCaptureCoords().then(({ latitude, longitude }) => {
      if (cancelled || latitude == null || longitude == null) return;
      setIsNight(isNighttime(new Date(), latitude, longitude));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // `onCameraReady` fires once per mount; flipping `facing` does not re-fire it on iOS (AC-36).
  useEffect(() => {
    setCaptureError(null);
    setZoom(factorToZoom(0.5));
    setLensPayload(null);
    if (step === 'front') {
      setFlashMode('off');
    }
  }, [step]);

  useEffect(() => {
    if (isNight && flashMode === 'off' && !nightWarningShownRef.current) {
      setNightWarningVisible(true);
    }
  }, [isNight, step, flashMode]);

  // Flashes `lensCrossingFlash` whenever the requested zoom crosses a physical lens
  // hand-off, masking the framing jump (see resolveZoomPlan) with a brief dark beat
  // instead of a hard cut.
  useEffect(() => {
    const factor = zoomToFactor(zoom);
    const plan = resolveZoomPlan(factor, lensPayload, step);
    const switchOverFactors = lensPayload?.zoom?.switchOverFactors;
    const nextAbsolute = plan.zoomFactor;
    const prevAbsolute = prevAbsoluteZoomRef.current;

    if (
      switchOverFactors &&
      nextAbsolute != null &&
      prevAbsolute != null &&
      crossesLensBoundary(prevAbsolute, nextAbsolute, switchOverFactors)
    ) {
      lensCrossingFlash.value = withSequence(
        withTiming(0.92, { duration: 120 }),
        withTiming(0.92, { duration: 260 }),
        withTiming(0, { duration: 220 }),
      );
    }
    prevAbsoluteZoomRef.current = nextAbsolute ?? prevAbsolute;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared value + ref are stable
  }, [zoom, lensPayload, step]);

  const lensCrossingFlashStyle = useAnimatedStyle(() => ({
    opacity: lensCrossingFlash.value,
  }));

  if (!permission) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.copyTitle}>Camera permission needed</Text>
        <Text style={[s.copySubtitle, { marginTop: 8, color: C.textTertiary }]}>
          Allow camera access to submit checkpoint photos.
        </Text>
        <AnimatedPressable
          style={[s.submitBtn, { marginTop: 24, width: 220 }]}
          onPress={() => { void requestPermission(); }}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
        >
          <Text style={s.submitBtnText}>Allow Camera</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[s.backBtn, { marginTop: 12 }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={s.backBtnText}>Cancel</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const capture = async () => {
    if (capturing || !cameraReady || !cameraRef.current) return;
    setCapturing(true);
    setCaptureError(null);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) throw new Error('Capture returned no URI');

      if (step === 'front') {
        setSelfieUri(photo.uri);
        setStep('back');
      } else if (selfieUri) {
        onDone(photo.uri, selfieUri);
      }
    } catch (error) {
      console.warn('[SequentialCapture] capture failed:', error);
      const message = 'Could not capture photo. Please try again.';
      setCaptureError(message);
      Alert.alert('Capture failed', message);
    } finally {
      setCapturing(false);
    }
  };

  const zoomFactor = zoomToFactor(zoom);
  const zoomPlan = resolveZoomPlan(zoomFactor, lensPayload, step);
  // `zoomFactor` comes from patches/expo-camera+17.0.10.patch. Typed loosely so the
  // app still builds against a stock install, where the prop is simply ignored.
  const nativeZoomProps = {
    zoom: zoomPlan.nativeZoom,
    zoomFactor: zoomPlan.zoomFactor,
  } as { zoom: number };

  return (
    <View style={[s.root, s.rootCapture]}>
      <CameraView
        ref={cameraRef as unknown as React.Ref<CameraView>}
        style={StyleSheet.absoluteFill}
        facing={step}
        flash={flashMode}
        {...nativeZoomProps}
        selectedLens={zoomPlan.selectedLens}
        mirror={step === 'front'}
        onCameraReady={() => setCameraReady(true)}
        onAvailableLensesChanged={(event) => setLensPayload(event)}
      />

      <Animated.View
        style={[StyleSheet.absoluteFill, s.lensCrossingFlash, lensCrossingFlashStyle]}
        pointerEvents="none"
      />

      {step === 'back' && selfieUri ? (
        <View style={[s.pip, { top: insets.top + PIP_TOP, left: PIP_RIGHT }]} pointerEvents="none">
          <Image
            source={{ uri: selfieUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel="Selfie preview"
          />
        </View>
      ) : null}

      {!cameraReady && (
        <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
          <ActivityIndicator color={C.primary} />
        </View>
      )}

      {/* Use insets directly — SafeAreaView edges can drop top padding when
          SequentialCapture remounts after Retake (preview → capture). */}
      <View
        style={[s.overlay, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        <View style={s.topBar}>
          {step === 'front' ? (
            <AnimatedPressable
              style={s.backBtn}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={s.backBtnText}>Cancel</Text>
            </AnimatedPressable>
          ) : (
            <View style={s.topBarSpacer} />
          )}
          {step === 'back' ? (
            <FlashToggle
              mode={flashMode}
              onPress={() => setFlashMode((prev) => nextFlashMode(prev))}
            />
          ) : null}
        </View>

        <View style={[s.copyArea, step === 'back' && s.copyAreaBelowPip]} pointerEvents="box-none">
          <CoachmarkEnter>
            <View style={s.copyBlock}>
              {step === 'front' ? (
                <>
                  <Text style={s.copyTitle}>
                    {endSessionMode ? 'Final selfie' : 'Take your selfie'}
                  </Text>
                  <Text style={s.copySubtitle}>
                    {endSessionMode
                      ? 'One last photo before you finish your session.'
                      : 'Face the camera and tap. Wear your high-vis vest or your session may be declined.'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.copyTitle}>
                    {endSessionMode ? 'Final progress photo' : 'Capture your progress'}
                  </Text>
                  <Text style={s.copySubtitle}>
                    {endSessionMode
                      ? 'Show your cleanup area, then submit to end the session.'
                      : 'Point at the cleanup area and tap the button.'}
                  </Text>
                </>
              )}
              {captureError ? <Text style={s.captureError}>{captureError}</Text> : null}
            </View>
          </CoachmarkEnter>
        </View>
      </View>

      <View style={s.bottomCluster}>
        {step === 'back' ? (
          <ZoomControl value={zoom} onChange={setZoom} />
        ) : null}
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <ShutterButton
            onPress={() => { void capture(); }}
            disabled={capturing || !cameraReady}
          />
        </View>
      </View>

      {nightWarningVisible ? (
        <View style={StyleSheet.absoluteFill}>
          <FlashWarningModal
            onEnableFlash={() => {
              setFlashMode('on');
              nightWarningShownRef.current = true;
              setNightWarningVisible(false);
            }}
            onDismiss={() => {
              nightWarningShownRef.current = true;
              setNightWarningVisible(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export function PhotoCaptureScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { isActive, submittedCheckpoints } = useLiveSession();
  const isSessionStart = mode === 'session-start';
  const isSessionEnd = mode === 'session-end';
  /** Capture active state on mount — after End Session finalize, isActive becomes
   * false; do NOT treat that as a stale screen and bounce to Home (that raced
   * replace to session detail / submission-confirmation). */
  const wasActiveOnMountRef = useRef(isActive);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [progressUri, setProgressUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Bumps on Retake so SequentialCapture resets front→back without relying on unmount timing. */
  const [captureEpoch, setCaptureEpoch] = useState(0);
  /** Keeps both layers mounted while preview cross-fades into the camera. */
  const [isRetakeTransitioning, setIsRetakeTransitioning] = useState(false);
  const reducedMotion = useReducedMotion();
  const previewOpacity = useSharedValue(1);
  const previewScale = useSharedValue(1);
  const captureOpacity = useSharedValue(1);
  const isCancelingSessionStart = useRef(false);

  useEffect(() => {
    if (isSessionEnd && !wasActiveOnMountRef.current) {
      router.replace('/' as Href);
    }
  }, [isSessionEnd, router]);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  const finishRetakeTransition = useCallback(() => {
    setSelfieUri(null);
    setProgressUri(null);
    setSubmitError(null);
    setIsRetakeTransitioning(false);
    previewOpacity.value = 1;
    previewScale.value = 1;
    captureOpacity.value = 1;
  }, [captureOpacity, previewOpacity, previewScale]);

  const previewLayerStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ scale: previewScale.value }],
  }));

  const captureLayerStyle = useAnimatedStyle(() => ({
    opacity: captureOpacity.value,
  }));

  if (!fontsLoaded) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[s.root, s.center]} edges={['top', 'bottom']}>
        <Text style={s.copyTitle}>Camera not available on web</Text>
        <AnimatedPressable
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={s.backBtnText}>Go Back</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  const normalizeUri = (uri: string) =>
    Platform.OS === 'android' && !uri.startsWith('file://')
      ? `file://${uri}`
      : uri;

  const handleDone = (progress: string, selfie: string) => {
    setProgressUri(normalizeUri(progress));
    setSelfieUri(normalizeUri(selfie));
  };

  const handleSubmit = async () => {
    if (isSubmitting || !selfieUri || !progressUri) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const capturedAt = Date.now();
      // Persist photos + resolve GPS in parallel so session-start pins get real lat/lng
      // even before the live tracker has received its first watch sample.
      const [persisted, captureCoords] = await Promise.all([
        persistCheckpointPhotos({
          selfieUri,
          progressUri,
          capturedAt,
        }),
        resolveCheckpointCaptureCoords(),
      ]);
      const withCoords = {
        ...persisted,
        latitude: captureCoords.latitude,
        longitude: captureCoords.longitude,
      };

      if (isSessionStart) {
        try {
          const started = await startPendingLiveSession();
          if (!started) {
            setSubmitError('Session details missing. Go back and fill out setup first.');
            return;
          }
          addPhotoCheckpoint(withCoords);
          resetCheckpointCountdown();
          // Flatten the deep onboarding stack (session-setup-guide -> step2..7 ->
          // ... -> photo-capture) down to just Home before entering the tracker,
          // so live-session always sits one level above Home — a plain `replace`
          // here left that whole stack underneath, and dismissing (chevron) had
          // to unwind it all at once, which doesn't animate like a normal
          // single-level pop the way every later collapse (via the minimized
          // pill, a single push) does.
          router.dismissTo('/');
          router.push('/live-session?from=onboarding' as Href);
        } catch {
          setSubmitError('Could not start session. Please try again.');
        }
        return;
      }

      if (isSessionEnd) {
        if (!isActive) {
          setSubmitError('No active session. Return to the tracker and try again.');
          return;
        }
        const added = addPhotoCheckpoint(withCoords, { allowDuplicateWindow: true });
        if (!added) {
          setSubmitError('Could not save end photos. Please try again.');
          return;
        }
        setSavingSession(true);
        setSavePending(true);
        try {
          await finalizeAndLeaveSession(router);
          setSavePending(false);
        } catch {
          setSavePending(false);
          setSavingSession(false);
          setSubmitError('Could not save session. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      const added = addPhotoCheckpoint(withCoords);
      if (!added) {
        setSubmitError('Checkpoint already submitted for this window.');
        return;
      }
      resetCheckpointCountdown();
      router.dismissTo('/photo-submitted');
    } catch {
      setSubmitError('Could not save photos. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    if (isRetakeTransitioning) {
      return;
    }

    if (reducedMotion) {
      setSelfieUri(null);
      setProgressUri(null);
      setSubmitError(null);
      setCaptureEpoch((n) => n + 1);
      return;
    }

    // Mount camera under the preview first (opacity 0), give it a short head
    // start, then cross-fade so the remount never flashes as a hard cut.
    setIsRetakeTransitioning(true);
    setCaptureEpoch((n) => n + 1);
    previewOpacity.value = 1;
    previewScale.value = 1;
    captureOpacity.value = 0;

    const fadeOut = {
      duration: durations.modalEnter,
      easing: easing.easeInOut,
    };
    const fadeIn = {
      duration: durations.modalEnter,
      easing: easing.easeOut,
    };

    previewOpacity.value = withTiming(0, fadeOut);
    previewScale.value = withTiming(0.98, fadeOut);
    captureOpacity.value = withDelay(
      durations.screenEnter,
      withTiming(1, fadeIn, (finished) => {
        if (finished) {
          runOnJS(finishRetakeTransition)();
        }
      }),
    );
  };

  const handleCancelCapture = () => {
    if (isSessionStart) {
      if (isCancelingSessionStart.current) {
        return;
      }
      isCancelingSessionStart.current = true;
      // Drop any captured start photos; keep pending form so Session Setup
      // can rehydrate if the form remounts. Form local state usually survives
      // because Start Session pushed (not replaced) this screen.
      clearPendingSessionStartPhotos();
      router.dismissTo('/session-setup' as Href);
      return;
    }
    if (isSessionEnd) {
      router.dismissTo('/live-session');
      return;
    }
    router.dismissTo('/live-session');
  };

  const showingPreview = Boolean(selfieUri && progressUri);
  const showCaptureLayer = !showingPreview || isRetakeTransitioning;
  const showPreviewLayer = showingPreview;

  return (
    <View style={s.rootCaptureHost}>
      {showCaptureLayer ? (
        <Animated.View
          style={[
            showPreviewLayer ? StyleSheet.absoluteFill : s.layerFill,
            captureLayerStyle,
          ]}
          pointerEvents={showPreviewLayer ? 'none' : 'auto'}
        >
          <SequentialCapture
            key={captureEpoch}
            onDone={handleDone}
            onCancel={handleCancelCapture}
            endSessionMode={isSessionEnd}
          />
        </Animated.View>
      ) : null}
      {showPreviewLayer ? (
        <Animated.View
          style={[
            showCaptureLayer ? StyleSheet.absoluteFill : s.layerFill,
            previewLayerStyle,
          ]}
          pointerEvents={isRetakeTransitioning ? 'none' : 'auto'}
        >
          <BeRealPreview
            selfieUri={selfieUri!}
            progressUri={progressUri!}
            onSubmit={() => { void handleSubmit(); }}
            onRetake={handleRetake}
            isSubmitting={isSubmitting || isRetakeTransitioning}
            submitError={submitError}
          />
        </Animated.View>
      ) : null}
      {isSessionEnd || savingSession ? (
        <BrandLoadingView
          visible={savingSession}
          warm={isSessionEnd}
          loopWhileBusy={savePending}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgApp },
  /** Black host so retake cross-fade never flashes the cream app bg under the camera. */
  rootCaptureHost: { flex: 1, backgroundColor: C.footer },
  layerFill: { flex: 1 },
  rootCapture: {
    backgroundColor: C.footer,
    overflow: 'hidden',
    // Omit width/height:'100%' — percentage heights are recalculated on every
    // React re-render (zoom state updates), which makes the absolutely-positioned
    // bottomCluster jump and leaves a white gap at the bottom.
    // flex:1 from s.root already fills the parent stably.
  },
  center: { alignItems: 'center', justifyContent: 'center' },

  lensCrossingFlash: { backgroundColor: '#000' },

  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-start',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    minHeight: 44,
  },

  topBarSpacer: {
    width: 1,
    height: 1,
  },

  flashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.overlay,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  flashBtnText: {
    ...textStyles.bodySmall,
    fontFamily: 'NotoSans_600SemiBold',
    color: C.textOnPrimary,
  },

  copyArea: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Pushes the copy block below the PiP on the back-camera step.
  // PiP bottom = PIP_TOP + PIP_SIZE = 184; topBar ≈ 56px → gap = 184 - 56 + 12.
  copyAreaBelowPip: {
    marginTop: PIP_TOP + PIP_SIZE - 56 + 12,
  },

  backBtn: {
    backgroundColor: C.overlay,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  backBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.textOnPrimary,
  },

  copyBlock: {
    maxWidth: 320,
    gap: 8,
    backgroundColor: C.overlay,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  copyTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 20,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  copySubtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  captureError: {
    ...textStyles.bodySmall,
    color: '#FFB4AB',
    textAlign: 'center',
    marginTop: 4,
  },

  bottomCluster: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    marginBottom: 0,
  },

  zoomControlRoot: {
    width: '100%',
    height: ZOOM_WHEEL_HEIGHT,
    overflow: 'hidden',
  },

  zoomOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
    zIndex: 3,
  },

  zoomCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.zoomAccent,
  },

  zoomValue: {
    ...textStyles.bodySemiBold,
    color: C.zoomAccent,
    letterSpacing: 0.2,
  },

  zoomDialHit: {
    width: '100%',
    height: ZOOM_WHEEL_HEIGHT,
    overflow: 'hidden',
  },

  zoomDialSpin: {
    alignItems: 'center',
  },

  zoomPillsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  zoomPillRing: {
    padding: ZOOM_PILL.border,
    borderRadius: ZOOM_PILL_RADIUS,
    minWidth: ZOOM_PILL.minWidth,
    height: ZOOM_PILL.height,
  },

  zoomPillFace: {
    alignSelf: 'stretch',
    minHeight: ZOOM_PILL.height - ZOOM_PILL.border * 2,
    borderRadius: ZOOM_PILL_INNER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ZOOM_PILL.paddingH,
  },

  zoomPillLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },

  zoomPillSuffix: {
    fontFamily: 'NotoSans_400Regular',
    fontWeight: '400',
  },

  zoomPillLabelActive: {
    color: C.textOnPrimary,
  },

  footer: {
    backgroundColor: C.footerDim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    minHeight: 118,
    width: '100%',
  },

  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },

  disabled: { opacity: 0.5 },

  pip: {
    position: 'absolute',
    width: PIP_SIZE,
    height: PIP_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 10,
  },

  previewRoot: { flex: 1, backgroundColor: '#000' },

  previewActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  retakeBtn: {
    width: '100%',
    height: 59,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.textOnPrimary,
    backgroundColor: C.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retakeBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  submitBtn: {
    width: '100%',
    height: 59,
    borderRadius: radius.md,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitBtnText: {
    ...textStyles.labelButton,
    color: C.textOnPrimary,
  },

  errorText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.statusDeclinedText,
    textAlign: 'center',
    marginBottom: 8,
  },
});
