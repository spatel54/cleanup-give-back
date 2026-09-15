import type { Session, User } from '@supabase/supabase-js';

import {
  AuthCanceledError,
  isAnonymousSession,
  isAuthCanceledError,
  isLikelyNewUser,
  isRegisteredSession,
  mapAuthErrorMessage,
  parseAuthCallbackParams,
  userHasCompletedOnboarding,
} from '@/lib/authHelpers';
import { destinationAfterAuth } from '@/lib/volunteerAuthNavigation';

jest.mock('@/features/onboarding/onboardingStore', () => ({
  isOnboardingComplete: jest.fn(() => false),
}));

jest.mock('@/features/session-tracking/trackerPaymentStore', () => ({
  getTrackerHasPaid: jest.fn(() => false),
}));

const { isOnboardingComplete } = jest.requireMock('@/features/onboarding/onboardingStore') as {
  isOnboardingComplete: jest.Mock<boolean, []>;
};

const { getTrackerHasPaid } = jest.requireMock(
  '@/features/session-tracking/trackerPaymentStore',
) as {
  getTrackerHasPaid: jest.Mock<boolean, []>;
};

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-09-01T16:00:00.000Z',
    is_anonymous: false,
    ...overrides,
  } as User;
}

function sessionFor(u: User): Session {
  return { user: u } as Session;
}

describe('parseAuthCallbackParams', () => {
  it('reads implicit tokens from the hash', () => {
    const parsed = parseAuthCallbackParams(
      'nonprofitmobileapp://auth/callback#access_token=aaa&refresh_token=bbb',
    );
    expect(parsed.accessToken).toBe('aaa');
    expect(parsed.refreshToken).toBe('bbb');
    expect(parsed.code).toBeNull();
  });

  it('reads a PKCE code from the query', () => {
    const parsed = parseAuthCallbackParams('nonprofitmobileapp://auth/callback?code=xyz');
    expect(parsed.code).toBe('xyz');
  });

  it('decodes OAuth error descriptions', () => {
    const parsed = parseAuthCallbackParams(
      'nonprofitmobileapp://auth/callback?error=access_denied&error_description=User+denied',
    );
    expect(parsed.error).toBe('access_denied');
    expect(parsed.errorDescription).toBe('User denied');
  });
});

describe('session classification', () => {
  it('treats missing and anonymous sessions as unregistered', () => {
    expect(isRegisteredSession(null)).toBe(false);
    expect(isAnonymousSession(sessionFor(user({ is_anonymous: true })))).toBe(true);
    expect(isRegisteredSession(sessionFor(user({ is_anonymous: true })))).toBe(false);
    expect(isRegisteredSession(sessionFor(user({ is_anonymous: false })))).toBe(true);
  });

  it('reads onboarding_complete from metadata', () => {
    expect(userHasCompletedOnboarding(user())).toBe(false);
    expect(
      userHasCompletedOnboarding(user({ user_metadata: { onboarding_complete: true } })),
    ).toBe(true);
  });

  it('treats first-session timestamps as a new user', () => {
    const created = '2026-09-01T16:00:00.000Z';
    expect(
      isLikelyNewUser(user({ created_at: created, last_sign_in_at: created })),
    ).toBe(true);
    expect(
      isLikelyNewUser(
        user({
          created_at: '2026-08-01T16:00:00.000Z',
          last_sign_in_at: '2026-09-01T16:00:00.000Z',
        }),
      ),
    ).toBe(false);
    expect(
      isLikelyNewUser(
        user({
          created_at: created,
          last_sign_in_at: created,
          user_metadata: { onboarding_complete: true },
        }),
      ),
    ).toBe(false);
  });
});

describe('destinationAfterAuth', () => {
  beforeEach(() => {
    isOnboardingComplete.mockReturnValue(false);
    getTrackerHasPaid.mockReturnValue(false);
  });

  it('sends users missing phone, birthday, or service type to a few details', () => {
    const created = '2026-09-01T16:00:00.000Z';
    expect(
      destinationAfterAuth(
        sessionFor(user({ created_at: created, last_sign_in_at: created })),
      ),
    ).toBe('/account-phone');
  });

  it('sends new users with details through creating-account', () => {
    const created = '2026-09-01T16:00:00.000Z';
    expect(
      destinationAfterAuth(
        sessionFor(
          user({
            created_at: created,
            last_sign_in_at: created,
            user_metadata: {
              phone: '+15551234567',
              birth_year: 1990,
              birth_month: 6,
              service_type: 'Volunteering',
            },
          }),
        ),
      ),
    ).toBe('/creating-account');
  });

  it('sends incomplete returning users to how-it-works when unpaid', () => {
    expect(
      destinationAfterAuth(
        sessionFor(
          user({
            created_at: '2026-08-01T16:00:00.000Z',
            last_sign_in_at: '2026-09-01T16:00:00.000Z',
            user_metadata: {
              phone: '+15551234567',
              birth_year: 1990,
              birth_month: 6,
              service_type: 'Volunteering',
            },
          }),
        ),
      ),
    ).toBe('/how-it-works');
  });

  it('sends incomplete paid returning users to device permissions', () => {
    getTrackerHasPaid.mockReturnValue(true);
    expect(
      destinationAfterAuth(
        sessionFor(
          user({
            created_at: '2026-08-01T16:00:00.000Z',
            last_sign_in_at: '2026-09-01T16:00:00.000Z',
            user_metadata: {
              phone: '+15551234567',
              birth_year: 1990,
              birth_month: 6,
              service_type: 'Court Ordered',
            },
          }),
        ),
      ),
    ).toBe('/device-permissions');
  });

  it('sends onboarded users home', () => {
    isOnboardingComplete.mockReturnValue(true);
    expect(destinationAfterAuth(sessionFor(user()))).toBe('/');
    isOnboardingComplete.mockReturnValue(false);
    expect(
      destinationAfterAuth(
        sessionFor(user({ user_metadata: { onboarding_complete: true } })),
      ),
    ).toBe('/');
  });
});

describe('mapAuthErrorMessage', () => {
  it('maps common Supabase errors to volunteer copy', () => {
    expect(mapAuthErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Email or password is incorrect.',
    );
    expect(mapAuthErrorMessage(new Error('User already registered'))).toBe(
      'An account with this email already exists. Log in instead.',
    );
    expect(mapAuthErrorMessage(new Error('Email not confirmed'))).toBe(
      'Check your email to confirm your account, then log in.',
    );
  });
});

describe('isAuthCanceledError', () => {
  it('detects cancel class and Apple cancel code', () => {
    expect(isAuthCanceledError(new AuthCanceledError())).toBe(true);
    expect(isAuthCanceledError({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
    expect(isAuthCanceledError(new Error('nope'))).toBe(false);
  });
});
