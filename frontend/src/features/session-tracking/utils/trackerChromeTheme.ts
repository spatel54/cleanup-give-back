import type { MapBasemapTheme } from '../mapThemeStore';
import { colors } from '../tokens';

/**
 * Live-tracker overlay chrome. Follows `mapThemeStore` (not OS appearance) so
 * sun/moon + auto night mode restyle cards/pills/tools with the basemap.
 * Dark values intentionally deviate from cream brand tokens for map contrast.
 */
export type TrackerChromeColors = {
  mapTint: string;
  /** Card / pill / compass fill */
  surface: string;
  /** Map-tool button fill (slightly distinct from surface in light) */
  surfaceMuted: string;
  textPrimary: string;
  textTertiary: string;
  textOnPrimary: string;
  borderOutline: string;
  /** Stronger outline for circular map tools */
  borderStrong: string;
  primary: string;
  accentLime: string;
  statusPending: string;
  /** Secondary CTA fill */
  secondaryFill: string;
  secondaryBorder: string;
  secondaryLabel: string;
};

const LIGHT: TrackerChromeColors = {
  mapTint: '#eae3d0',
  surface: colors.textOnPrimary,
  surfaceMuted: colors.bgApp,
  textPrimary: colors.textPrimary,
  textTertiary: colors.textTertiary,
  textOnPrimary: colors.textOnPrimary,
  borderOutline: colors.borderOutline,
  borderStrong: colors.textTertiary,
  primary: colors.primary,
  accentLime: colors.accentLime,
  statusPending: colors.status.pending.border,
  secondaryFill: colors.bgApp,
  secondaryBorder: colors.borderOutline,
  secondaryLabel: colors.textTertiary,
};

/** Near-black surfaces + light type — readable over Dark Matter / night maps. */
const DARK: TrackerChromeColors = {
  mapTint: '#0e0e0e',
  surface: '#1c1b1b',
  surfaceMuted: '#252525',
  textPrimary: '#fcf9f8',
  textTertiary: '#bdcaba',
  textOnPrimary: '#ffffff',
  borderOutline: '#4a5248',
  borderStrong: '#6e7a6c',
  primary: colors.primary,
  accentLime: colors.accentLime,
  statusPending: colors.status.pending.border,
  secondaryFill: '#252525',
  secondaryBorder: '#4a5248',
  secondaryLabel: '#bdcaba',
};

export function getTrackerChromeColors(theme: MapBasemapTheme): TrackerChromeColors {
  return theme === 'dark' ? DARK : LIGHT;
}
