import { Image, type ImageStyle } from 'expo-image';
import type { DimensionValue, StyleProp } from 'react-native';

type AssetIconProps = {
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
};

function AssetIcon({
  source,
  width,
  height,
  style,
}: AssetIconProps & { source: number }) {
  return (
    <Image
      source={source}
      style={[{ width: width as DimensionValue, height: height as DimensionValue }, style]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Figma `react-icons/gr/GrSearch` — search field (node `515:1897`). */
export function SessionsSearchIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/sessions-list/react-icons/gr/GrSearch.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Figma `react-icons/hi/HiOutlineChevronUp` — sort control (node `515:1941`). Flip with `pointingDown`. */
export function SessionsSortChevronIcon({
  width = 16,
  height = 16,
  pointingDown = false,
  style,
}: Partial<AssetIconProps> & { pointingDown?: boolean }) {
  return (
    <AssetIcon
      source={require('@/assets/figma/sessions-list/react-icons/hi/HiOutlineChevronUp.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={[pointingDown ? { transform: [{ rotate: '180deg' }] } : null, style]}
    />
  );
}

/** Figma `Expand Icon` / `BiExpandAlt` — session row expand (nodes `515:1945`, `515:2028`). */
export function SessionsExpandIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/sessions-list/expand.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Figma `Ellipse 1` — date/time separator dot (node `515:1960`). */
export function SessionsMetaDot({ width = 4, height = 4, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/sessions-list/ellipse.svg')}
      width={width ?? 4}
      height={height ?? 4}
      style={style}
    />
  );
}
