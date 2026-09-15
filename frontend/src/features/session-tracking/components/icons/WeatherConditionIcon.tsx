import Svg, { Path } from 'react-native-svg';

import {
  WEATHER_ICON_PATHS,
  WEATHER_ICON_VIEWBOX,
  type WeatherIconKey,
} from '../../utils/weatherIconPaths';

type Props = {
  condition: WeatherIconKey;
  color?: string;
  size?: number;
};

/**
 * Live-tracker weather glyph — Weather Icons (react-icons/wi), scaled to the
 * Figma extract viewBox (0 0 24 24) for consistent weight with other chrome icons.
 */
export function WeatherConditionIcon({
  condition,
  color = '#3E4A3D',
  size = 18,
}: Props) {
  const key = condition in WEATHER_ICON_PATHS ? condition : 'sunny';
  const d = WEATHER_ICON_PATHS[key];

  return (
    <Svg width={size} height={size} viewBox={WEATHER_ICON_VIEWBOX} fill="none">
      <Path d={d} fill={color} />
    </Svg>
  );
}
