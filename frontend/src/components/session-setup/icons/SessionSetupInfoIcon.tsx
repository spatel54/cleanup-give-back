import Svg, { Path } from 'react-native-svg';

type Props = {
  color?: string;
  size?: number;
};

/**
 * Ported from `assets/figma/session-setup/info-circle.svg`
 * (Figma 260:1312 permissions header).
 */
export function SessionSetupInfoIcon({ color = '#3E4A3D', size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9 1.6875C4.96055 1.6875 1.6875 4.96055 1.6875 9C1.6875 13.0395 4.96055 16.3125 9 16.3125C13.0395 16.3125 16.3125 13.0395 16.3125 9C16.3125 4.96055 13.0395 1.6875 9 1.6875ZM9.66797 12.375H8.325V7.30898H9.66797V12.375ZM8.99648 6.75703C8.59922 6.75703 8.27578 6.45469 8.27578 6.05391C8.27578 5.65312 8.60273 5.3543 8.99648 5.3543C9.39727 5.3543 9.72422 5.65312 9.72422 6.05391C9.72422 6.45469 9.39727 6.75703 8.99648 6.75703Z"
        fill={color}
      />
    </Svg>
  );
}
