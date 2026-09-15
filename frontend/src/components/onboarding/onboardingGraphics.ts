import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { Platform } from 'react-native';

/** Session-setup guide + related onboarding graphics for memory-disk prefetch. */
export const ONBOARDING_GRAPHICS = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  guideIllustration: require('@/assets/images/screens/session-setup/guide-illustration.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  step2Illustration: require('@/assets/images/screens/session-setup/step2-illustration.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  step3Illustration: require('@/assets/images/screens/session-setup/step3-illustration.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  step4Illustration: require('@/assets/images/screens/session-setup/step4-illustration.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  step5Illustration: require('@/assets/images/screens/session-setup/step5-illustration.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  freeKitGraphic: require('@/assets/images/screens/onboarding/free-kit-graphic.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  freeHourGraphic: require('@/assets/images/screens/onboarding/free-hour-graphic.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  welcomeHero: require('@/assets/figma/onboarding/welcome-hero.png') as number,
} as const;

let prefetchStarted = false;

/** Warm expo-image cache for session-setup / onboarding illustrations. */
export function prefetchAllOnboardingGraphics(): void {
  if (prefetchStarted) return;
  // expo-image prefetch uses DOM `Image` on web; skip in SSR so Metro stays up.
  if (Platform.OS === 'web') return;
  prefetchStarted = true;

  const uris = Object.values(ONBOARDING_GRAPHICS).flatMap((module) => {
    try {
      const uri = Asset.fromModule(module).uri;
      return uri ? [uri] : [];
    } catch {
      return [];
    }
  });

  if (uris.length > 0) {
    void ExpoImage.prefetch(uris, 'memory-disk').catch(() => undefined);
  }
}
