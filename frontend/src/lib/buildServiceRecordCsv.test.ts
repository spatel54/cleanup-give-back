import { buildServiceRecordCsv } from './buildServiceRecordCsv';
import type { SessionStatRecord } from '@/features/session-tracking/utils/homeDashboardStats';

function stat(overrides: Partial<SessionStatRecord> & Pick<SessionStatRecord, 'id'>): SessionStatRecord {
  return {
    startedAtMs: Date.parse('2026-07-14T10:00:00'),
    durationSeconds: 3600,
    distanceMiles: 1.25,
    photoCount: 2,
    locationLabel: 'River walk',
    status: 'approved',
    ...overrides,
  };
}

describe('buildServiceRecordCsv', () => {
  it('includes a header and chronological approved rows', () => {
    const csv = buildServiceRecordCsv([
      stat({
        id: 'later',
        startedAtMs: Date.parse('2026-08-02T10:00:00'),
        locationLabel: 'Park, north lot',
        durationSeconds: 5400,
      }),
      stat({ id: 'earlier', startedAtMs: Date.parse('2026-07-14T10:00:00') }),
    ]);

    const lines = csv.replace(/^\uFEFF/, '').trim().split('\n');
    expect(lines[0]).toBe('Date,Title,Hours,Miles,Status');
    expect(lines[1]).toContain('River walk');
    expect(lines[1]).toContain('1');
    expect(lines[2]).toBe('"August 2, 2026","Park, north lot",1.5,1.3,Approved');
  });
});
