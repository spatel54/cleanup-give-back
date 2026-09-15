import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

/** Filled pause bars for route replay controls. */
export function PauseIcon({ color = '#3E4A3D', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 5H10V19H6V5ZM14 5H18V19H14V5Z" fill={color} />
    </Svg>
  );
}
