import { Image, type ImageStyle } from 'expo-image';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../tokens';

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

/** Figma `Back icon` (node `196:318`). */
export function SessionDetailBackIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/back.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Figma `Share icon` (node `196:321`) — Svg so `color` paints reliably (tint on asset SVGs does not). */
export function SessionDetailShareIcon({
  width = 24,
  height = 24,
  color = colors.textPrimary,
  style,
}: {
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 11C4.55228 11 5 11.4477 5 12V20C5 20.2652 5.10536 20.5196 5.29289 20.7071C5.48043 20.8946 5.73478 21 6 21H18C18.2652 21 18.5196 20.8946 18.7071 20.7071C18.8946 20.5196 19 20.2652 19 20V12C19 11.4477 19.4477 11 20 11C20.5523 11 21 11.4477 21 12V20C21 20.7957 20.6839 21.5587 20.1213 22.1213C19.5587 22.6839 18.7957 23 18 23H6C5.20435 23 4.44129 22.6839 3.87868 22.1213C3.31607 21.5587 3 20.7956 3 20V12C3 11.4477 3.44772 11 4 11Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.2929 1.29289C11.6834 0.902369 12.3166 0.902369 12.7071 1.29289L16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711C16.3166 7.09763 15.6834 7.09763 15.2929 6.70711L12 3.41421L8.70711 6.70711C8.31658 7.09763 7.68342 7.09763 7.29289 6.70711C6.90237 6.31658 6.90237 5.68342 7.29289 5.29289L11.2929 1.29289Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1C12.5523 1 13 1.44772 13 2V15C13 15.5523 12.5523 16 12 16C11.4477 16 11 15.5523 11 15V2C11 1.44772 11.4477 1 12 1Z"
        fill={color}
      />
    </Svg>
  );
}

/** Figma Hours Icon (node `555:2354`). */
export function SessionDetailHoursIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/hours.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Figma Miles Icon (node `555:2362`). */
export function SessionDetailMilesIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/miles.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Figma `MdOutlinePhotoCamera` (node `536:2188`). */
export function SessionDetailPhotosIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/photos.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}
