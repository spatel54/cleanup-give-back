import {
  CAMERA_ZOOM_CURVE_MAX,
  SOFT_WIDE_ANCHOR,
  absoluteToNativeZoom,
  crossesLensBoundary,
  dialToFactor,
  factorToDial,
  factorToNativeZoom,
  findUltraWideLens,
  findWidestFrontLens,
  resolveZoomPlan,
  wideAnchorFactor,
  type AvailableLensesPayload,
  type CameraZoomCapabilities,
} from './cameraZoom';

const TRIPLE = 'AVCaptureDeviceTypeBuiltInTripleCamera';
const DUAL_WIDE = 'AVCaptureDeviceTypeBuiltInDualWideCamera';
const DUAL = 'AVCaptureDeviceTypeBuiltInDualCamera';
const ULTRA_WIDE = 'AVCaptureDeviceTypeBuiltInUltraWideCamera';
const WIDE = 'AVCaptureDeviceTypeBuiltInWideAngleCamera';
const TELEPHOTO = 'AVCaptureDeviceTypeBuiltInTelephotoCamera';

function capabilities(overrides: Partial<CameraZoomCapabilities>): CameraZoomCapabilities {
  return {
    deviceType: WIDE,
    min: 1,
    max: 120,
    switchOverFactors: [],
    constituentDeviceTypes: [],
    ...overrides,
  };
}

/** iPhone Pro: ultra-wide, wide, telephoto behind one virtual device. */
const TRIPLE_CAPS = capabilities({
  deviceType: TRIPLE,
  switchOverFactors: [2, 6],
  constituentDeviceTypes: [ULTRA_WIDE, WIDE, TELEPHOTO],
});

/** iPhone 11–16 standard: ultra-wide + wide. */
const DUAL_WIDE_CAPS = capabilities({
  deviceType: DUAL_WIDE,
  switchOverFactors: [2],
  constituentDeviceTypes: [ULTRA_WIDE, WIDE],
});

/** iPhone X-era: wide + telephoto, no ultra-wide. */
const DUAL_CAPS = capabilities({
  deviceType: DUAL,
  switchOverFactors: [2],
  constituentDeviceTypes: [WIDE, TELEPHOTO],
});

/** Front camera on every iPhone, and the back of an SE. */
const SINGLE_WIDE_CAPS = capabilities({ deviceType: WIDE });

const BACK_LENS_INFO = [
  { deviceType: WIDE, localizedName: 'Back Camera' },
  { deviceType: DUAL_WIDE, localizedName: 'Back Dual Wide Camera' },
  { deviceType: TELEPHOTO, localizedName: 'Back Telephoto Camera' },
  { deviceType: TRIPLE, localizedName: 'Back Triple Camera' },
  { deviceType: ULTRA_WIDE, localizedName: 'Back Ultra Wide Camera' },
];

const FRONT_LENS_INFO = [
  { deviceType: WIDE, localizedName: 'Front Camera' },
  { deviceType: 'AVCaptureDeviceTypeBuiltInTrueDepthCamera', localizedName: 'Front TrueDepth Camera' },
];

describe('dial mapping', () => {
  it('maps the dial linearly across 0.5×–5×', () => {
    expect(dialToFactor(0)).toBeCloseTo(0.5);
    expect(dialToFactor(factorToDial(1))).toBeCloseTo(1);
    expect(dialToFactor(1)).toBeCloseTo(5);
  });
});

describe('wideAnchorFactor', () => {
  it('uses the optical hand-off point when an ultra-wide sits in front of the wide', () => {
    expect(wideAnchorFactor(TRIPLE_CAPS)).toBe(2);
    expect(wideAnchorFactor(DUAL_WIDE_CAPS)).toBe(2);
  });

  it('anchors 1× at the widest lens with no crop when there is no wider lens at all', () => {
    expect(wideAnchorFactor(DUAL_CAPS)).toBe(DUAL_CAPS.min);
    expect(wideAnchorFactor(SINGLE_WIDE_CAPS)).toBe(SINGLE_WIDE_CAPS.min);
  });

  it('treats a bare ultra-wide as half of 1×', () => {
    expect(wideAnchorFactor(capabilities({ deviceType: ULTRA_WIDE }))).toBe(SOFT_WIDE_ANCHOR);
  });
});

describe('resolveZoomPlan on a patched build', () => {
  const backPayload: AvailableLensesPayload = {
    lensInfo: BACK_LENS_INFO,
    zoom: TRIPLE_CAPS,
  };

  it('pins the back camera to the virtual lens for the whole range', () => {
    for (const factor of [0.5, 0.75, 1, 2, 5]) {
      expect(resolveZoomPlan(factor, backPayload, 'back').selectedLens).toBe(TRIPLE);
    }
  });

  it('maps labels onto real optical factors', () => {
    expect(resolveZoomPlan(0.5, backPayload, 'back').zoomFactor).toBeCloseTo(1);
    expect(resolveZoomPlan(1, backPayload, 'back').zoomFactor).toBeCloseTo(2);
    expect(resolveZoomPlan(3, backPayload, 'back').zoomFactor).toBeCloseTo(6);
    expect(resolveZoomPlan(5, backPayload, 'back').zoomFactor).toBeCloseTo(10);
  });

  it('moves continuously between 0.5× and 1× instead of staying put', () => {
    const steps = [0.5, 0.6, 0.7, 0.8, 0.9, 1].map(
      (factor) => resolveZoomPlan(factor, backPayload, 'back').zoomFactor ?? 0,
    );
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]!).toBeGreaterThan(steps[i - 1]!);
    }
  });

  it('keeps 0.5× and 1× both at the full sensor frame on a camera with no wider lens', () => {
    const payload: AvailableLensesPayload = { lensInfo: FRONT_LENS_INFO, zoom: SINGLE_WIDE_CAPS };
    const plan = (factor: number) => resolveZoomPlan(factor, payload, 'front');

    expect(plan(0.5).zoomFactor).toBeCloseTo(1);
    expect(plan(0.75).zoomFactor).toBeCloseTo(1);
    expect(plan(1).zoomFactor).toBeCloseTo(1);
    expect(plan(0.5).hasOpticalUltraWide).toBe(false);
    expect(plan(0.5).selectedLens).toBe(WIDE);
  });

  it('pins selfie to the widest front lens and waits before trusting other capabilities', () => {
    const midSwap: AvailableLensesPayload = {
      lensInfo: [
        { deviceType: ULTRA_WIDE, localizedName: 'Front Ultra Wide Camera' },
        ...FRONT_LENS_INFO,
      ],
      zoom: SINGLE_WIDE_CAPS,
    };
    const plan = resolveZoomPlan(0.5, midSwap, 'front');

    expect(plan.selectedLens).toBe(ULTRA_WIDE);
    expect(plan.zoomFactor).toBeUndefined();
  });

  it('uses front ultra-wide at min zoom when the device reports one', () => {
    const payload: AvailableLensesPayload = {
      lensInfo: [
        { deviceType: ULTRA_WIDE, localizedName: 'Front Ultra Wide Camera' },
        ...FRONT_LENS_INFO,
      ],
      zoom: capabilities({ deviceType: ULTRA_WIDE, min: 1, max: 8 }),
    };
    const plan = resolveZoomPlan(0.5, payload, 'front');

    expect(plan.selectedLens).toBe(ULTRA_WIDE);
    expect(plan.zoomFactor).toBeCloseTo(1);
    expect(plan.hasOpticalUltraWide).toBe(true);
  });

  it('never asks for a factor the device cannot reach', () => {
    const payload: AvailableLensesPayload = {
      lensInfo: FRONT_LENS_INFO,
      zoom: capabilities({ min: 1, max: 4 }),
    };
    expect(resolveZoomPlan(5, payload, 'front').zoomFactor).toBe(4);
    expect(resolveZoomPlan(0.5, payload, 'front').zoomFactor).toBe(1);
  });

  it('waits for the requested lens before trusting capabilities', () => {
    const midSwap: AvailableLensesPayload = { lensInfo: BACK_LENS_INFO, zoom: SINGLE_WIDE_CAPS };
    const plan = resolveZoomPlan(1, midSwap, 'back');

    expect(plan.selectedLens).toBe(TRIPLE);
    expect(plan.zoomFactor).toBeUndefined();
  });

  it('reports whether 0.5× is optical', () => {
    expect(resolveZoomPlan(0.5, backPayload, 'back').hasOpticalUltraWide).toBe(true);
    expect(
      resolveZoomPlan(0.5, { lensInfo: BACK_LENS_INFO, zoom: DUAL_CAPS }, 'back')
        .hasOpticalUltraWide,
    ).toBe(false);
  });
});

describe('resolveZoomPlan without the native patch', () => {
  const payload: AvailableLensesPayload = {
    lenses: BACK_LENS_INFO.map((lens) => lens.localizedName),
  };

  it('falls back to the 0–1 curve with no absolute factor', () => {
    const plan = resolveZoomPlan(1, payload, 'back');
    expect(plan.zoomFactor).toBeUndefined();
    expect(plan.nativeZoom).toBeGreaterThan(0);
  });

  it('keeps 0.5×–1× flat at the sensor\'s full frame on a camera with no wider lens', () => {
    const steps = [0.5, 0.6, 0.75, 0.9, 1].map(
      (factor) => resolveZoomPlan(factor, payload, 'front').nativeZoom,
    );
    for (const step of steps) {
      expect(step).toBe(0);
    }
  });

  it('still zooms in monotonically above 1× with no wider lens to anchor from', () => {
    const steps = [1, 2, 3, 4, 5].map(
      (factor) => resolveZoomPlan(factor, payload, 'front').nativeZoom,
    );
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]!).toBeGreaterThan(steps[i - 1]!);
    }
  });

  it('anchors 0.5× at the widest the camera can do', () => {
    expect(factorToNativeZoom(0.5)).toBe(0);
    expect(factorToNativeZoom(1)).toBeCloseTo(Math.log(2) / Math.log(CAMERA_ZOOM_CURVE_MAX));
  });

  it('with anchor 1 (no wider lens to crop from), 1× is also the widest frame', () => {
    expect(factorToNativeZoom(0.5, CAMERA_ZOOM_CURVE_MAX, 1)).toBe(0);
    expect(factorToNativeZoom(1, CAMERA_ZOOM_CURVE_MAX, 1)).toBe(0);
    expect(factorToNativeZoom(2, CAMERA_ZOOM_CURVE_MAX, 1)).toBeCloseTo(
      Math.log(2) / Math.log(CAMERA_ZOOM_CURVE_MAX),
    );
  });

  it('still detects an ultra-wide from localized names', () => {
    expect(findUltraWideLens(payload.lenses!)).toBe('Back Ultra Wide Camera');
    expect(resolveZoomPlan(0.5, payload, 'back').hasOpticalUltraWide).toBe(true);
    expect(resolveZoomPlan(0.5, payload, 'front').hasOpticalUltraWide).toBe(false);
  });

  it('ignores virtual composite lenses when name matching', () => {
    expect(findUltraWideLens(['Back Dual Wide Camera', 'Back Triple Camera'])).toBeUndefined();
  });

  it('handles a null payload at mount', () => {
    const plan = resolveZoomPlan(0.5, null, 'front');
    expect(plan.selectedLens).toBeUndefined();
    expect(plan.zoomFactor).toBeUndefined();
    expect(plan.nativeZoom).toBe(0);
  });
});

describe('findWidestFrontLens', () => {
  it('prefers ultra-wide, then wide, then TrueDepth', () => {
    expect(
      findWidestFrontLens({
        lensInfo: FRONT_LENS_INFO,
      }),
    ).toBe(WIDE);
    expect(
      findWidestFrontLens({
        lensInfo: [
          { deviceType: ULTRA_WIDE, localizedName: 'Front Ultra Wide Camera' },
          ...FRONT_LENS_INFO,
        ],
      }),
    ).toBe(ULTRA_WIDE);
    expect(
      findWidestFrontLens({
        lensInfo: [
          {
            deviceType: 'AVCaptureDeviceTypeBuiltInTrueDepthCamera',
            localizedName: 'Front TrueDepth Camera',
          },
        ],
      }),
    ).toBe('AVCaptureDeviceTypeBuiltInTrueDepthCamera');
  });

  it('falls back to localized ultra-wide names without lensInfo', () => {
    expect(
      findWidestFrontLens({ lenses: ['Front Camera', 'Front Ultra Wide Camera'] }),
    ).toBe('Front Ultra Wide Camera');
  });
});

describe('crossesLensBoundary', () => {
  it('detects a crossing in either direction', () => {
    expect(crossesLensBoundary(1, 3, [2, 6])).toBe(true);
    expect(crossesLensBoundary(3, 1, [2, 6])).toBe(true);
    expect(crossesLensBoundary(3, 5, [2, 6])).toBe(false);
  });

  it('is exclusive of the lower bound and inclusive of landing exactly on the boundary', () => {
    expect(crossesLensBoundary(1.9, 2, [2, 6])).toBe(true);
    expect(crossesLensBoundary(2, 2, [2, 6])).toBe(false);
  });

  it('detects crossing multiple boundaries in one jump', () => {
    expect(crossesLensBoundary(1, 10, [2, 6])).toBe(true);
  });

  it('is false with no boundaries', () => {
    expect(crossesLensBoundary(1, 10, [])).toBe(false);
  });
});

describe('absoluteToNativeZoom', () => {
  it('inverts expo-camera exponential curve', () => {
    expect(absoluteToNativeZoom(16, 16)).toBeCloseTo(1);
    expect(absoluteToNativeZoom(4, 16)).toBeCloseTo(0.5);
    expect(absoluteToNativeZoom(1, 16)).toBe(0);
  });

  it('clamps rather than exceeding the 0–1 prop range', () => {
    expect(absoluteToNativeZoom(1000, 16)).toBe(1);
    expect(absoluteToNativeZoom(0.2, 16)).toBe(0);
  });
});
