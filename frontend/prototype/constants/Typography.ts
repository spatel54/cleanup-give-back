// PROTOTYPE — NOT FINAL.
//
// Sanchez    → Headlines (H1–H3, display)
// Noto Sans  → Body text
// IBM Plex Sans → Labels, buttons, navigation, metadata
// JetBrains Mono → Timer, session data, GPS values
//
// Font families fall back to system fonts until expo-google-fonts packages are installed.

import { TextStyle } from 'react-native';

const SANCHEZ = 'Sanchez';
const NOTO_SANS = 'NotoSans';
const IBM_PLEX = 'IBMPlexSans';
const JETBRAINS = 'JetBrainsMono';

type TypeStyle = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

export const Typography: Record<string, TypeStyle> = {
  // ─── Sanchez — Headlines ─────────────────────────────────────────────────
  displayLarge: {
    fontFamily: SANCHEZ,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '400',
  },
  displayMedium: {
    fontFamily: SANCHEZ,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '400',
  },
  headlineLarge: {
    fontFamily: SANCHEZ,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400',
  },
  headlineMedium: {
    fontFamily: SANCHEZ,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400',
  },
  headlineSmall: {
    fontFamily: SANCHEZ,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400',
  },

  // ─── Noto Sans — Body ────────────────────────────────────────────────────
  bodyLarge: {
    fontFamily: NOTO_SANS,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: NOTO_SANS,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily: NOTO_SANS,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },

  // ─── IBM Plex Sans — Labels, Buttons, Navigation ─────────────────────────
  labelXLarge: {
    fontFamily: IBM_PLEX,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  labelLarge: {
    fontFamily: IBM_PLEX,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',    // Button text
  },
  labelMedium: {
    fontFamily: IBM_PLEX,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',    // Form labels, nav items
  },
  labelSmall: {
    fontFamily: IBM_PLEX,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',    // Metadata, timestamps, status tags
    letterSpacing: 0.1,
  },

  // ─── JetBrains Mono — Timer / Session Data ───────────────────────────────
  monoDisplay: {
    fontFamily: JETBRAINS,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '400',    // Live session timer
  },
  monoLarge: {
    fontFamily: JETBRAINS,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400',    // Total hours display
  },
  monoBody: {
    fontFamily: JETBRAINS,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',    // Countdown timers, GPS data
  },
  monoSmall: {
    fontFamily: JETBRAINS,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',    // Photo checkpoint timestamps
  },
};

// ─── Spacing + Layout ────────────────────────────────────────────────────────
export const Spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
  screenPadding: 24,
} as const;

export const Radius = {
  sm: 12,   // Inputs, status tags, chips
  md: 16,   // Cards, session cards, product cards
  lg: 24,   // Primary cards, bottom sheets
  full: 999, // Pill buttons
} as const;
