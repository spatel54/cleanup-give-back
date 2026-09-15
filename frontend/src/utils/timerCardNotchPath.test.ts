import {
  TIMER_CARD_STROKE_WIDTH,
  TIMER_NOTCH_HEIGHT,
  TIMER_NOTCH_WIDTH,
  buildTimerCardNotchPath,
} from './timerCardNotchPath';

describe('buildTimerCardNotchPath', () => {
  it('returns an empty path when the card has no size', () => {
    expect(buildTimerCardNotchPath({ width: 0, height: 80 })).toBe('');
    expect(buildTimerCardNotchPath({ width: 320, height: 0 })).toBe('');
  });

  it('draws a closed clockwise card with a centered bottom notch', () => {
    const width = 320;
    const height = 88;
    const path = buildTimerCardNotchPath({ width, height });
    const halfStroke = TIMER_CARD_STROKE_WIDTH / 2;
    const cardBottom = height - halfStroke;

    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith(' Z')).toBe(true);
    expect(path).toContain(`H ${(width / 2 + TIMER_NOTCH_WIDTH / 2 + 4).toFixed(2)}`);
    expect(path).toContain(` ${(height + TIMER_NOTCH_HEIGHT - halfStroke).toFixed(2)}`);
    // Left fillet lands on the inset card bottom (not a raw `H` — arc endpoint).
    expect(path).toContain(
      ` ${(width / 2 - TIMER_NOTCH_WIDTH / 2 - 4).toFixed(2)} ${cardBottom.toFixed(2)}`,
    );
  });

  it('draws a plain inset rounded rect when notchWidth is 0 (no arrow)', () => {
    const width = 320;
    const height = 88;
    const halfStroke = TIMER_CARD_STROKE_WIDTH / 2;
    const path = buildTimerCardNotchPath({ width, height, notchWidth: 0 });

    expect(path).toContain('Z');
    // No concave fillet / notch arcs (sweep-flag 0 into the notch).
    expect(path).not.toContain('A 4.00 4.00 0 0 0');
    // Bottom edge is inset so the full stroke stays inside the SVG.
    expect(path).toContain(` ${(height - halfStroke).toFixed(2)}`);
    expect(path).not.toContain(` ${height.toFixed(2)}`);
  });

  it('falls back to a rounded rect when the card is too narrow for a notch', () => {
    const path = buildTimerCardNotchPath({ width: 40, height: 40 });

    expect(path).toContain('Z');
    expect(path).not.toContain('A 4.00 4.00 0 0 0');
  });
});
