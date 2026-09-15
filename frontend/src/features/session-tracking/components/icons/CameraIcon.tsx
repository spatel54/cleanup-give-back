import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

/** Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for rationale. */
export function CameraIcon({ color = '#1c1b1b', size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1.2-1.8A1.5 1.5 0 0 1 10 4.5h4a1.5 1.5 0 0 1 1.3.7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.25} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
