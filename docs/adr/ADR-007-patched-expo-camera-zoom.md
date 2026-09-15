# ADR-007: Patch expo-camera for absolute zoom instead of the 0–1 curve

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

The photo-checkpoint dial is labelled 0.5×–5×, but expo-camera's `zoom` prop is a
0–1 fraction applied as `videoZoomFactor = pow(activeFormat.videoMaxZoomFactor, zoom)`.
That maximum is per-device and per-format, is not readable from JavaScript, and on
an iPhone ultra-wide it is far larger than the value we had guessed, so no 0–1 value
could be mapped onto a labelled optical factor.

Two consequences shipped as bugs:

- The whole **0.5×–1× range was inert**. `factorToNativeZoom` returned a constant `0`
  below 1× unless an ultra-wide lens was reported, and no iPhone exposes a **front**
  ultra-wide — `AVCaptureDevice.DiscoverySession` on `.front` returns only the wide
  and TrueDepth cameras. The selfie step defaults to 0.5×, so this was the first
  thing a volunteer touched.
- Lens selection went through `AVCaptureDevice.localizedName` and a `/ultra/i`
  regex. That string changes with the device language, so the back camera degraded
  to the same inert range on a non-English phone. Expo deprecated this approach in
  [expo/expo#42916](https://github.com/expo/expo/pull/42916), which SDK 54's
  expo-camera 17.0.10 predates.

Additionally, crossing 1× swapped `selectedLens` between the physical ultra-wide and
wide devices, tearing down and rebuilding the capture input mid-gesture, while
17.0.10 applies `zoom` synchronously on the caller's thread and calls
`unlockForConfiguration()` outside its `do/catch` — so a throw during that
reconfiguration dropped the zoom silently and unbalanced the device lock.

## Decision

Maintain a `patch-package` patch of expo-camera (currently `frontend/patches/expo-camera+57.0.4.patch`,
regenerated 2026-09-10 for the SDK 57 bump — the prior SDK 54 patch,
`expo-camera+17.0.10.patch`, is superseded; do not restore it — applied by a
`postinstall` script) that:

- adds an absolute `zoomFactor` prop setting `videoZoomFactor` directly, clamped to
  the device's supported range and taking precedence over `zoom`;
- reports the active device's zoom capabilities through `onAvailableLensesChanged`
  (`min`, `max`, `switchOverFactors`, `constituentDeviceTypes`, `deviceType`) plus a
  `lensInfo` array carrying stable `deviceType` identifiers alongside localized names;
- matches `selectedLens` against `deviceType` as well as `localizedName`;
- moves `updateZoom()` onto the session queue and balances the configuration lock.

`frontend/src/lib/cameraZoom.ts` consumes those capabilities to anchor 1× on the real
optical hand-off point (`switchOverFactors[wideIndex - 1]` on a virtual device) and
pins the back camera to the virtual multi-lens device for the entire range, letting
iOS perform the lens hand-off the way the system camera does.

Where no ultra-wide exists — every front camera, and single-lens backs — both 0.5×
and 1× are the sensor's full frame (no digital crop). The front camera cannot show
more than its own sensor; cropping at 1× made the default "1×" feel too tight.
Above 1× still zooms in monotonically. On devices with an optical ultra-wide, 0.5×
remains the ultra-wide hand-off and 1× is the real 2× crop into the wide lens.

## Consequences

- Requires a native rebuild; the patch does not reach Expo Go. `resolveZoomPlan`
  detects the missing capabilities and falls back to the 0–1 curve, which stays
  continuous and monotonic but is approximate.
- `npm install` must run `postinstall`. EAS and local prebuild both do.
- The patch must be regenerated when expo-camera is upgraded — filename is pinned to
  the exact version (`expo-camera+<version>.patch`), so a bump that doesn't regenerate
  it silently drops back to the 0–1 curve fallback with no build error. Prefer dropping
  it once a released version carries [expo/expo#42916](https://github.com/expo/expo/pull/42916)
  and an equivalent absolute-zoom API.
- `frontend/ios` stays gitignored (continuous native generation); the patch lives in
  `node_modules`, which is why `patch-package` is the vehicle rather than a config plugin.

## Alternatives considered

- **Keep guessing the curve base in JS.** Cannot work: `videoMaxZoomFactor` varies by
  device and active format and is never exposed to JavaScript.
- **Digitally crop the preview and captured image in JS.** Invasive, costs quality,
  and would not match what the capture pipeline records.
- **Return to `react-native-vision-camera`**, which exposes `minZoom`/`maxZoom`/`neutralZoom`
  natively. Rejected: it was removed in `07666e0` over a native crash, and reinstating
  it is a far larger change than a 25-line patch.
