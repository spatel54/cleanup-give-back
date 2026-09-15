import Svg, { Path } from 'react-native-svg';
import type { NavIconProps } from './types';

/**
 * Ported from `frontend/assets/figma/home-screen/nav/home.svg`
 * (Figma node 566:395, file DrDcQH14n7ntDQ80F7au9S).
 */
export function NavHomeIcon({ color = '#009540', width = 23, height = 22 }: NavIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 23 22" fill="none">
      <Path
        d="M9.2 22V14.2353H13.8V22H19.55V11.6471H23L11.5 0L0 11.6471H3.45V22H9.2Z"
        fill={color}
      />
    </Svg>
  );
}
