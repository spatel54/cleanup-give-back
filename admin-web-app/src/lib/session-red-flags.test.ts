import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeRedFlags, metersPerSecondToMph } from './session-red-flags.ts';
import type { PlausibilitySignal } from './session-evidence.ts';
import type { VolunteerActivityPattern } from './live-data.ts';

const emptyPattern = (overrides: Partial<VolunteerActivityPattern> = {}): VolunteerActivityPattern => ({
  sessionsLast7Days: 0,
  priorWeeklyAverage: 0,
  invalidSessionsLast30Days: 0,
  nearDeadlineVolumeSpike: false,
  deleteCount: 0,
  ...overrides,
});

const speedSignal = (overrides: Partial<PlausibilitySignal> = {}): PlausibilitySignal => ({
  avgSpeedMps: 3.5,
  maxSpeedMps: 8.2,
  exceedsPlausibleSpeed: true,
  sharpReversalCount: 0,
  routeSpanMeters: 400,
  tightLoop: false,
  idleHighDuration: false,
  ...overrides,
});

describe('computeRedFlags', () => {
  it('does not flag 0 invalid sessions just because deletes exist', () => {
    const flags = computeRedFlags({
      durationSeconds: 1200,
      checkpointCount: 4,
      photoPins: [],
      plausibilitySignal: null,
      volunteerPattern: emptyPattern({ invalidSessionsLast30Days: 0, deleteCount: 12 }),
    });
    assert.deepEqual(
      flags.map((f) => f.key),
      ['delete-pattern'],
    );
    assert.match(flags[0].label, /12 sessions deleted/);
    assert.doesNotMatch(flags[0].label, /invalid/);
  });

  it('does not flag deletes when the count is under 2', () => {
    const flags = computeRedFlags({
      durationSeconds: 1200,
      checkpointCount: 4,
      photoPins: [],
      plausibilitySignal: null,
      volunteerPattern: emptyPattern({ deleteCount: 1, invalidSessionsLast30Days: 1 }),
    });
    assert.equal(flags.length, 0);
  });

  it('emits separate invalid and delete flags when both thresholds fire', () => {
    const flags = computeRedFlags({
      durationSeconds: 1200,
      checkpointCount: 4,
      photoPins: [],
      plausibilitySignal: null,
      volunteerPattern: emptyPattern({ invalidSessionsLast30Days: 3, deleteCount: 4 }),
    });
    assert.deepEqual(
      flags.map((f) => f.key),
      ['invalid-pattern', 'delete-pattern'],
    );
  });

  it('explains faster-than-walking with average and peak mph', () => {
    const flags = computeRedFlags({
      durationSeconds: 1200,
      checkpointCount: 4,
      photoPins: [],
      plausibilitySignal: speedSignal(),
      volunteerPattern: null,
    });
    assert.equal(flags.length, 1);
    assert.equal(flags[0].key, 'exceeds-speed');
    assert.equal(flags[0].scope, 'session');
    assert.match(flags[0].explanation, new RegExp(`Average pace ${metersPerSecondToMph(3.5)} mph`));
    assert.match(flags[0].explanation, new RegExp(`peak ${metersPerSecondToMph(8.2)} mph`));
  });

  it('keeps a session speed flag separate from volunteer delete history', () => {
    const flags = computeRedFlags({
      durationSeconds: 1200,
      checkpointCount: 4,
      photoPins: [],
      plausibilitySignal: speedSignal(),
      volunteerPattern: emptyPattern({ deleteCount: 12 }),
    });
    assert.deepEqual(
      flags.map((f) => [f.key, f.scope]),
      [
        ['exceeds-speed', 'session'],
        ['delete-pattern', 'volunteer'],
      ],
    );
  });
});
