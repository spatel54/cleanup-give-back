import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

/** Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for rationale. */
export function ChevronUpIcon({ color = '#ffffff', size = 18, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 15l6-6 6 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
