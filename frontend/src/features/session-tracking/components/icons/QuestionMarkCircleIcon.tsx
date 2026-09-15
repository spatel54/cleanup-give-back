import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored, Heroicons-outline visual family — see HomeIcon.tsx for rationale.
 * Figma names this glyph `react-icons/hi/HiQuestionMarkCircle` (web-only, incompatible).
 */
export function QuestionMarkCircleIcon({ color = '#1c1b1b', size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.25} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M9.75 9.5a2.25 2.25 0 1 1 3.4 1.94c-.7.42-1.15.9-1.15 1.81"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={16.25} r={0.9} fill={color} />
    </Svg>
  );
}
