/**
 * Session Tracking feature tokens — re-export of the canonical Figma DS module.
 *
 * `colors.bgSurface` stays the elevated Figma surface (`#f6f3f2`) for this
 * feature's existing layouts; white cards use `colors.white`.
 */
export {
  primitives,
  spacing,
  screenPaddingHorizontal,
  radius,
  shadows,
  fontFamilies,
  textStyles,
  status,
} from '@/constants/tokens';

export type { TextStyleName } from '@/constants/tokens';

import {
  colors as shared,
  primitives,
  status,
} from '@/constants/tokens';

export const colors = {
  primary: shared.primary,
  bgApp: shared.bgApp,
  bgSurface: primitives.surfaceElevated,
  textPrimary: shared.textPrimary,
  textTertiary: shared.textTertiary,
  textOnPrimary: shared.textOnPrimary,
  borderOutline: shared.borderOutline,
  borderChipSelected: shared.borderChipSelected,
  accentLime: shared.accentLime,
  white: shared.white,
  status,
} as const;
