import Svg, { Path } from 'react-native-svg';
import type { NavIconProps } from './types';

/**
 * Ported from `frontend/assets/figma/home-screen/nav/track.svg`
 * (Figma node 566:387, file DrDcQH14n7ntDQ80F7au9S). Merged target-icon
 * asset (center dot + ring) — do not split into two separate SVGs.
 */
export function NavTrackIcon({ color = '#3E4A3D', width = 22, height = 22 }: NavIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11.0001 15.4001C13.4301 15.4001 15.4001 13.4301 15.4001 11.0001C15.4001 8.57004 13.4301 6.6001 11.0001 6.6001C8.57004 6.6001 6.6001 8.57004 6.6001 11.0001C6.6001 13.4301 8.57004 15.4001 11.0001 15.4001Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0C17.0751 0 22 4.92487 22 11ZM19.8 11C19.8 15.8601 15.8601 19.8 11 19.8C6.13989 19.8 2.2 15.8601 2.2 11C2.2 6.13989 6.13989 2.2 11 2.2C15.8601 2.2 19.8 6.13989 19.8 11Z"
        fill={color}
      />
    </Svg>
  );
}
