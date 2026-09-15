/** Quiet Apple-style lip under the live timer card (optional; disabled when notchWidth ≤ 0). */
export const TIMER_NOTCH_WIDTH = 48;
export const TIMER_NOTCH_HEIGHT = 16;
export const TIMER_NOTCH_FILLET = 4;
export const TIMER_NOTCH_BOTTOM_RADIUS = 6;
export const TIMER_CARD_STROKE_WIDTH = 3;
export const TIMER_CARD_CORNER_RADIUS = 16;

function n(value: number): string {
  return value.toFixed(2);
}

function buildRoundedRectPath({
  x0,
  y0,
  x1,
  y1,
  r,
}: {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r: number;
}): string {
  return [
    `M ${n(x0 + r)} ${n(y0)}`,
    `H ${n(x1 - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x1)} ${n(y0 + r)}`,
    `V ${n(y1 - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x1 - r)} ${n(y1)}`,
    `H ${n(x0 + r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x0)} ${n(y1 - r)}`,
    `V ${n(y0 + r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x0 + r)} ${n(y0)}`,
    'Z',
  ].join(' ');
}

/**
 * Clockwise rounded-rect, optionally with a bottom-center notch + concave fillets.
 * Stroke is centered on the path; inset by half the stroke on every edge so it
 * stays fully inside the SVG viewport (avoids a clipped/thin bottom edge).
 * Pass `notchWidth: 0` for a plain rounded rect with no arrow/tab.
 */
export function buildTimerCardNotchPath({
  width,
  height,
  notchWidth = TIMER_NOTCH_WIDTH,
  notchHeight = TIMER_NOTCH_HEIGHT,
  filletRadius = TIMER_NOTCH_FILLET,
  notchBottomRadius = TIMER_NOTCH_BOTTOM_RADIUS,
  strokeWidth = TIMER_CARD_STROKE_WIDTH,
  cornerRadius = TIMER_CARD_CORNER_RADIUS,
}: {
  width: number;
  height: number;
  notchWidth?: number;
  notchHeight?: number;
  filletRadius?: number;
  notchBottomRadius?: number;
  strokeWidth?: number;
  cornerRadius?: number;
}): string {
  if (width <= 0 || height <= 0) {
    return '';
  }

  const s = strokeWidth / 2;
  const x0 = s;
  const y0 = s;
  const x1 = width - s;
  const y1 = height - s;
  const r = Math.max(0, Math.min(cornerRadius - s, (x1 - x0) / 2, (y1 - y0) / 2));

  // notchWidth ≤ 0 must be a plain card — fillets alone used to leave a tiny arrow.
  if (notchWidth <= 0) {
    return buildRoundedRectPath({ x0, y0, x1, y1, r });
  }

  const cardBottom = y1;
  const notchFloor = height + notchHeight - s;
  const cx = width / 2;
  const half = notchWidth / 2;
  const fr = Math.min(filletRadius, notchHeight / 4);
  const nr = Math.min(
    notchBottomRadius,
    Math.max(0, notchFloor - (cardBottom + fr) - 0.5),
    half,
  );

  const notchFits =
    cx - half - fr > x0 + r &&
    cx + half + fr < x1 - r &&
    notchHeight > fr + nr + s;

  if (!notchFits) {
    return buildRoundedRectPath({ x0, y0, x1, y1, r });
  }

  return [
    `M ${n(x0 + r)} ${n(y0)}`,
    `H ${n(x1 - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x1)} ${n(y0 + r)}`,
    `V ${n(cardBottom - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x1 - r)} ${n(cardBottom)}`,
    `H ${n(cx + half + fr)}`,
    `A ${n(fr)} ${n(fr)} 0 0 0 ${n(cx + half)} ${n(cardBottom + fr)}`,
    `V ${n(notchFloor - nr)}`,
    `A ${n(nr)} ${n(nr)} 0 0 1 ${n(cx + half - nr)} ${n(notchFloor)}`,
    `H ${n(cx - half + nr)}`,
    `A ${n(nr)} ${n(nr)} 0 0 1 ${n(cx - half)} ${n(notchFloor - nr)}`,
    `V ${n(cardBottom + fr)}`,
    `A ${n(fr)} ${n(fr)} 0 0 0 ${n(cx - half - fr)} ${n(cardBottom)}`,
    `H ${n(x0 + r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x0)} ${n(cardBottom - r)}`,
    `V ${n(y0 + r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(x0 + r)} ${n(y0)}`,
    'Z',
  ].join(' ');
}
