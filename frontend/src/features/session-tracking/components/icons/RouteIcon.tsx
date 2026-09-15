import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for
 * rationale. A dashed path + marker, used for "miles covered" impact stat.
 */
export function RouteIcon({ color = '#1c1b1b', size = 18, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={18} r={2} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M6.7 16.8 12 8.5c1-1.6 3.4-1.6 4.4 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="2.6 2.2"
      />
      <Circle cx={18} cy={6.5} r={2} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
