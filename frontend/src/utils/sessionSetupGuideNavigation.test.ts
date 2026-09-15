import {
  captureSessionSetupGuideReturnHref,
  continueFromSessionFreeKit,
  exitSessionSetupGuideToTrackEntry,
  getSessionSetupGuideReturnHref,
  getSessionSetupGuidePillProgress,
  getSessionSetupGuidePillProgressDefault,
  getSessionSetupGuideTotalPills,
  goToPreviousFromSessionSetupCamera,
  goToPreviousFromSessionSetupComplete,
  goToSessionFreeHour,
  goToSessionSetupGuide,
  goToSessionSetupStep2,
  goToSessionSetupStep5,
  hrefFromStackRoute,
  resetSessionSetupGuideReturnHref,
  resolveSessionSetupGuideSkipHref,
  setSessionSetupGuideReturnHref,
  skipSessionSetupGuideForward,
} from './sessionSetupGuideNavigation';
import { isSessionLocationReadyToSkipAsk } from '@/utils/sessionPermissions';
import { canUseSessionPhotos } from '@/constants/ageGate';

jest.mock('@/utils/sessionPermissions', () => ({
  isSessionLocationReadyToSkipAsk: jest.fn(),
}));

jest.mock('@/constants/ageGate', () => ({
  canUseSessionPhotos: jest.fn(() => true),
}));

const mockLocationGranted = isSessionLocationReadyToSkipAsk as jest.MockedFunction<
  typeof isSessionLocationReadyToSkipAsk
>;
const mockCanUseSessionPhotos = canUseSessionPhotos as jest.MockedFunction<
  typeof canUseSessionPhotos
>;

function mockPermissions(locationGranted: boolean, photosEnabled = true) {
  mockLocationGranted.mockResolvedValue(locationGranted);
  mockCanUseSessionPhotos.mockReturnValue(photosEnabled);
}

describe('getSessionSetupGuideTotalPills', () => {
  it('returns 10 when both permission screens remain', () => {
    expect(getSessionSetupGuideTotalPills(2)).toBe(10);
  });

  it('returns 8 when both permission screens are skipped', () => {
    expect(getSessionSetupGuideTotalPills(0)).toBe(8);
  });
});

describe('getSessionSetupGuidePillProgress', () => {
  it('keeps a 10-pill bar for 18+ even when location is already granted', async () => {
    mockPermissions(true);

    await expect(getSessionSetupGuidePillProgress('guide')).resolves.toEqual({
      total: 10,
      active: 1,
    });
  });

  it('wires camera to pill 9 after location when location is already granted', async () => {
    mockPermissions(true);

    await expect(getSessionSetupGuidePillProgress('step5')).resolves.toEqual({
      total: 10,
      active: 5,
    });
    await expect(getSessionSetupGuidePillProgress('free-hour')).resolves.toEqual({
      total: 10,
      active: 6,
    });
    await expect(getSessionSetupGuidePillProgress('free-kit')).resolves.toEqual({
      total: 10,
      active: 7,
    });
    await expect(getSessionSetupGuidePillProgress('location')).resolves.toEqual({
      total: 10,
      active: 8,
    });
    await expect(getSessionSetupGuidePillProgress('camera')).resolves.toEqual({
      total: 10,
      active: 9,
    });
    await expect(getSessionSetupGuidePillProgress('complete')).resolves.toEqual({
      total: 10,
      active: 10,
    });
  });

  it('uses 9 pills when photos are not used (location stays in the bar)', async () => {
    mockPermissions(true, false);

    await expect(getSessionSetupGuidePillProgress('guide')).resolves.toEqual({
      total: 9,
      active: 1,
    });
    await expect(getSessionSetupGuidePillProgress('location')).resolves.toEqual({
      total: 9,
      active: 8,
    });
    await expect(getSessionSetupGuidePillProgress('complete')).resolves.toEqual({
      total: 9,
      active: 9,
    });
  });

  it('uses the full 10-pill bar when both permission screens are still ahead', async () => {
    mockPermissions(false);

    await expect(getSessionSetupGuidePillProgress('guide')).resolves.toEqual({
      total: 10,
      active: 1,
    });
    await expect(getSessionSetupGuidePillProgress('location')).resolves.toEqual({
      total: 10,
      active: 8,
    });
    await expect(getSessionSetupGuidePillProgress('camera')).resolves.toEqual({
      total: 10,
      active: 9,
    });
    await expect(getSessionSetupGuidePillProgress('complete')).resolves.toEqual({
      total: 10,
      active: 10,
    });
  });
});

describe('getSessionSetupGuidePillProgressDefault', () => {
  it('assumes both permissions are still ahead before the async check', () => {
    expect(getSessionSetupGuidePillProgressDefault('guide')).toEqual({
      total: 10,
      active: 1,
    });
  });
});

describe('hrefFromStackRoute', () => {
  it('maps index to home', () => {
    expect(hrefFromStackRoute({ name: 'index' })).toBe('/');
  });

  it('maps named routes and query params', () => {
    expect(hrefFromStackRoute({ name: 'shop' })).toBe('/shop');
    expect(hrefFromStackRoute({ name: 'session-detail', params: { id: 'abc' } })).toBe(
      '/session-detail?id=abc',
    );
  });
});

describe('captureSessionSetupGuideReturnHref', () => {
  beforeEach(() => {
    resetSessionSetupGuideReturnHref();
  });

  it('stores the route below the guide on the stack', () => {
    captureSessionSetupGuideReturnHref({
      index: 1,
      routes: [{ name: 'shop' }, { name: 'session-setup-guide' }],
    });

    expect(getSessionSetupGuideReturnHref()).toBe('/shop');
  });

  it('falls back to home when the guide is the root screen', () => {
    captureSessionSetupGuideReturnHref({
      index: 0,
      routes: [{ name: 'session-setup-guide' }],
    });

    expect(getSessionSetupGuideReturnHref()).toBe('/');
  });
});

describe('exitSessionSetupGuideToTrackEntry', () => {
  const dismissTo = jest.fn();
  const back = jest.fn();
  const canGoBack = jest.fn();
  const router = { dismissTo, back, canGoBack } as unknown as import('expo-router').Router;

  beforeEach(() => {
    dismissTo.mockClear();
    back.mockClear();
    canGoBack.mockClear();
    resetSessionSetupGuideReturnHref();
  });

  it('dismisses to the captured pre-Track screen', () => {
    setSessionSetupGuideReturnHref('/sessions-list');

    exitSessionSetupGuideToTrackEntry(router);

    expect(dismissTo).toHaveBeenCalledWith('/sessions-list');
    expect(back).not.toHaveBeenCalled();
  });

  it('falls back to guide back navigation when no return href was captured', () => {
    canGoBack.mockReturnValue(true);

    exitSessionSetupGuideToTrackEntry(router);

    expect(dismissTo).not.toHaveBeenCalled();
    expect(back).toHaveBeenCalled();
  });
});

describe('goToPreviousFromSessionSetupComplete', () => {
  const replace = jest.fn();
  const router = { replace } as unknown as import('expo-router').Router;

  beforeEach(() => {
    replace.mockClear();
  });

  it('targets camera permission when photos are enabled', async () => {
    mockPermissions(true);

    await goToPreviousFromSessionSetupComplete(router);

    expect(replace).toHaveBeenCalledWith('/session-setup-step7');
  });

  it('targets location permission when photos are disabled and location is not granted', async () => {
    mockPermissions(false, false);

    await goToPreviousFromSessionSetupComplete(router);

    expect(replace).toHaveBeenCalledWith('/session-setup-step6');
  });

  it('targets free-kit when photos are disabled and location was auto-skipped', async () => {
    mockPermissions(true, false);

    await goToPreviousFromSessionSetupComplete(router);

    expect(replace).toHaveBeenCalledWith('/session-free-kit');
  });
});

describe('goToPreviousFromSessionSetupCamera', () => {
  const replace = jest.fn();
  const router = { replace } as unknown as import('expo-router').Router;

  beforeEach(() => {
    replace.mockClear();
  });

  it('targets location when location is still needed', async () => {
    mockPermissions(false);

    await goToPreviousFromSessionSetupCamera(router);

    expect(replace).toHaveBeenCalledWith('/session-setup-step6');
  });

  it('targets free-kit when location was already granted', async () => {
    mockPermissions(true);

    await goToPreviousFromSessionSetupCamera(router);

    expect(replace).toHaveBeenCalledWith('/session-free-kit');
  });
});

describe('linear guide Previous helpers', () => {
  const replace = jest.fn();
  const router = { replace } as unknown as import('expo-router').Router;

  beforeEach(() => {
    replace.mockClear();
  });

  it('targets the named predecessor with replace (never home via back)', () => {
    goToSessionSetupGuide(router);
    goToSessionSetupStep2(router);
    goToSessionSetupStep5(router);
    goToSessionFreeHour(router);

    expect(replace.mock.calls).toEqual([
      ['/session-setup-guide'],
      ['/session-setup-step2'],
      ['/session-setup-step5'],
      ['/session-free-hour'],
    ]);
  });
});

describe('resolveSessionSetupGuideSkipHref', () => {
  it('lands on location when location is not granted', async () => {
    mockPermissions(false);

    await expect(resolveSessionSetupGuideSkipHref()).resolves.toBe('/session-setup-step6');
  });

  it('lands on camera when location is granted and photos are enabled', async () => {
    mockPermissions(true);

    await expect(resolveSessionSetupGuideSkipHref()).resolves.toBe('/session-setup-step7');
  });

  it('lands on the finale when location is granted and photos are not used', async () => {
    mockPermissions(true, false);

    await expect(resolveSessionSetupGuideSkipHref()).resolves.toBe('/session-setup-complete');
  });
});

describe('skipSessionSetupGuideForward', () => {
  const replace = jest.fn();
  const router = { replace } as unknown as import('expo-router').Router;

  beforeEach(() => {
    replace.mockClear();
  });

  it('replaces to camera when location is granted and photos are enabled', async () => {
    mockPermissions(true);

    await skipSessionSetupGuideForward(router);

    expect(replace).toHaveBeenCalledWith({
      pathname: '/session-setup-step7',
      params: { enter: 'forward' },
    });
  });

  it('replaces to the finale when location is granted and photos are not used', async () => {
    mockPermissions(true, false);

    await skipSessionSetupGuideForward(router);

    expect(replace).toHaveBeenCalledWith('/session-setup-complete');
  });

  it('replaces to location with enter=forward when location is still needed', async () => {
    mockPermissions(false);

    await skipSessionSetupGuideForward(router);

    expect(replace).toHaveBeenCalledWith({
      pathname: '/session-setup-step6',
      params: { enter: 'forward' },
    });
  });
});

describe('continueFromSessionFreeKit', () => {
  const push = jest.fn();
  const router = { push } as unknown as import('expo-router').Router;

  beforeEach(() => {
    push.mockClear();
  });

  it('pushes camera when location is granted and photos are enabled', async () => {
    mockPermissions(true);

    await continueFromSessionFreeKit(router);

    expect(push).toHaveBeenCalledWith('/session-setup-step7');
  });

  it('pushes the finale when location is granted and photos are not used', async () => {
    mockPermissions(true, false);

    await continueFromSessionFreeKit(router);

    expect(push).toHaveBeenCalledWith('/session-setup-complete');
  });

  it('pushes location when location is still needed', async () => {
    mockPermissions(false);

    await continueFromSessionFreeKit(router);

    expect(push).toHaveBeenCalledWith('/session-setup-step6');
  });
});
