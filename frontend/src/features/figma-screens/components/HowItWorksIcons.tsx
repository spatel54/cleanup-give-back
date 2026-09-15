import Svg, { Path } from 'react-native-svg';

type Props = {
  color?: string;
  size?: number;
};

/** Compass / navigate — Track your cleanup. */
export function HowItWorksTrackIcon({ color = '#009540', size = 22 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.59 7.58L10.35 10.35L7.58 16.59L13.82 13.82L16.59 7.58ZM12.16 12.16L13.45 11.71L12.45 10.55L12.16 12.16Z"
        fill={color}
      />
    </Svg>
  );
}

/** Camera — Checkpoint photos. */
export function HowItWorksCameraIcon({ color = '#009540', size = 22 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 5H16.83L15.59 3.65C15.22 3.24 14.68 3 14.12 3H9.88C9.32 3 8.78 3.24 8.4 3.65L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM20 19H4V7H8.05L9.4 5.5H14.6L15.95 7H20V19ZM12 9C10.07 9 8.5 10.57 8.5 12.5C8.5 14.43 10.07 16 12 16C13.93 16 15.5 14.43 15.5 12.5C15.5 10.57 13.93 9 12 9ZM12 14C11.17 14 10.5 13.33 10.5 12.5C10.5 11.67 11.17 11 12 11C12.83 11 13.5 11.67 13.5 12.5C13.5 13.33 12.83 14 12 14Z"
        fill={color}
      />
    </Svg>
  );
}

/** Document — Review and letters. */
export function HowItWorksLetterIcon({ color = '#009540', size = 22 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z"
        fill={color}
      />
    </Svg>
  );
}

/** Key — Unlimited tracking (user-provided glyph). */
export function HowItWorksKeyIcon({ color = '#009540', size = 22 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.7583 11.828L18.6073 3.979L20.0213 5.393L18.6073 6.808L21.0813 9.282L19.6673 10.697L17.1923 8.222L15.7783 9.636L17.8993 11.757L16.4853 13.172L14.3643 11.05L12.1723 13.242C12.8527 14.276 13.1256 15.5256 12.9382 16.7491C12.7508 17.9727 12.1163 19.0832 11.1576 19.8661C10.1988 20.649 8.98377 21.0486 7.74746 20.9876C6.51115 20.9267 5.34136 20.4094 4.46428 19.536C3.58531 18.6603 3.06331 17.4891 2.99974 16.25C2.93616 15.0109 3.33556 13.7925 4.12029 12.8314C4.90503 11.8704 6.01905 11.2354 7.24584 11.05C8.47263 10.8646 9.72455 11.1419 10.7583 11.828ZM10.1213 18.121C10.4126 17.8455 10.6457 17.5143 10.8069 17.1471C10.968 16.7799 11.0539 16.3842 11.0595 15.9832C11.0651 15.5823 10.9902 15.1843 10.8393 14.8128C10.6885 14.4412 10.4646 14.1037 10.1811 13.8202C9.89755 13.5367 9.56005 13.3128 9.18852 13.162C8.817 13.0111 8.419 12.9362 8.01806 12.9418C7.61711 12.9474 7.22135 13.0333 6.85416 13.1944C6.48698 13.3556 6.15583 13.5887 5.88028 13.88C5.33381 14.4458 5.03143 15.2036 5.03826 15.9902C5.0451 16.7768 5.3606 17.5292 5.91683 18.0855C6.47305 18.6417 7.22549 18.9572 8.01208 18.964C8.79867 18.9709 9.55648 18.6685 10.1223 18.122L10.1213 18.121Z"
        fill={color}
      />
    </Svg>
  );
}

/** Check mark for the terms checkbox. */
export function HowItWorksCheckIcon({ color = '#FFFFFF', size = 14 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.00016 16.17L4.83016 12L3.41016 13.41L9.00016 19L21.0002 7L19.5902 5.59L9.00016 16.17Z"
        fill={color}
      />
    </Svg>
  );
}
