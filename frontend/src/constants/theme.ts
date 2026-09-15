/**
 * App chrome theme — wired to the Figma design system.
 *
 * Brand / screen work should import `@/constants/tokens` (or feature re-exports).
 * `Colors` here feeds Expo template hooks (`useThemeColor`, ThemedText/View).
 */

import '@/global.css';

import { Platform } from 'react-native';

import { colors, fontFamilies, spacing as tokenSpacing } from '@/constants/tokens';

export const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.bgApp,
    backgroundElement: colors.bgSurfaceElevated,
    backgroundSelected: colors.chipSelectedBg,
    textSecondary: colors.textTertiary,
    tint: colors.primary,
    icon: colors.textTertiary,
    tabIconDefault: colors.textTertiary,
    tabIconSelected: colors.primary,
  },
  /** App is light-mode only; dark mirrors light brand tokens for template hooks. */
  dark: {
    text: colors.textPrimary,
    background: colors.bgApp,
    backgroundElement: colors.bgSurfaceElevated,
    backgroundSelected: colors.chipSelectedBg,
    textSecondary: colors.textTertiary,
    tint: colors.primary,
    icon: colors.textTertiary,
    tabIconDefault: colors.textTertiary,
    tabIconSelected: colors.primary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: fontFamilies.notoSansRegular,
    serif: fontFamilies.sanchezRegular,
    rounded: fontFamilies.notoSansRegular,
    mono: fontFamilies.ibmPlexSansRegular,
  },
  default: {
    sans: fontFamilies.notoSansRegular,
    serif: fontFamilies.sanchezRegular,
    rounded: fontFamilies.notoSansRegular,
    mono: fontFamilies.ibmPlexSansRegular,
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Spacing scale aligned to Figma `spacing/*` (xs→4 … 4xl→64). */
export const Spacing = {
  half: 2,
  one: tokenSpacing.xs,
  two: tokenSpacing.sm,
  three: tokenSpacing.md,
  four: tokenSpacing.lg,
  five: tokenSpacing.xl,
  six: tokenSpacing['4xl'],
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export {
  colors as BrandColors,
  fontFamilies,
  primitives,
  radius,
  screenPaddingHorizontal,
  shadows,
  spacing as TokenSpacing,
  textStyles,
} from '@/constants/tokens';
