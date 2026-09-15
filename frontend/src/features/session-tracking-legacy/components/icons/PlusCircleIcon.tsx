import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored, Heroicons-solid visual family (filled) — see HomeIcon.tsx for
 * rationale. Used for the bottom-nav Track FAB on `dev/HomePlaceholderScreen`.
 */
export function PlusCircleIcon({ color = '#ffffff', size = 24 }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 7v10M7 12h10" stroke={color} strokeWidth={2.25} strokeLinecap="round" />
    </Svg>
  );
}

/** Filled circle backdrop variant, for contexts that don't already provide the green circle fill. */
export function PlusCircleFilledIcon({ color = '#009540', size = 24 }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path d="M12 8v8M8 12h8" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
