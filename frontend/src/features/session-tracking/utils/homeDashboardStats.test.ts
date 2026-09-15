import {
  buildWeeklyHoursChart,
  computeWeeklyStreakHours,
  approvedSessionDateBounds,
  approvedSessionDateKeys,
  countExportMatchingSessions,
  filterExportMatchingSessions,
  hasApprovedSessions,
  snapToApprovedSessionDate,
  isRemoteSessionId,
  formatChartHourLabel,
  formatChartYAxisTickLabel,
  chartYAxisAccessibilityLabel,
  formatLifetimeServiceHoursValue,
  formatImpactPlacesCopy,
  formatImpactHoursPhrase,
  formatImpactMonthSentence,
  buildImpactYearOptions,
  buildImpactMonthOptionsForYear,
  buildImpactMonthSummary,
  parseImpactMonthInput,
  parseImpactYearInput,
  buildImpactMonthSummaries,
  formatWeekServiceHoursTotal,
  formatWeeklyHoursBadgeCopy,
  type SessionStatRecord,
} from './homeDashboardStats';

const MONDAY_JULY_13_2026 = '2026-07-13';

function stat(
  overrides: Partial<SessionStatRecord> & Pick<SessionStatRecord, 'id' | 'startedAtMs' | 'durationSeconds'>,
): SessionStatRecord {
  return {
    distanceMiles: 0,
    photoCount: 0,
    locationLabel: 'Park',
    status: 'pending',
    ...overrides,
  };
}

describe('buildWeeklyHoursChart', () => {
  it('buckets completed sessions into hour values by weekday', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
      stat({
        id: 's2',
        startedAtMs: Date.parse('2026-07-16T15:00:00'),
        durationSeconds: 1800,
      }),
    ];

    const chart = buildWeeklyHoursChart(stats, MONDAY_JULY_13_2026);

    expect(chart.find((day) => day.day === 'Tue')?.value).toBe(1.5);
    expect(chart.find((day) => day.day === 'Thu')?.value).toBe(0.5);
    expect(chart.find((day) => day.day === 'Mon')?.value).toBe(0);
  });

  it('excludes declined sessions and other weeks', () => {
    const stats = [
      stat({
        id: 'declined',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        status: 'declined',
      }),
      stat({
        id: 'other-week',
        startedAtMs: Date.parse('2026-07-07T10:00:00'),
        durationSeconds: 3600,
      }),
    ];

    const chart = buildWeeklyHoursChart(stats, MONDAY_JULY_13_2026);
    expect(chart.every((day) => day.value === 0)).toBe(true);
  });
});

describe('formatLifetimeServiceHoursValue', () => {
  it('sums non-declined session durations at one decimal place', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
      stat({
        id: 's2',
        startedAtMs: Date.parse('2026-07-16T15:00:00'),
        durationSeconds: 1800,
        status: 'approved',
      }),
      stat({
        id: 'declined',
        startedAtMs: Date.parse('2026-07-15T10:00:00'),
        durationSeconds: 3600,
        status: 'declined',
      }),
    ];

    expect(formatLifetimeServiceHoursValue(stats)).toBe('2.0');
  });

  it('returns 0.0 when there are no qualifying sessions', () => {
    expect(formatLifetimeServiceHoursValue([])).toBe('0.0');
  });
});

describe('formatWeekServiceHoursTotal', () => {
  it('uses minutes below one hour', () => {
    expect(formatWeekServiceHoursTotal(
      [
        stat({
          id: 's1',
          startedAtMs: Date.parse('2026-07-14T10:00:00'),
          durationSeconds: 2160,
        }),
      ],
      MONDAY_JULY_13_2026,
    )).toBe('36 min');
  });

  it('sums chart hours for the selected week', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
      stat({
        id: 's2',
        startedAtMs: Date.parse('2026-07-16T15:00:00'),
        durationSeconds: 1800,
      }),
    ];

    expect(formatWeekServiceHoursTotal(stats, MONDAY_JULY_13_2026)).toBe('2.0 hrs');
  });
});

describe('formatChartHourLabel', () => {
  it('formats hours as an integer with no units', () => {
    expect(formatChartHourLabel(2)).toBe('2');
    expect(formatChartHourLabel(1.5)).toBe('2');
    expect(formatChartHourLabel(0)).toBe('0');
  });

  it('formats minute-scale buckets as an integer with no units', () => {
    expect(formatChartHourLabel(0.6, true)).toBe('36');
  });
});

describe('formatChartYAxisTickLabel', () => {
  it('shows minutes on minute-scale ticks', () => {
    expect(formatChartYAxisTickLabel(0, true)).toBe('0');
    expect(formatChartYAxisTickLabel(15, true)).toBe('15 min');
    expect(formatChartYAxisTickLabel(45, true)).toBe('45 min');
  });

  it('shows hours on hour-scale ticks with pluralization', () => {
    expect(formatChartYAxisTickLabel(0, false)).toBe('0');
    expect(formatChartYAxisTickLabel(1, false)).toBe('1 hr');
    expect(formatChartYAxisTickLabel(2, false)).toBe('2 hrs');
    expect(formatChartYAxisTickLabel(1.5, false)).toBe('1.5 hrs');
  });
});

describe('chartYAxisAccessibilityLabel', () => {
  it('names the axis unit for screen readers', () => {
    expect(chartYAxisAccessibilityLabel(false)).toBe(
      'Weekly service time chart. Vertical axis in hours, Monday through Sunday.',
    );
    expect(chartYAxisAccessibilityLabel(true)).toBe(
      'Weekly service time chart. Vertical axis in minutes, Monday through Sunday.',
    );
  });
});

describe('computeWeeklyStreakHours', () => {
  const wednesdayInWeek = new Date(2026, 6, 15);

  it('matches the current-week chart total without integer rounding', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
      stat({
        id: 's2',
        startedAtMs: Date.parse('2026-07-16T15:00:00'),
        durationSeconds: 1800,
      }),
    ];

    expect(computeWeeklyStreakHours(stats, wednesdayInWeek)).toBe(2);
    expect(formatWeekServiceHoursTotal(stats, MONDAY_JULY_13_2026)).toBe('2.0 hrs');
  });

  it('keeps one-decimal hours instead of rounding 1.5 up to 2', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
    ];

    expect(computeWeeklyStreakHours(stats, wednesdayInWeek)).toBe(1.5);
  });

  it('keeps sub-hour weeks visible instead of rounding 0.4 down to 0', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 1440,
      }),
    ];

    expect(computeWeeklyStreakHours(stats, wednesdayInWeek)).toBe(0.4);
  });

  it('excludes declined sessions and other weeks', () => {
    const stats = [
      stat({
        id: 'declined',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        status: 'declined',
      }),
      stat({
        id: 'other-week',
        startedAtMs: Date.parse('2026-07-07T10:00:00'),
        durationSeconds: 3600,
      }),
    ];

    expect(computeWeeklyStreakHours(stats, wednesdayInWeek)).toBe(0);
  });
});

describe('formatWeeklyHoursBadgeCopy', () => {
  it('pluralizes and keeps tenths', () => {
    expect(formatWeeklyHoursBadgeCopy(1)).toBe('1 hour this week. Keep it up!');
    expect(formatWeeklyHoursBadgeCopy(1.5)).toBe('1.5 hours this week. Keep it up!');
    expect(formatWeeklyHoursBadgeCopy(2)).toBe('2 hours this week. Keep it up!');
  });

  it('uses minutes below one hour', () => {
    expect(formatWeeklyHoursBadgeCopy(0.4)).toBe('24 minutes this week. Keep it up!');
  });
});

describe('formatImpactPlacesCopy', () => {
  it('returns empty when there are no named places', () => {
    expect(formatImpactPlacesCopy([])).toBe('');
    expect(
      formatImpactPlacesCopy([
        stat({
          id: 'unknown',
          startedAtMs: Date.parse('2026-07-14T10:00:00'),
          durationSeconds: 3600,
          locationLabel: 'Unknown',
        }),
      ]),
    ).toBe('');
  });

  it('names one, two, and three-plus unique places', () => {
    const lake = stat({
      id: 's1',
      startedAtMs: Date.parse('2026-07-14T10:00:00'),
      durationSeconds: 3600,
      locationLabel: 'Lake Park, Example City, IL',
    });
    const river = stat({
      id: 's2',
      startedAtMs: Date.parse('2026-07-15T10:00:00'),
      durationSeconds: 3600,
      locationLabel: 'River Trail',
    });
    const oakton = stat({
      id: 's3',
      startedAtMs: Date.parse('2026-07-16T10:00:00'),
      durationSeconds: 3600,
      locationLabel: 'Oakton Park',
    });

    expect(formatImpactPlacesCopy([lake])).toBe("You've cleaned up at Lake Park.");
    expect(formatImpactPlacesCopy([lake, river])).toBe(
      "You've cleaned up at Lake Park and River Trail.",
    );
    expect(formatImpactPlacesCopy([lake, river, oakton])).toBe(
      "You've cleaned up at Lake Park, River Trail, and 1 other place.",
    );
  });

  it('skips declined sessions and duplicate labels', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        locationLabel: 'Lake Park',
      }),
      stat({
        id: 'dup',
        startedAtMs: Date.parse('2026-07-15T10:00:00'),
        durationSeconds: 3600,
        locationLabel: 'lake park',
      }),
      stat({
        id: 'declined',
        startedAtMs: Date.parse('2026-07-16T10:00:00'),
        durationSeconds: 3600,
        locationLabel: 'Oakton Park',
        status: 'declined',
      }),
    ];

    expect(formatImpactPlacesCopy(stats)).toBe("You've cleaned up at Lake Park.");
  });
});

describe('formatImpactHoursPhrase', () => {
  it('pluralizes and keeps tenths', () => {
    expect(formatImpactHoursPhrase(0)).toBe('0 minutes');
    expect(formatImpactHoursPhrase(0.6)).toBe('36 minutes');
    expect(formatImpactHoursPhrase(1)).toBe('1 hour');
    expect(formatImpactHoursPhrase(2)).toBe('2 hours');
  });
});

describe('formatImpactMonthSentence', () => {
  it('builds the In {month} sentence', () => {
    expect(
      formatImpactMonthSentence({
        monthKey: '2026-08',
        monthLabel: 'August',
        placeCount: 2,
        hours: 0.6,
      }),
    ).toBe('In August 2026, you cleaned up 2 places for a total of 36 minutes.');
    expect(
      formatImpactMonthSentence({
        monthKey: '2026-07',
        monthLabel: 'July',
        placeCount: 1,
        hours: 1,
      }),
    ).toBe('In July 2026, you cleaned up 1 place for a total of 1 hour.');
  });
});

describe('buildImpactYearOptions', () => {
  const now = new Date(2026, 7, 16);

  it('returns one hundred years newest-first, independent of session history', () => {
    const years = buildImpactYearOptions(now);
    expect(years).toHaveLength(100);
    expect(years[0]).toBe(2026);
    expect(years[years.length - 1]).toBe(1927);
    expect(years.every((year) => year <= 2026)).toBe(true);
    expect(years).not.toContain(2027);
  });
});

describe('buildImpactMonthOptionsForYear', () => {
  it('returns all twelve months for a year', () => {
    const options = buildImpactMonthOptionsForYear(2026);
    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ monthKey: '2026-01', monthLabel: 'January' });
    expect(options[11]).toEqual({ monthKey: '2026-12', monthLabel: 'December' });
  });
});

describe('parseImpactMonthInput', () => {
  it('accepts month numbers and names', () => {
    expect(parseImpactMonthInput('8')).toBe(8);
    expect(parseImpactMonthInput('August')).toBe(8);
    expect(parseImpactMonthInput('aug')).toBe(8);
  });

  it('rejects invalid input', () => {
    expect(parseImpactMonthInput('')).toBeNull();
    expect(parseImpactMonthInput('13')).toBeNull();
    expect(parseImpactMonthInput('NotAMonth')).toBeNull();
  });
});

describe('parseImpactYearInput', () => {
  it('accepts four-digit years in range', () => {
    expect(parseImpactYearInput('2026', 2024, 2026)).toBe(2026);
  });

  it('rejects out-of-range or partial years', () => {
    expect(parseImpactYearInput('2023', 2024, 2026)).toBeNull();
    expect(parseImpactYearInput('26', 2024, 2026)).toBeNull();
  });
});

describe('buildImpactMonthSummary', () => {
  it('returns zero totals for months without sessions', () => {
    expect(
      buildImpactMonthSummary(
        [
          stat({
            id: 'aug',
            startedAtMs: Date.parse('2026-08-10T10:00:00'),
            durationSeconds: 2160,
            locationLabel: 'Lake Park',
          }),
        ],
        '2026-01',
      ),
    ).toMatchObject({
      monthKey: '2026-01',
      monthLabel: 'January',
      placeCount: 0,
      hours: 0,
    });
  });
});

describe('buildImpactMonthSummaries', () => {
  const now = new Date(2026, 7, 16);

  it('includes the current month and aggregates places and hours newest first', () => {
    const summaries = buildImpactMonthSummaries(
      [
        stat({
          id: 'aug',
          startedAtMs: Date.parse('2026-08-10T10:00:00'),
          durationSeconds: 2160,
          locationLabel: 'Lake Park',
        }),
        stat({
          id: 'jul',
          startedAtMs: Date.parse('2026-07-15T10:00:00'),
          durationSeconds: 9000,
          locationLabel: 'River Trail',
        }),
        stat({
          id: 'declined',
          startedAtMs: Date.parse('2026-07-20T10:00:00'),
          durationSeconds: 3600,
          locationLabel: 'Oakton Park',
          status: 'declined',
        }),
      ],
      now,
    );

    expect(summaries.map((summary) => summary.monthKey)).toEqual(['2026-08', '2026-07']);
    expect(summaries[0]).toMatchObject({
      monthLabel: 'August',
      placeCount: 1,
      hours: 0.6,
    });
    expect(summaries[1]).toMatchObject({
      monthLabel: 'July',
      placeCount: 1,
      hours: 2.5,
    });
  });
});

describe('countExportMatchingSessions', () => {
  const start = new Date(2026, 6, 1);
  const end = new Date(2026, 6, 31);

  it('counts sessions inside the inclusive date range with selected statuses', () => {
    const stats = [
      stat({
        id: 'approved',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        status: 'approved',
      }),
      stat({
        id: 'pending',
        startedAtMs: Date.parse('2026-07-20T10:00:00'),
        durationSeconds: 3600,
        status: 'pending',
      }),
      stat({
        id: 'declined',
        startedAtMs: Date.parse('2026-07-22T10:00:00'),
        durationSeconds: 3600,
        status: 'declined',
      }),
      stat({
        id: 'outside',
        startedAtMs: Date.parse('2026-08-02T10:00:00'),
        durationSeconds: 3600,
        status: 'approved',
      }),
    ];

    expect(
      countExportMatchingSessions(stats, start, end, {
        approved: true,
        pending: true,
        declined: false,
      }),
    ).toBe(2);
  });

  it('returns 0 when no statuses are selected', () => {
    const stats = [
      stat({
        id: 'approved',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        status: 'approved',
      }),
    ];

    expect(
      countExportMatchingSessions(stats, start, end, {
        approved: false,
        pending: false,
        declined: false,
      }),
    ).toBe(0);
  });
});

describe('filterExportMatchingSessions', () => {
  it('returns approved sessions inside the inclusive date range', () => {
    const start = new Date(2026, 6, 1);
    const end = new Date(2026, 6, 31);
    const matches = filterExportMatchingSessions(
      [
        stat({
          id: 'approved',
          startedAtMs: Date.parse('2026-07-14T10:00:00'),
          durationSeconds: 3600,
          status: 'approved',
        }),
        stat({
          id: 'pending',
          startedAtMs: Date.parse('2026-07-20T10:00:00'),
          durationSeconds: 3600,
          status: 'pending',
        }),
      ],
      start,
      end,
    );

    expect(matches.map((session) => session.id)).toEqual(['approved']);
  });
});

describe('hasApprovedSessions / approvedSessionDateBounds', () => {
  it('detects approved sessions and defaults the range to earliest through latest approved day', () => {
    const stats = [
      stat({
        id: 'first',
        startedAtMs: Date.parse('2026-03-04T15:00:00'),
        durationSeconds: 3600,
        status: 'approved',
      }),
      stat({
        id: 'later',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        status: 'approved',
      }),
      stat({
        id: 'pending',
        startedAtMs: Date.parse('2026-01-01T10:00:00'),
        durationSeconds: 3600,
        status: 'pending',
      }),
    ];

    expect(hasApprovedSessions(stats)).toBe(true);
    const bounds = approvedSessionDateBounds(stats);
    expect(bounds).not.toBeNull();
    expect(bounds?.start.getFullYear()).toBe(2026);
    expect(bounds?.start.getMonth()).toBe(2);
    expect(bounds?.start.getDate()).toBe(4);
    expect(bounds?.end.getFullYear()).toBe(2026);
    expect(bounds?.end.getMonth()).toBe(6);
    expect(bounds?.end.getDate()).toBe(14);
    expect([...approvedSessionDateKeys(stats)].sort()).toEqual(['2026-03-04', '2026-07-14']);
    expect(snapToApprovedSessionDate(new Date(2026, 4, 1), approvedSessionDateKeys(stats), 'start')?.getDate()).toBe(14);
    expect(snapToApprovedSessionDate(new Date(2026, 4, 1), approvedSessionDateKeys(stats), 'end')?.getMonth()).toBe(2);
  });

  it('returns null bounds when nothing is approved', () => {
    expect(hasApprovedSessions([])).toBe(false);
    expect(approvedSessionDateBounds([])).toBeNull();
  });
});

describe('isRemoteSessionId', () => {
  it('rejects local snapshot ids', () => {
    expect(isRemoteSessionId('local-123')).toBe(false);
    expect(isRemoteSessionId('session-123')).toBe(false);
    expect(isRemoteSessionId('8f1c2a3b-4d5e-6789-abcd-ef0123456789')).toBe(true);
  });
});
