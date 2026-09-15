import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

/** Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for rationale. */
export function BuildingIcon({ color = '#1c1b1b', size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4h5A1.5 1.5 0 0 1 14 5.5V20M14 9.5h4A1.5 1.5 0 0 1 19.5 11V20M6 20h13.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.75 7.5h1.5M8.75 10.5h1.5M8.75 13.5h1.5M16 12.5h1.25M16 15.5h1.25"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
