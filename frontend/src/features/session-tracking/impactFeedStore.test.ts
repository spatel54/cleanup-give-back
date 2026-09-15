jest.mock('@/lib/api', () => ({ isApiConfigured: false }));
jest.mock('@/lib/sessionsApi', () => ({
  getSession: jest.fn(),
  listSessions: jest.fn(),
}));
jest.mock('@/lib/signedStorageUrl', () => ({
  createSignedStorageUrls: jest.fn(),
}));

import { feedItemsFromSnapshot } from './impactFeedStore';
import type { CompletedSessionSnapshot } from './liveSessionStore';
import { DEFAULT_MAP_LAYER } from './utils/mapStyles';

function snapshot(
  overrides: Partial<CompletedSessionSnapshot> = {},
): CompletedSessionSnapshot {
  return {
    remoteSessionId: 'session-1',
    setup: {
      activity: 'Cleanup Session',
      date: new Date('2026-09-01T14:36:00'),
      courtOrdered: false,
      description: '',
    },
    startedAt: Date.parse('2026-09-01T14:36:00'),
    endedAt: Date.parse('2026-09-01T15:36:00'),
    elapsedSeconds: 3600,
    distanceMiles: 0,
    routeCoordinates: [],
    routeSamples: [],
    submittedCheckpoints: [
      {
        id: 'cp-1',
        selfieUri: 'file://selfie.jpg',
        progressUri: 'file://progress.jpg',
        capturedAt: Date.parse('2026-09-01T15:00:00'),
        submittedEarly: false,
        latitude: 41.8781,
        longitude: -87.6298,
        syncStatus: 'synced',
      },
    ],
    mapLayer: DEFAULT_MAP_LAYER,
    ...overrides,
  };
}

describe('feedItemsFromSnapshot', () => {
  it('uses the last route point as the map anchor', () => {
    const items = feedItemsFromSnapshot(
      snapshot({
        routeCoordinates: [
          [-87.63, 41.88],
          [-87.628, 41.881],
        ],
      }),
    );

    expect(items).toHaveLength(1);
    expect(items[0].mapAnchor).toEqual([-87.628, 41.881]);
  });

  it('falls back to the checkpoint capture location when the route is empty', () => {
    const items = feedItemsFromSnapshot(snapshot());

    expect(items[0].mapAnchor).toEqual([-87.6298, 41.8781]);
  });

  it('leaves mapAnchor null when no GPS exists', () => {
    const items = feedItemsFromSnapshot(
      snapshot({
        submittedCheckpoints: [
          {
            id: 'cp-1',
            selfieUri: 'file://selfie.jpg',
            progressUri: 'file://progress.jpg',
            capturedAt: Date.parse('2026-09-01T15:00:00'),
            submittedEarly: false,
            latitude: null,
            longitude: null,
            syncStatus: 'synced',
          },
        ],
      }),
    );

    expect(items[0].mapAnchor).toBeNull();
  });
});
