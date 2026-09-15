import type { Session, User } from '@supabase/supabase-js';

export const ONBOARDING_COMPLETE_METADATA_KEY = 'onboarding_complete';

export class AuthCanceledError extends Error {
  constructor() {
    super('Authentication canceled');
    this.name = 'AuthCanceledError';
  }
}

export function isAuthCanceledError(error: unknown): boolean {
  if (error instanceof AuthCanceledError) {
    return true;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: string }).code === 'ERR_REQUEST_CANCELED';
  }
  return false;
}

export function isAnonymousSession(session: Session | null | undefined): boolean {
  return Boolean(session?.user?.is_anonymous);
}

export function isRegisteredSession(session: Session | null | undefined): boolean {
  return Boolean(session?.user && !session.user.is_anonymous);
}

export function userHasCompletedOnboarding(user: User | null | undefined): boolean {
  return user?.user_metadata?.[ONBOARDING_COMPLETE_METADATA_KEY] === true;
}

/** First-session heuristic: created_at and last_sign_in_at within 10s. */
export function isLikelyNewUser(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }
  if (userHasCompletedOnboarding(user)) {
    return false;
  }
  const created = Date.parse(user.created_at);
  const last = Date.parse(user.last_sign_in_at ?? user.created_at);
  if (!Number.isFinite(created) || !Number.isFinite(last)) {
    return true;
  }
  return Math.abs(last - created) < 10_000;
}

export type AuthCallbackParams = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
  errorDescription: string | null;
};

function readParams(url: string): URLSearchParams {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const params = new URLSearchParams();

  if (queryIndex >= 0) {
    const queryEnd = hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : url.length;
    const query = url.slice(queryIndex + 1, queryEnd);
    new URLSearchParams(query).forEach((value, key) => {
      params.set(key, value);
    });
  }

  if (hashIndex >= 0) {
    new URLSearchParams(url.slice(hashIndex + 1)).forEach((value, key) => {
      params.set(key, value);
    });
  }

  return params;
}

export function parseAuthCallbackParams(url: string): AuthCallbackParams {
  const params = readParams(url);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    error: params.get('error'),
    errorDescription: params.get('error_description')?.replace(/\+/g, ' ') ?? null,
  };
}

export function mapAuthErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';
  const message = raw.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Log in instead.';
  }
  if (message.includes('email not confirmed')) {
    return 'Check your email to confirm your account, then log in.';
  }
  if (message.includes('signup is disabled')) {
    return 'Account creation is temporarily unavailable. Try again later.';
  }
  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) {
    return 'That sign-in method is not available yet.';
  }
  if (raw.trim()) {
    return raw;
  }
  return 'Could not sign in. Check your connection and try again.';
}
