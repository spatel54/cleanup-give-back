import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored, Heroicons-solid visual family (filled, celebratory contexts) —
 * see HomeIcon.tsx for rationale. Used for the Home dashboard's weekly streak
 * badge.
 */
export function FlameIcon({ color = '#fcab29', size = 24 }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5c1 2.3-.3 3.6-1.4 4.9C9.4 8.8 8 10.5 8 13a4 4 0 0 0 8 0c0-1-.3-1.8-.7-2.5.9.6 1.7 1.7 1.7 3.5a5 5 0 0 1-10 0c0-3.6 2.2-5.3 3.6-7 .9-1.1 1.5-2 1.4-4.5Z"
        fill={color}
      />
    </Svg>
  );
}
