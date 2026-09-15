import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

/** Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for rationale. */
export function SessionsIcon({ color = '#1c1b1b', size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={13} r={7.5} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 9.5V13l2.5 1.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 3.5h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
