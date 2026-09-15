import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

/** Filled play triangle for route replay controls. */
export function PlayIcon({ color = '#3E4A3D', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5.14V18.86L19 12L8 5.14Z" fill={color} />
    </Svg>
  );
}
