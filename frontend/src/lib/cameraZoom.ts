/**
 * Photo-capture zoom mapping.
 *
 * The dial is labelled 0.5×–5×, where **1× is the wide lens** and 0.5× is twice
 * as wide. Two things make that hard to express through expo-camera:
 *
 * 1. The stock `zoom` prop is 0–1 = a fraction of `activeFormat.videoMaxZoomFactor`,
 *    applied exponentially. That max is per-device-per-format and unreadable from
 *    JS, so a 0–1 value cannot be mapped onto a real optical factor.
 * 2. Only the back camera of an iPhone 11 or newer has an ultra-wide lens. No
 *    iPhone exposes a front ultra-wide today, so selfie 0.5× is the active front
 *    sensor at `min` zoom. If a device does list a front ultra-wide, selfie
 *    selects it explicitly via `findWidestFrontLens`.
 *
 * `patches/expo-camera+17.0.10.patch` adds an absolute `zoomFactor` prop and makes
 * `onAvailableLensesChanged` report the active device's zoom range, so 1× can be
 * anchored exactly. When those capabilities are present we drive `zoomFactor`;
 * otherwise we fall back to the 0–1 `zoom` curve, which stays continuous and
 * monotonic but is only approximate (Expo Go, Android, unpatched installs).
 *
 * Framing model: on a back camera with an ultra-wide, 0.5× is the optical
 * hand-off point and 1× is a real 2× crop into the wide lens — free, since the
 * ultra-wide is a second sensor. Where no wider lens exists at all (every front
 * camera, and single-lens backs) there is nothing to crop from, so 1× is the
 * widest the sensor can frame — no digital crop — and 0.5× is identical to it,
 * since the sensor cannot show more than its own full frame.
 */

export const ZOOM_MIN_FACTOR = 0.5;
export const ZOOM_MAX_FACTOR = 5;

/**
 * Fallback base for inverting expo-camera's exponential 0–1 curve when the device
 * has not reported its real `videoMaxZoomFactor`. Only used off the patched path.
 */
export const CAMERA_ZOOM_CURVE_MAX = 16;

/**
 * Crop applied to reach 1× when an optical ultra-wide (or bare ultra-wide device)
 * is available. Without a wider lens, `wideAnchorFactor` / `factorToNativeZoom`
 * use anchor `1` instead so 0.5×–1× stay at the sensor's full frame.
 */
export const SOFT_WIDE_ANCHOR = 2;

const DEVICE_TYPE = {
  ultraWide: 'AVCaptureDeviceTypeBuiltInUltraWideCamera',
  wide: 'AVCaptureDeviceTypeBuiltInWideAngleCamera',
  triple: 'AVCaptureDeviceTypeBuiltInTripleCamera',
  dualWide: 'AVCaptureDeviceTypeBuiltInDualWideCamera',
} as const;

/** Virtual devices that span an ultra-wide, widest coverage first. */
const SPANNING_VIRTUAL_DEVICES = [DEVICE_TYPE.triple, DEVICE_TYPE.dualWide] as const;

/**
 * Front-camera preference: widest FOV first. TrueDepth is same FOV as wide on
 * current iPhones but is listed after wide so we prefer the plain wide sensor
 * when both appear. Ultra-wide wins if a device ever exposes one on front.
 */
const FRONT_WIDEST_DEVICE_TYPES = [
  DEVICE_TYPE.ultraWide,
  DEVICE_TYPE.wide,
  'AVCaptureDeviceTypeBuiltInTrueDepthCamera',
] as const;

export type LensInfo = {
  deviceType: string;
  localizedName: string;
};

export type CameraZoomCapabilities = {
  deviceType: string;
  min: number;
  max: number;
  switchOverFactors: number[];
  constituentDeviceTypes: string[];
};

/** Payload of `onAvailableLensesChanged`; the optional fields need the native patch. */
export type AvailableLensesPayload = {
  lenses?: string[];
  lensInfo?: LensInfo[];
  zoom?: CameraZoomCapabilities;
};

export type ZoomPlan = {
  /** `selectedLens` prop value, or `undefined` to keep the platform default. */
  selectedLens: string | undefined;
  /** Absolute `videoZoomFactor`; `undefined` when the native patch is unavailable. */
  zoomFactor: number | undefined;
  /** 0–1 `zoom` prop value, always set so unpatched builds still respond. */
  nativeZoom: number;
  /** True when 0.5× is a real ultra-wide rather than a digital framing. */
  hasOpticalUltraWide: boolean;
};

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}

export function clampFactor(factor: number): number {
  return clamp(factor, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR);
}

export function dialToFactor(dial: number): number {
  return ZOOM_MIN_FACTOR + dial * (ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR);
}

export function factorToDial(factor: number): number {
  return (factor - ZOOM_MIN_FACTOR) / (ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR);
}

/**
 * Invert `videoZoomFactor = pow(curveMax, zoom)`, which is what expo-camera applies
 * for the 0–1 `zoom` prop.
 */
export function absoluteToNativeZoom(absolute: number, curveMax: number): number {
  if (absolute <= 1 || curveMax <= 1) return 0;
  return clamp(Math.log(absolute) / Math.log(curveMax), 0, 1);
}

/**
 * Fallback 0–1 `zoom` value. `anchor` is the crop applied to reach 1× — pass
 * `SOFT_WIDE_ANCHOR` when an optical ultra-wide is available so 0.5×→1× is a real
 * 2× crop, or `1` when there is no wider lens to crop from, which leaves the whole
 * 0.5×–1× range flat at the sensor's widest instead of digitally cropping it.
 */
export function factorToNativeZoom(
  factor: number,
  curveMax = CAMERA_ZOOM_CURVE_MAX,
  anchor = SOFT_WIDE_ANCHOR,
): number {
  return absoluteToNativeZoom(clampFactor(factor) * anchor, curveMax);
}

function isVirtualCompositeLens(name: string): boolean {
  return /dual|triple|lidar|true\s*depth|continuity/i.test(name);
}

/**
 * Ultra-wide lookup by localized name, for unpatched builds that only report
 * `lenses`. Locale-dependent by nature — the patched path uses `deviceType`.
 */
export function findUltraWideLens(lenses: readonly string[]): string | undefined {
  return lenses.find((name) => /ultra/i.test(name) && !isVirtualCompositeLens(name));
}

/** Widest multi-lens virtual device, which spans ultra-wide through telephoto. */
function findSpanningLens(lensInfo: readonly LensInfo[]): LensInfo | undefined {
  for (const deviceType of SPANNING_VIRTUAL_DEVICES) {
    const match = lensInfo.find((lens) => lens.deviceType === deviceType);
    if (match) return match;
  }
  return undefined;
}

/**
 * Widest front lens available on this device. Prefer stable `deviceType` when the
 * patch reports `lensInfo`; fall back to localized-name matching that requires a
 * front-facing label so back ultra-wide names are never selected for selfie.
 */
export function findWidestFrontLens(
  payload: AvailableLensesPayload | null | undefined,
): string | undefined {
  const lensInfo = payload?.lensInfo ?? [];
  for (const deviceType of FRONT_WIDEST_DEVICE_TYPES) {
    const match = lensInfo.find((lens) => lens.deviceType === deviceType);
    if (match) return match.deviceType;
  }

  const lenses = payload?.lenses ?? [];
  const frontUltraWide = lenses.find(
    (name) => /front/i.test(name) && /ultra/i.test(name) && !isVirtualCompositeLens(name),
  );
  if (frontUltraWide) return frontUltraWide;

  // Prefer a non-composite front wide-style name over TrueDepth when only
  // localized names are available (unpatched / Android).
  return lenses.find(
    (name) => /front/i.test(name) && !/true\s*depth|tele|ultra/i.test(name),
  );
}

/**
 * Reject a partial payload rather than letting a missing bound turn into `NaN`
 * zoom. Anything malformed falls back to the 0–1 curve.
 */
function isUsableCapabilities(
  capabilities: CameraZoomCapabilities | undefined,
): capabilities is CameraZoomCapabilities {
  return (
    capabilities != null &&
    Number.isFinite(capabilities.min) &&
    Number.isFinite(capabilities.max) &&
    capabilities.min > 0 &&
    capabilities.max >= capabilities.min &&
    Array.isArray(capabilities.switchOverFactors) &&
    Array.isArray(capabilities.constituentDeviceTypes)
  );
}

export function spansUltraWide(capabilities: CameraZoomCapabilities): boolean {
  return (
    capabilities.deviceType === DEVICE_TYPE.ultraWide ||
    capabilities.constituentDeviceTypes.includes(DEVICE_TYPE.ultraWide)
  );
}

/**
 * True when moving from `prevAbsolute` to `nextAbsolute` crosses one of the device's
 * optical hand-off points — the physical lens switches underneath, which on a back
 * camera with an ultra-wide (physically offset from the wide/tele pair) can produce a
 * visible framing jump the UI may want to mask with a transition effect.
 */
export function crossesLensBoundary(
  prevAbsolute: number,
  nextAbsolute: number,
  switchOverFactors: readonly number[],
): boolean {
  return switchOverFactors.some(
    (boundary) =>
      (prevAbsolute < boundary && nextAbsolute >= boundary) ||
      (prevAbsolute >= boundary && nextAbsolute < boundary),
  );
}

/**
 * `videoZoomFactor` that the UI calls 1×.
 *
 * On a virtual device, `min` is the widest constituent lens and each entry in
 * `switchOverFactors` is the factor at which the next constituent takes over, so a
 * wide lens sitting behind an ultra-wide starts at `switchOverFactors[wideIndex - 1]`
 * — an optical, free crop into the wide lens.
 *
 * A bare ultra-wide device (its own `deviceType` is the ultra-wide, with no wide
 * lens behind it) is still cropped 2× at 1×, since the raw ultra-wide field of view
 * is too distorted to present as a "normal" 1× view.
 *
 * Every other shape — a wide+telephoto pair, or a bare wide lens (every front
 * camera, and single-lens backs) — has no wider lens to crop from at all, so 1×
 * is simply `min`: the widest the sensor can frame, with no digital crop.
 */
export function wideAnchorFactor(capabilities: CameraZoomCapabilities): number {
  const { constituentDeviceTypes, switchOverFactors, min, deviceType } = capabilities;
  const wideIndex = constituentDeviceTypes.indexOf(DEVICE_TYPE.wide);
  const ultraWideIndex = constituentDeviceTypes.indexOf(DEVICE_TYPE.ultraWide);

  if (ultraWideIndex >= 0 && wideIndex > ultraWideIndex) {
    return switchOverFactors[wideIndex - 1] ?? min * SOFT_WIDE_ANCHOR;
  }
  if (deviceType === DEVICE_TYPE.ultraWide) {
    return min * SOFT_WIDE_ANCHOR;
  }
  return min;
}

function buildPlanFromCapabilities(
  factor: number,
  capabilities: CameraZoomCapabilities,
  selectedLens: string | undefined,
): ZoomPlan {
  const absolute = clamp(
    wideAnchorFactor(capabilities) * factor,
    capabilities.min,
    capabilities.max,
  );

  return {
    selectedLens,
    zoomFactor: absolute,
    // Best-effort mirror of the same target, so the stock `zoom` prop lands in
    // roughly the right place if the native patch ever goes missing.
    nativeZoom: absoluteToNativeZoom(absolute, capabilities.max),
    hasOpticalUltraWide: spansUltraWide(capabilities),
  };
}

/**
 * Resolve every camera prop that depends on the dial position.
 *
 * The lens is chosen from the reported hardware alone, never from the factor, so
 * scrubbing across 1× no longer swaps the capture input mid-gesture. On a back
 * camera with an ultra-wide the whole range is handed to the virtual lens and iOS
 * performs the optical hand-off itself, the way the system camera does.
 */
export function resolveZoomPlan(
  factor: number,
  payload: AvailableLensesPayload | null | undefined,
  facing: 'front' | 'back',
): ZoomPlan {
  const clamped = clampFactor(factor);
  const capabilities = isUsableCapabilities(payload?.zoom) ? payload.zoom : undefined;
  const selectedLens =
    facing === 'back'
      ? findSpanningLens(payload?.lensInfo ?? [])?.deviceType
      : findWidestFrontLens(payload);

  // Capabilities describe whichever device is live right now. Between asking for a
  // lens and the session queue applying it they describe the outgoing one, so only
  // trust them for an absolute factor once they match what we asked for.
  if (capabilities && (!selectedLens || capabilities.deviceType === selectedLens)) {
    return buildPlanFromCapabilities(clamped, capabilities, selectedLens);
  }

  const hasOpticalUltraWide = capabilities
    ? spansUltraWide(capabilities)
    : facing === 'back'
      ? Boolean(findUltraWideLens(payload?.lenses ?? []))
      : selectedLens === DEVICE_TYPE.ultraWide ||
        Boolean(
          (payload?.lenses ?? []).find(
            (name) => /front/i.test(name) && /ultra/i.test(name) && !isVirtualCompositeLens(name),
          ),
        );

  return {
    selectedLens,
    zoomFactor: undefined,
    nativeZoom: factorToNativeZoom(
      clamped,
      capabilities?.max ?? CAMERA_ZOOM_CURVE_MAX,
      hasOpticalUltraWide ? SOFT_WIDE_ANCHOR : 1,
    ),
    hasOpticalUltraWide,
  };
}
