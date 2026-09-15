import Svg, { Path, Rect } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored, Heroicons-solid visual family (filled) — see HomeIcon.tsx
 * for rationale. Used for the week date-range badge and session date chips.
 */
export function CalendarIcon({ color = '#1c1b1b', size = 18 }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15} rx={2.5} fill={color} />
      <Path d="M8 3v4M16 3v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x={6.5} y={10.5} width={4} height={3.5} rx={0.75} fill="#ffffff" />
    </Svg>
  );
}
