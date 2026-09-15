import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

/** Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for rationale. */
export function BellIcon({ color = '#1c1b1b', size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10.5a6 6 0 0 1 12 0v3.2c0 .5.16.99.47 1.38l.9 1.16a1 1 0 0 1-.79 1.61H5.42a1 1 0 0 1-.79-1.61l.9-1.16c.31-.4.47-.88.47-1.38v-3.2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 19.5a2.5 2.5 0 0 0 5 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
