import type { TextStyle } from 'react-native';

/**
 * Canonical Figma design-system tokens for React Native.
 *
 * Source of truth (in order):
 * 1. Figma Design System page `1:3` (file DrDcQH14n7ntDQ80F7au9S)
 * 2. JSON exports in `frontend/design/figma/tokens/`
 * 3. This module — import from `@/constants/tokens` (or feature re-exports)
 *
 * Do not hardcode brand hex values in screens; use these tokens instead.
 */

// ─── Primitives ─────────────────────────────────────────────────────────────

export const primitives = {
  green500: '#009540',
  green50: '#f7fff1',
  gray900: '#1c1b1b',
  gray700: '#3e4a3d',
  gray500: '#6e7a6c',
  gray300: '#bdcaba',
  gray200: '#e5e2e1',
  white: '#ffffff',
  cream50: '#fcf9f8',
  lime500: '#c2d832',
  /** Figma `color/bg/tour` (promoted from code-only 2026-08-09) */
  tourMint: '#dcebe2',
  /** Figma `color/chip/bg` (promoted from code-only 2026-08-09) */
  chipBg: '#f0edec',
  /** Figma `color/bg/surface/elevated` (new variable, added 2026-08-09 — do not confuse with `color/bg/surface` = white) */
  surfaceElevated: '#f6f3f2',
  amber100: '#ffddb5',
  amber700: '#835400',
  amber500: '#fcab29',
  red50: '#ffd9de',
  red600: '#ba1a1a',
} as const;

// ─── Semantic colors ────────────────────────────────────────────────────────

export const status = {
  approved: {
    bg: primitives.green50,
    text: primitives.green500,
    border: primitives.green500,
  },
  pending: {
    bg: primitives.amber100,
    text: primitives.amber700,
    border: primitives.amber500,
  },
  declined: {
    bg: primitives.red50,
    text: primitives.red600,
    border: primitives.red600,
  },
} as const;

/**
 * Flat semantic palette used by figma-screens and app routes.
 * Nested `status` is also attached for session-tracking consumers.
 */
export const colors = {
  bgApp: primitives.cream50,
  /**
   * Card background (white). Figma `color/bg/surface` — use this for modal
   * sheets and cards that sit on the cream app background. Do not confuse
   * with `bgSurfaceElevated`.
   */
  bgSurface: primitives.white,
  /** Figma `color/bg/surface/elevated` (`#f6f3f2`) */
  bgSurfaceElevated: primitives.surfaceElevated,
  bgTour: primitives.tourMint,
  primary: primitives.green500,
  textPrimary: primitives.gray900,
  textNavInactive: primitives.gray700,
  textTertiary: primitives.gray700,
  textOnPrimary: primitives.white,
  /** Cream label on primary fills where Figma uses bg-app */
  textOnPrimarySoft: primitives.cream50,
  borderOutline: primitives.gray300,
  borderChipSelected: primitives.gray200,
  accentLime: primitives.lime500,
  statusPendingBorder: status.pending.border,
  statusPendingBg: status.pending.bg,
  statusPendingText: status.pending.text,
  statusApprovedBorder: status.approved.border,
  statusApprovedBg: status.approved.bg,
  statusApprovedText: status.approved.text,
  statusDeclinedBorder: status.declined.border,
  statusDeclinedBg: status.declined.bg,
  statusDeclinedText: status.declined.text,
  chipSelectedBg: primitives.gray200,
  chipBg: primitives.chipBg,
  overlayScrim: 'rgba(28, 27, 27, 0.4)',
  /**
   * Stronger dim for camera / photo chrome overlays (not brand modal sheets).
   * Prefer `overlayScrim` for Free Trial, account sheets, and other product modals.
   */
  overlayScrimStrong: 'rgba(28, 27, 27, 0.55)',
  white: primitives.white,
  copyright: primitives.gray500,
  status,
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

/** Default horizontal screen margin per PRD §11.5 (20px min, 24px preferred). */
export const screenPaddingHorizontal = spacing.lg;

// ─── Radius ─────────────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 16,
  search: 22,
  full: 9999,
} as const;

// ─── Layout constants ────────────────────────────────────────────────────────

/** Shared structural measurements — import these instead of hardcoding per screen. */
export const layout = {
  /** Height of the bottom navigation bar (px). */
  bottomNavHeight: 64,
  /** Height of a standard top app bar title row (px). */
  topBarTitleRow: 44,
  /** Bottom padding inside a top app bar (px). */
  topBarPaddingBottom: 8.5,
} as const;

// ─── Elevation (structural chrome only — brand.md §Elevation) ─────────────

export const shadows = {
  navBottom: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  barTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────

export const fontFamilies = {
  sanchezRegular: 'Sanchez_400Regular',
  notoSansRegular: 'NotoSans_400Regular',
  notoSansMedium: 'NotoSans_500Medium',
  notoSansSemiBold: 'NotoSans_600SemiBold',
  notoSansBold: 'NotoSans_700Bold',
  ibmPlexSansRegular: 'IBMPlexSans_400Regular',
  ibmPlexSansMedium: 'IBMPlexSans_500Medium',
  ibmPlexSansSemiBold: 'IBMPlexSans_600SemiBold',
} as const;

type TextStyleToken = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

/** The 14 canonical text styles (design.md §5.4). */
export const textStyles = {
  displayHero: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 40,
    lineHeight: 48,
  },
  headlinePage: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 28,
    lineHeight: 36,
  },
  headlineSection: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 34,
    lineHeight: 42,
  },
  headlineDetail: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyDefault: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 18,
    lineHeight: 26,
  },
  bodySmall: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyEmphasis: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 16,
    lineHeight: 24,
  },
  labelOverline: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.08 * 12,
  },
  labelStatus: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  labelButton: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  navTab: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  dataStat: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 28,
    lineHeight: 36,
  },
  dataTimer: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 40,
    lineHeight: 48,
  },
  /**
   * Intentional outliers (design.md §5.5 / product specs) — not in the canonical 14.
   * Prefer these over inventing one-off sizes when matching documented exceptions.
   */
  /** Large post-form / onboarding CTAs (~19 Figma nodes). */
  labelButtonLarge: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  /** Noto SemiBold 16 weight variant where Figma uses SemiBold instead of Medium/Bold. */
  bodySemiBold: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  /** TopAppBar centered titles (session setup + list screens) — chrome, not page hero. */
  headlineTopBar: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    lineHeight: 24,
  },
  /** Live Activity Lock Screen hero timer (Strava-style) — SemiBold vs in-app `dataTimer` Medium. */
  dataTimerLiveActivity: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 40,
    lineHeight: 48,
  },
  /** Outlier — MinimizedTrackerBar value pair (Figma 622:176). */
  minimizedStatValue: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 24,
    lineHeight: 28,
  } as TextStyleToken,
} satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;
