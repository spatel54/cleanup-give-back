import { apiFetch, isApiConfigured } from './api';

/** Demo allowlist when Fly API is not configured (local Expo Go without EXPO_PUBLIC_API_URL). */
export const LOCAL_COMPANY_UPGRADE_CODES = new Set([
  '1234567890',
  '9876543210',
  '5555555555',
]);

type ApiErrorBody = {
  error?: string;
  message?: string;
};

function parseApiError(caught: unknown): { status: number | null; bodyText: string; message: string } {
  const raw = caught instanceof Error ? caught.message : String(caught ?? '');
  const statusMatch = raw.match(/^API (\d+):\s*([\s\S]*)$/);
  if (!statusMatch) {
    return { status: null, bodyText: raw, message: raw || 'Invalid company code' };
  }
  const status = Number(statusMatch[1]);
  const bodyText = statusMatch[2] ?? '';
  let message = bodyText;
  try {
    const parsed = JSON.parse(bodyText) as ApiErrorBody;
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      message = parsed.error.trim();
    } else if (typeof parsed.message === 'string' && parsed.message.trim()) {
      message = parsed.message.trim();
    }
  } catch {
    // Keep raw body text.
  }
  return { status, bodyText, message };
}

/**
 * Redeem a 10-digit company code for tracker access.
 * Prefers Fly API (single-use DB codes). Local demo allowlist when API URL is unset,
 * or in `__DEV__` when there is no signed-in JWT (TEMP Welcome → How it works skip).
 */
export async function redeemCompanyCode(code: string): Promise<{ ok: true } | { error: string }> {
  const normalized = code.trim().replace(/\D/g, '').slice(0, 10);
  if (!/^\d{10}$/.test(normalized)) {
    return { error: 'Enter a valid 10-digit company code.' };
  }

  if (isApiConfigured) {
    try {
      await apiFetch<{ ok: boolean }>('/company-codes/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: normalized }),
      });
      return { ok: true };
    } catch (caught) {
      const { status, bodyText, message } = parseApiError(caught);

      if (status === 409 || /already been used/i.test(message)) {
        return { error: 'This company code has already been used.' };
      }
      if (status === 404 && /invalid company code/i.test(message)) {
        return { error: 'Invalid company code' };
      }
      if (status === 400) {
        return { error: message || 'Enter a valid 10-digit company code.' };
      }
      if (status === 401 || /not authenticated/i.test(message)) {
        // TEMP __DEV__: Welcome skip opens How it works without a session.
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          if (LOCAL_COMPANY_UPGRADE_CODES.has(normalized)) {
            return { ok: true };
          }
          return {
            error:
              'DEV: sign in to redeem a real code, or use demo code 1234567890.',
          };
        }
        return { error: 'Please sign in again, then try your company code.' };
      }
      // Missing Fly route / infra errors must not look like a bad code.
      if (
        status === 404 ||
        status === 503 ||
        status === 500 ||
        /route .+ not found/i.test(bodyText) ||
        /not found/i.test(message)
      ) {
        return {
          error: 'Company code service is temporarily unavailable. Please try again shortly.',
        };
      }
      return { error: message || 'Could not redeem company code.' };
    }
  }

  if (!LOCAL_COMPANY_UPGRADE_CODES.has(normalized)) {
    return { error: 'Invalid company code' };
  }
  return { ok: true };
}
