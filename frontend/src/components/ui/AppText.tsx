import { Text, type TextProps, type TextStyle } from 'react-native';

import { textStyles, type TextStyleName } from '@/constants/tokens';

export type AppTextProps = TextProps & {
  /** Canonical or documented-outlier style from `tokens.textStyles`. */
  variant: TextStyleName;
};

/**
 * Brand typography wrapper — prefer over ad-hoc `fontFamily` / `fontSize`.
 * Use `ThemedText` only for Expo template chrome (hint-row / web-badge).
 */
export function AppText({ variant, style, ...rest }: AppTextProps) {
  return <Text style={[textStyles[variant] as TextStyle, style]} {...rest} />;
}
