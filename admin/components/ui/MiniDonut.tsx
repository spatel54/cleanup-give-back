/**
 * Compact SVG donut for metric tiles — no recharts, safe on the server.
 * Single-ring composition (2–4 slices). Empty / zero-total renders a muted ring.
 */

export type MiniDonutSlice = {
  value: number;
  color: string;
  /** Optional for screen readers when ariaLabel is not set on the chart. */
  label?: string;
};

type Props = {
  slices: MiniDonutSlice[];
  size?: number;
  thickness?: number;
  className?: string;
  ariaLabel?: string;
  /** Soft track behind the filled arcs (empty remainder). */
  trackColor?: string;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const sweep = endDeg - startDeg;
  if (sweep <= 0) return '';
  // Full circle can't be drawn as one arc — split at halfway.
  if (sweep >= 359.9) {
    const mid = startDeg + 180;
    const a = polar(cx, cy, r, startDeg);
    const b = polar(cx, cy, r, mid);
    const c = polar(cx, cy, r, startDeg + 360);
    return [
      `M ${a.x} ${a.y}`,
      `A ${r} ${r} 0 1 1 ${b.x} ${b.y}`,
      `A ${r} ${r} 0 1 1 ${c.x} ${c.y}`,
    ].join(' ');
  }
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

export function MiniDonut({
  slices,
  size = 52,
  thickness = 7,
  className = '',
  ariaLabel,
  trackColor = '#e8e6e1',
}: Props) {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - thickness / 2 - 0.5;

  const label =
    ariaLabel ??
    (total > 0
      ? slices
          .filter((s) => s.value > 0 && s.label)
          .map((s) => `${s.label}: ${s.value}`)
          .join(', ') || 'Composition chart'
      : 'No data');

  let angle = 0;
  const arcs =
    total > 0
      ? slices
          .filter((s) => s.value > 0)
          .map((s) => {
            const sweep = (s.value / total) * 360;
            const start = angle;
            const end = angle + sweep;
            angle = end;
            return { ...s, start, end, d: arcPath(cx, cy, r, start, end) };
          })
      : [];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={label}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={thickness}
      />
      {arcs.map((a, i) => (
        <path
          key={`${a.color}-${i}`}
          d={a.d}
          fill="none"
          stroke={a.color}
          strokeWidth={thickness}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}
