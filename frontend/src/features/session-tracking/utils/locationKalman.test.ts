import {
  createLocationKalmanFilter,
  resetLocationKalmanFilter,
  updateLocationKalman,
} from './locationKalman';

describe('locationKalman', () => {
  it('initializes on the first sample', () => {
    const filter = createLocationKalmanFilter();
    const coordinate = updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    expect(coordinate).toEqual([-87.63, 41.88]);
    expect(filter.initialized).toBe(true);
  });

  it('smooths noisy measurements toward motion', () => {
    const filter = createLocationKalmanFilter();
    updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    const next = updateLocationKalman(filter, {
      latitude: 41.88005,
      longitude: -87.62995,
      accuracyMeters: 8,
      timestampMs: 2_000,
    });

    expect(next[0]).toBeGreaterThan(-87.63);
    expect(next[1]).toBeGreaterThan(41.88);
  });

  it('ignores out-of-order samples without moving the estimate', () => {
    const filter = createLocationKalmanFilter();
    updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 2_000,
    });

    const after = updateLocationKalman(filter, {
      latitude: 41.89,
      longitude: -87.62,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    expect(after).toEqual([-87.63, 41.88]);
    expect(filter.lastTimestampMs).toBe(2_000);
    expect(filter.lat).toBe(41.88);
    expect(filter.lng).toBe(-87.63);
  });

  it('does not amplify velocity on clustered sub-250ms ticks', () => {
    const filter = createLocationKalmanFilter();
    updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    updateLocationKalman(filter, {
      latitude: 41.8802,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_040,
    });

    expect(Math.abs(filter.vLat)).toBeLessThan(0.002);
  });

  it('resets cleanly', () => {
    const filter = createLocationKalmanFilter();
    updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    resetLocationKalmanFilter(filter);
    expect(filter.initialized).toBe(false);
  });
});
