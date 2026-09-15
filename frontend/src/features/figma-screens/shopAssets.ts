import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { Platform } from 'react-native';

import { CART_ASSETS } from './mocks/cart';
import { DONATE_ASSETS } from './mocks/donate';
import { PRODUCT_DETAIL_ASSETS } from './mocks/productDetail';

/** Shop home catalog images — Figma shop frames (PRD §6.19). */
export const SHOP_HOME_ASSETS = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  donateHero: require('@/assets/figma/shop/donate/thank-you-bags.webp') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  featuredKit: require('@/assets/figma/shop/featured-kit.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  productToteBags: require('@/assets/figma/shop/product-tote-bags.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  productTrashGrabber: require('@/assets/figma/shop/product-trash-grabber.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  productChildVest: require('@/assets/figma/shop/product-child-vest.png') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  productAdultVest: require('@/assets/figma/shop/product-adult-vest.png') as number,
} as const;

const SHOP_PREFETCH_MODULES = [
  ...Object.values(SHOP_HOME_ASSETS),
  DONATE_ASSETS.hero,
  CART_ASSETS.kitThumb,
  ...Object.values(PRODUCT_DETAIL_ASSETS),
] as const;

let prefetchStarted = false;

/**
 * Warm expo-image's memory-disk cache for the full shop flow (home, donate card
 * + contribute hero, product detail, cart). Safe to call multiple times — only runs once per session.
 * Bundled assets resolve synchronously via Asset.fromModule().uri.
 */
export function prefetchAllShopGraphics(): void {
  if (prefetchStarted) return;
  // expo-image prefetch uses DOM `Image` on web; skip in SSR so Metro stays up.
  if (Platform.OS === 'web') return;
  prefetchStarted = true;

  const uris = SHOP_PREFETCH_MODULES.flatMap((module) => {
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
