import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { Platform } from 'react-native';

/** Tour middle-graphic modules — prefer small webp for fast first paint. */
export const TOUR_GRAPHICS = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  shopShowcase: require('@/assets/figma/tour/shop-showcase.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trackMap: require('@/assets/figma/tour/track-map.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sessionList: require('@/assets/figma/tour/session-list.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  homeStatsChart: require('@/assets/figma/tour/home-stats-chart.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  homeStatsCards: require('@/assets/figma/tour/home-stats-cards.png') as number,
} as const;

let prefetchStarted = false;

/**
 * Warm expo-image's memory-disk cache for all tour graphics.
 * Safe to call multiple times — only runs once per app session.
 * Use Asset.fromModule().uri (sync) instead of downloadAsync() because
 * bundled assets already have a local URI and don't need a network fetch.
 */
export function prefetchAllTourGraphics(): void {
  if (prefetchStarted) return;
  // expo-image prefetch uses DOM `Image` on web; skip in SSR so Metro stays up.
  if (Platform.OS === 'web') return;
  prefetchStarted = true;

  const uris = Object.values(TOUR_GRAPHICS).flatMap((module) => {
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

/** @deprecated Use prefetchAllTourGraphics() at app boot instead. */
export async function prefetchTourGraphics(
  keys: (keyof typeof TOUR_GRAPHICS)[] = ['shopShowcase', 'trackMap'],
): Promise<void> {
  prefetchAllTourGraphics();
  void keys;
}
