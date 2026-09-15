import { apiFetch, isApiConfigured } from './api';

export type SendEventRegistrationEmailInput = {
  to: string;
  eventTitle: string;
  eventDateTime?: string;
};

export type RequestEmailChangeInput = {
  to: string;
};

export type ConfirmEmailChangeInput = {
  to: string;
  code: string;
};

/**
 * Sends event registration confirmation. When the API is not configured,
 * returns `{ ok: true, skipped: true }` so UI can still complete registration.
 */
export async function sendEventRegistrationEmail(
  input: SendEventRegistrationEmailInput,
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isApiConfigured) {
    console.warn('[emails] API not configured; skipping event registration email');
    return { ok: true, skipped: true };
  }

  return apiFetch('/emails/event-registration', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function sendOrderPlacedEmail(
  input: { orderId: string },
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isApiConfigured) {
    console.warn('[emails] API not configured; skipping order-placed email');
    return { ok: true, skipped: true };
  }

  return apiFetch('/emails/order-placed', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function requestEmailChangeCode(
  input: RequestEmailChangeInput,
): Promise<{ ok: boolean; skipped?: boolean; debugCode?: string }> {
  if (!isApiConfigured) {
    console.warn('[emails] API not configured; skipping email-change request');
    return { ok: true, skipped: true, debugCode: '000000' };
  }

  return apiFetch('/emails/email-change/request', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function confirmEmailChangeCode(
  input: ConfirmEmailChangeInput,
): Promise<{ ok: boolean }> {
  if (!isApiConfigured) {
    if (input.code === '000000') {
      return { ok: true };
    }
    throw new Error('Invalid or expired code');
  }

  return apiFetch('/emails/email-change/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
