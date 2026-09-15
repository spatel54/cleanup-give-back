import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

/** Skip orientation — live tracker primary CTA (filled skip-next, centered in 24×24). */
export function TrackerSkipOrientationIcon({ color = '#FCF9F8', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 6v12l8.5-6L7 6zm9 0v12h2V6h-2z"
        fill={color}
      />
    </Svg>
  );
}
