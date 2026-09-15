import { Resend } from 'resend';

/** Mirrors backend/sessions/src/routes/emails.ts — same env vars, same soft-fail-when-unset pattern. */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'noreply@example.org';
}
