import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

/**
 * Hand-authored, Heroicons-solid visual family (filled, celebratory contexts) —
 * see HomeIcon.tsx for rationale. Used by PhotoSubmittedScreen and
 * SubmissionConfirmationScreen's checkmark-pop animation.
 */
export function CheckCircleIcon({ color = '#009540', size = 24 }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path
        d="M8 12.5l2.75 2.75L16.5 9"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
