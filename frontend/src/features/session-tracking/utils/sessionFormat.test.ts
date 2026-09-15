import {
  computeSessionDurationSeconds,
  countSubmittedCheckpointPhotos,
  formatDurationParts,
  formatRecentSessionDurationLabel,
  formatServiceDurationCompactFromHours,
  formatServiceDurationCompactFromSeconds,
  formatServiceDurationPhraseFromHours,
  formatSessionDurationLabel,
  formatSessionHoursStatValue,
  resolveSessionDurationSeconds,
} from './sessionFormat';

describe('computeSessionDurationSeconds', () => {
  it('returns seconds between timestamps', () => {
    const startedAt = Date.parse('2026-07-13T19:00:00');
    const endedAt = Date.parse('2026-07-13T19:05:00');
    expect(computeSessionDurationSeconds(startedAt, endedAt)).toBe(300);
  });

  it('never returns negative values', () => {
    expect(computeSessionDurationSeconds(1000, 500)).toBe(0);
  });
});

describe('resolveSessionDurationSeconds', () => {
  it('prefers wall-clock timestamps over elapsedSeconds', () => {
    const startedAt = Date.parse('2026-07-13T19:00:00');
    const endedAt = Date.parse('2026-07-13T19:05:00');

    expect(
      resolveSessionDurationSeconds({
        startedAt,
        endedAt,
        elapsedSeconds: 12,
      }),
    ).toBe(300);
  });

  it('falls back to elapsedSeconds when timestamps are missing', () => {
    expect(resolveSessionDurationSeconds({ elapsedSeconds: 90 })).toBe(90);
  });

  it('treats zero elapsedSeconds as valid', () => {
    expect(resolveSessionDurationSeconds({ elapsedSeconds: 0 })).toBe(0);
  });
});

describe('formatSessionDurationLabel', () => {
  it('formats a five-minute session', () => {
    expect(formatSessionDurationLabel(300)).toBe('5m');
  });

  it('rounds sub-minute sessions of at least 30 seconds up to 1m', () => {
    expect(formatSessionDurationLabel(45)).toBe('1m');
  });

  it('shows 0m for sessions under 30 seconds', () => {
    expect(formatSessionDurationLabel(20)).toBe('0m');
  });

  it('formats hours and minutes', () => {
    expect(formatSessionDurationLabel(5040)).toBe('1h 24m');
  });
});

describe('formatDurationParts', () => {
  it('splits hours and minutes', () => {
    expect(formatDurationParts(5040)).toEqual({ hours: 1, minutes: 24 });
  });
});

describe('formatServiceDurationCompactFromSeconds', () => {
  it('uses minutes below one hour', () => {
    expect(formatServiceDurationCompactFromSeconds(2160)).toBe('36 min');
  });

  it('uses decimal hours at or above one hour', () => {
    expect(formatServiceDurationCompactFromSeconds(9000)).toBe('2.5 hrs');
  });

  it('shows 0 min for zero seconds', () => {
    expect(formatServiceDurationCompactFromSeconds(0)).toBe('0 min');
  });
});

describe('formatServiceDurationCompactFromHours', () => {
  it('uses minutes below one hour', () => {
    expect(formatServiceDurationCompactFromHours(0.6)).toBe('36 min');
  });

  it('uses decimal hours at or above one hour', () => {
    expect(formatServiceDurationCompactFromHours(2.5)).toBe('2.5 hrs');
  });
});

describe('formatServiceDurationPhraseFromHours', () => {
  it('uses minutes below one hour', () => {
    expect(formatServiceDurationPhraseFromHours(0.6)).toBe('36 minutes');
    expect(formatServiceDurationPhraseFromHours(1 / 60)).toBe('1 minute');
  });

  it('uses hours at or above one hour', () => {
    expect(formatServiceDurationPhraseFromHours(1)).toBe('1 hour');
    expect(formatServiceDurationPhraseFromHours(2)).toBe('2 hours');
  });
});

describe('formatSessionHoursStatValue', () => {
  it('uses MINUTES below one hour', () => {
    expect(formatSessionHoursStatValue(2160)).toEqual({ value: '36', unitLabel: 'MINUTES' });
  });

  it('uses HOURS at or above one hour', () => {
    expect(formatSessionHoursStatValue(9000)).toEqual({ value: '2.5', unitLabel: 'HOURS' });
  });
});

describe('formatRecentSessionDurationLabel', () => {
  it('formats sub-hour sessions in minutes', () => {
    expect(formatRecentSessionDurationLabel(2160)).toBe('36 min');
  });

  it('formats hour-plus sessions in decimal hours', () => {
    expect(formatRecentSessionDurationLabel(9000)).toBe('2.5 hrs');
  });

  it('shows 0 min for zero seconds', () => {
    expect(formatRecentSessionDurationLabel(0)).toBe('0 min');
  });
});

describe('countSubmittedCheckpointPhotos', () => {
  it('counts selfie and rear as two photos', () => {
    expect(
      countSubmittedCheckpointPhotos([
        { selfieUri: 'selfie.jpg', progressUri: 'progress.jpg' },
      ]),
    ).toBe(2);
  });

  it('counts only present uris', () => {
    expect(countSubmittedCheckpointPhotos([{ selfieUri: 'selfie.jpg' }])).toBe(1);
    expect(countSubmittedCheckpointPhotos([{}])).toBe(0);
  });

  it('start + end pairs meet the 4-photo minimum', () => {
    const startOnly = [{ selfieUri: 'a.jpg', progressUri: 'b.jpg' }];
    expect(countSubmittedCheckpointPhotos(startOnly)).toBe(2);
    const startAndEnd = [
      ...startOnly,
      { selfieUri: 'c.jpg', progressUri: 'd.jpg' },
    ];
    expect(countSubmittedCheckpointPhotos(startAndEnd)).toBe(4);
  });
});
