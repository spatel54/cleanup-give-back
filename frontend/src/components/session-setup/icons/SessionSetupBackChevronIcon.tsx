import Svg, { Path } from 'react-native-svg';

type Props = {
  color?: string;
  width?: number;
  height?: number;
};

/** Figma `260:1497` back chevron for session setup TopAppBar (`260:1392`). */
export function SessionSetupBackChevronIcon({
  color = '#1C1B1B',
  width = 8.485,
  height = 14.142,
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 8.48531 14.1421" fill="none">
      <Path
        d="M8.48521 1.41421L7.07101 0L0 7.07104L7.07111 14.1421L8.48531 12.7279L2.82841 7.07104L8.48521 1.41421Z"
        fill={color}
      />
    </Svg>
  );
}
