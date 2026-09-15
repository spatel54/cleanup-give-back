import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored in the Heroicons-outline visual family (24x24, stroke-based).
 * `react-icons` is a web-only package and cannot run in React Native — see
 * docs/frontend/specs/figma-to-native-handoff.md for the rationale.
 */
export function HomeIcon({ color = '#1c1b1b', size = 24, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5.5h4V20h3a1 1 0 0 0 1-1v-9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
