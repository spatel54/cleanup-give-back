# Xcode Build Guide

How to build and run the app on a physical iOS device using Xcode.

---

## Prerequisites

- Mac with Xcode installed (16+)
- Apple ID (free — no paid developer account needed for device testing)
- iPhone plugged in via USB, trusted on Mac

---

## One-time setup

### 1. Install dependencies and generate native folders

```bash
cd frontend
npx expo install react-native-vision-camera expo-build-properties
npx expo prebuild --clean
```

`prebuild --clean` generates `ios/` and `android/` and runs `pod install` automatically.
If pod install fails separately, run:

```bash
cd ios && pod install --repo-update && cd ..
```

### 2. Add your Apple ID to Xcode

1. Open **Xcode → Settings → Accounts**
2. Click **+** → **Apple ID** → sign in
3. Click **Manage Certificates → + → Apple Development**

### 3. Configure signing

```bash
open ios/nonprofitmobileapp.xcworkspace
```

1. Click **nonprofitmobileapp** in the left sidebar
2. Select the **nonprofitmobileapp** target
3. Go to **Signing & Capabilities**
4. Check **Automatically manage signing**
5. Set **Team** to your personal team (`Your Name (Personal Team)`)

> **Note:** Personal teams do not support Push Notifications. The entitlement
> has been removed from `ios/nonprofitmobileapp/nonprofitmobileapp.entitlements`.

---

## Building and running

1. Select your iPhone from the device picker at the top of Xcode
2. Press **⌘R** — Xcode builds and installs the app on your device
3. First build: ~5 min. Subsequent builds: ~30–60 sec

---

## After pulling new changes

If `app.json`, `package.json`, or any native module changes, regenerate native folders:

```bash
cd frontend
npx expo prebuild --clean
open ios/nonprofitmobileapp.xcworkspace
```

Then rebuild in Xcode (⌘R).

If only JS/TS files changed, just rebuild in Xcode — no prebuild needed.

---

## Common errors

| Error | Fix |
|---|---|
| `No signing certificates` | Add Apple ID in Xcode Settings → Accounts → Manage Certificates → + → Apple Development |
| `No profiles for bundle ID` | Bundle ID must not start with `com.anonymous`. Current: `com.shivpat.cleanupgiveback` |
| `Push Notifications not supported` | Remove `aps-environment` from `.entitlements` (already done) |
| `xcworkspace not found` | Run `npx expo prebuild --clean` then `cd ios && pod install` |
| `ReactNativeDependencies not found` | Run `pod install --repo-update` inside `ios/` |
| `devicectl JSON version` warning | Build directly from Xcode (⌘R) instead of `npx expo run:ios` |
| `pod --version` throws `Could not find 'bigdecimal'` | Stale `GEM_HOME`/`GEM_PATH` (from an old rbenv/chruby setup) point at a Ruby version that no longer matches Homebrew's active `ruby`. Run pod/EAS commands with `env -u GEM_HOME -u GEM_PATH` prefixed, or fix the shell profile permanently |
| `eas build --local` signing errors on a personal team (App Group "not available", "Sign In with Apple" unsupported) | Those capabilities are registered to the paid `CleanUpGiveBack.org` team and/or require a paid Apple Developer account — a free personal team can never claim them. Build via `eas build --profile development --local` instead of local Xcode signing; it uses the org's stored EAS credentials |
| A patched native module (e.g. `expo-camera`'s `zoomFactor`) doesn't take effect even though `patch-package` logs it applied | `expo-modules-autolinking`'s precompiled-modules feature may have swapped the module for a prebuilt XCFramework instead of compiling your patched source. Verify with `strings` on the built binary for a symbol unique to your patch; if missing, set `EXPO_USE_PRECOMPILED_MODULES=0` in the build profile's `env` in `eas.json` |
| `eas build --local` crashes with `Error: kill ESRCH` right after the `expo doctor` step | A race-condition bug in `eas-cli-local-build-plugin`'s own cleanup, unrelated to your project — just retry the build |
| `Assets.xcassets: … icon … named "expo"` on **livesessionwidget** | Main app uses `expo.icon`; widget catalog is `AppIcon`. Plugin `withLiveSessionWidgetAppIcon` sets widget `ASSETCATALOG_COMPILER_APPICON_NAME=AppIcon`. Build scheme **livesessionwidget** from the `.xcworkspace`. After `prebuild`, re-run prebuild or confirm that plugin is in `app.json`. |

---

## Live Activity widget (Canvas previews)

- Open `frontend/ios/nonprofitmobileapp.xcworkspace` (not `.xcodeproj` alone).
- Scheme: **nonprofitmobileapp** (host app — required; widget-only **livesessionwidget** fails with “appex must be in an app”).
- Destination: any **iPhone Simulator** (not “Any iOS Device”).
- Build (⌘B) → Canvas on `targets/live-session-widget/SessionLiveActivity.swift` → pick **Card — …** previews.
- Do **not** use a widget-only scheme for Canvas (removed — extension previews require the host app).

---

## Bundle ID

`com.shivpat.cleanupgiveback` — set in `frontend/app.json`.

---

## TestFlight (org Apple Developer — `$99/yr`)

Testers install from **Apple TestFlight**, not Expo Go. **Do not rely on EAS cloud iOS builds** on the free plan — use a **local build on your Mac**, then **EAS Submit**.

### Fastlane (recommended)

From **`frontend/`** (see [accounts-and-access.md](accounts-and-access.md)):

```bash
# Ensure frontend/.env has EXPO_PUBLIC_* and ios/ exists (npx expo prebuild if needed)
fastlane ios build
fastlane ios submit
```

### Xcode Organizer (manual)

1. Set device to **Any iOS Device (arm64)** in Xcode
2. **Product → Archive**
3. Organizer: **Distribute App → TestFlight & App Store → Upload**
4. [App Store Connect → TestFlight](https://appstoreconnect.apple.com/testflight/ios) → add testers

### EAS local (same as Fastlane build lane)

Needs **Xcode.app 26+** (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`), CocoaPods (`brew install cocoapods`). Activity-kit bun postinstall is skipped via eas.json. On macOS Tahoe run `node scripts/patch-eas-local-keychain.mjs` first.

```bash
cd frontend
eas build --platform ios --profile production --local
eas submit --path ./build-XXXXXXXX.ipa --profile production
```

### EAS cloud (only when quota available)

```bash
cd frontend && eas build --platform ios --profile production --auto-submit --no-wait
```
