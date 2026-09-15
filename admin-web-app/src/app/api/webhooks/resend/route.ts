/**
 * Resend delivery webhook - upgrades `email_log.status` from 'sent' to
 * 'delivered'/'bounced'/'complained' once Resend confirms what happened,
 * matched by `resend_message_id`. Optional: only fires once this URL +
 * `RESEND_WEBHOOK_SECRET` are configured in the Resend dashboard's Webhooks
 * page (Admin/an admin has to do that manually - this route can't self-register).
 *
 * Resend signs webhooks via Svix (svix-id/svix-timestamp/svix-signature
 * headers). Verified here with plain HMAC-SHA256 rather than pulling in the
 * `svix` package, since Resend's signing scheme is documented and this is the
 * only consumer.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

type ResendWebhookEvent = {
  type: string;
  data: { email_id?: string };
};

const EVENT_STATUS: Record<string, 'delivered' | 'bounced' | 'complained'> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

function verifySignature(payload: string, headers: Headers, secret: string): boolean {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  return svixSignature
    .split(' ')
    .some((candidate) => {
      const [, sig] = candidate.split(',');
      if (!sig) return false;
      const sigBuf = Buffer.from(sig, 'base64');
      const expectedBuf = Buffer.from(expected, 'base64');
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured yet - this is expected until an admin sets it up in Resend.
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
  }

  const payload = await request.text();
  if (!verifySignature(payload, request.headers, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = EVENT_STATUS[event.type];
  const messageId = event.data?.email_id;
  if (!status || !messageId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = await createServiceClient();
  await supabase.from('email_log').update({ status }).eq('resend_message_id', messageId);

  return NextResponse.json({ ok: true });
}
