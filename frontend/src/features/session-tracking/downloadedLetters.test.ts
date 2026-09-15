import {
  formatLetterDate,
  formatLetterDateRange,
  formatLetterSubtitle,
  parseDownloadedLetter,
  uniqueRemoteSessionIdsFromLetters,
  type DownloadedLetter,
} from './downloadedLetters';

function letter(partial: Partial<DownloadedLetter> & Pick<DownloadedLetter, 'id' | 'sessionIds'>): DownloadedLetter {
  return {
    title: 'Service letter',
    subtitle: 'Apr 12, 2026 · 2.0 hrs',
    downloadedAtMs: Date.parse('2026-04-12T12:00:00'),
    fileUri: 'file://letter.pdf',
    filename: 'letter.pdf',
    sessionDatesMs: [],
    totalDurationSeconds: 7200,
    ...partial,
  };
}

describe('formatLetterDate', () => {
  it('uses a short month day year', () => {
    expect(formatLetterDate(new Date(2026, 3, 12).getTime())).toBe('Apr 12, 2026');
  });
});

describe('formatLetterDateRange', () => {
  it('returns a single date when all sessions are the same day', () => {
    const day = new Date(2026, 3, 12, 9).getTime();
    const later = new Date(2026, 3, 12, 16).getTime();
    expect(formatLetterDateRange([later, day])).toBe('Apr 12, 2026');
  });

  it('spans earliest to latest when days differ in the same year', () => {
    expect(
      formatLetterDateRange([new Date(2026, 3, 12).getTime(), new Date(2026, 2, 3).getTime()]),
    ).toBe('Mar 3 – Apr 12, 2026');
  });

  it('keeps both years when the range crosses a year', () => {
    expect(
      formatLetterDateRange([
        new Date(2025, 11, 28).getTime(),
        new Date(2026, 0, 4).getTime(),
      ]),
    ).toBe('Dec 28, 2025 – Jan 4, 2026');
  });
});

describe('formatLetterSubtitle', () => {
  it('formats a single session as date · hours', () => {
    expect(formatLetterSubtitle([new Date(2026, 3, 12).getTime()], 7200)).toBe(
      'Apr 12, 2026 · 2.0 hrs',
    );
  });

  it('sums hours across a multi-day letter', () => {
    expect(
      formatLetterSubtitle(
        [new Date(2026, 2, 3).getTime(), new Date(2026, 3, 12).getTime()],
        7200 + 5400,
      ),
    ).toBe('Mar 3 – Apr 12, 2026 · 3.5 hrs');
  });

  it('falls back to the download date when no session dates exist', () => {
    expect(formatLetterSubtitle([], 0, new Date(2026, 3, 12).getTime())).toBe(
      'Apr 12, 2026 · 0 min',
    );
  });
});

describe('uniqueRemoteSessionIdsFromLetters', () => {
  it('dedupes remote ids and skips local snapshot ids', () => {
    expect(
      uniqueRemoteSessionIdsFromLetters([
        letter({
          id: 'a',
          sessionIds: ['8f1c2a3b-4d5e-6789-abcd-ef0123456789', 'local-1'],
        }),
        letter({
          id: 'b',
          sessionIds: ['8f1c2a3b-4d5e-6789-abcd-ef0123456789', '9f1c2a3b-4d5e-6789-abcd-ef0123456789'],
        }),
      ]),
    ).toEqual([
      '8f1c2a3b-4d5e-6789-abcd-ef0123456789',
      '9f1c2a3b-4d5e-6789-abcd-ef0123456789',
    ]);
  });
});

describe('parseDownloadedLetter', () => {
  it('returns null for incomplete rows', () => {
    expect(parseDownloadedLetter({ id: 'x' })).toBeNull();
  });

  it('rebuilds subtitle when missing', () => {
    const parsed = parseDownloadedLetter({
      id: 'letter-1',
      fileUri: 'file://a.pdf',
      filename: 'a.pdf',
      downloadedAtMs: new Date(2026, 3, 12).getTime(),
      sessionIds: ['abc'],
      sessionDatesMs: [new Date(2026, 3, 12).getTime()],
      totalDurationSeconds: 7200,
    });
    expect(parsed?.title).toBe('Service letter');
    expect(parsed?.subtitle).toBe('Apr 12, 2026 · 2.0 hrs');
  });
});
