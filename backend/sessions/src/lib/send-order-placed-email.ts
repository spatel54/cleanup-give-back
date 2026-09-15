import { Resend } from 'resend';

import { getServiceSupabase } from '../letterhead/supabaseAdmin.js';
import {
  defaultShippingLabelForFulfillment,
  ORDER_EMAIL_SUBJECTS,
  parseShopOrderAddress,
  parseShopOrderItems,
} from './order-email-html.js';
import { buildOrderEmailForSend } from './order-email-send.js';
import { prisma } from '../prisma.js';
import { deliverOrderPlacedInboxAndPush } from './volunteer-inbox.js';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'noreply@example.org';
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getOrderPlacedSubject(): Promise<string> {
  try {
    const rows = await prisma.$queryRaw<[{ subject: string }]>`
      SELECT subject FROM public.email_templates WHERE template_type = 'order_placed' LIMIT 1
    `;
    if (rows[0]?.subject?.trim()) return rows[0].subject.trim();
  } catch (err) {
    console.warn('[order-placed-email] failed to load subject:', err);
  }
  return ORDER_EMAIL_SUBJECTS.placed;
}

async function resolveVolunteerContact(
  userId: string,
  jwtEmail?: string,
): Promise<{ email: string | null; name: string | null }> {
  const jwt = jwtEmail?.trim() || null;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data.user) {
      return { email: jwt, name: null };
    }
    const meta = data.user.user_metadata ?? {};
    const metaEmail = typeof meta.email === 'string' && meta.email.trim() ? meta.email.trim() : null;
    const fullName = typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : null;
    return {
      email: jwt || data.user.email || metaEmail,
      name: fullName,
    };
  } catch {
    return { email: jwt, name: null };
  }
}

async function logEmailSend(params: {
  userId?: string | null;
  templateType: 'order_placed';
  toEmail: string;
  subject: string;
  status: 'sent' | 'failed';
  resendMessageId?: string | null;
}): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO public.email_log (user_id, template_type, to_email, subject, status, resend_message_id)
      VALUES (
        ${params.userId ?? null}::uuid,
        ${params.templateType},
        ${params.toEmail},
        ${params.subject},
        ${params.status},
        ${params.resendMessageId ?? null}
      )
    `;
  } catch (err) {
    console.warn('[email-log] failed to record order-placed send:', err);
  }
}

type ShopOrderRow = {
  id: string;
  user_id: string | null;
  items: unknown;
  total_cents: number;
  shipping_address: unknown;
  tracking_number: string | null;
  carrier: string | null;
  created_at: Date;
  includes_kit: boolean | null;
  fulfillment_method: string | null;
  payment_method_label: string | null;
};

/**
 * Sends the volunteer order-placed email for a paid shop order.
 * Used by Stripe webhook after checkout.session.completed.
 */
export async function sendOrderPlacedEmailForOrder(
  orderId: string,
  userId: string,
  jwtEmail?: string,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const rows = await prisma.$queryRaw<ShopOrderRow[]>`
    SELECT id, user_id, items, total_cents, shipping_address, tracking_number, carrier, created_at, includes_kit, fulfillment_method, payment_method_label
    FROM public.shop_orders
    WHERE id = ${orderId}::uuid
    LIMIT 1
  `;
  const order = rows[0];
  if (!order || order.user_id !== userId) {
    return { ok: false, skipped: true };
  }

  await deliverOrderPlacedInboxAndPush(userId, orderId);

  const contact = await resolveVolunteerContact(userId, jwtEmail);
  const to = contact.email ? normalizeEmail(contact.email) : '';
  if (!isValidEmail(to)) {
    console.warn('[order-placed-email] no email on file; skipping');
    return { ok: true, skipped: true };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn('[order-placed-email] RESEND_API_KEY not set; skipping');
    return { ok: true, skipped: true };
  }

  const subject = await getOrderPlacedSubject();
  const items = parseShopOrderItems(order.items);
  const { html, attachments } = buildOrderEmailForSend({
    variant: 'placed',
    volunteerName: contact.name,
    orderId: order.id,
    createdAt: order.created_at,
    totalCents: order.total_cents,
    shippingAddress: parseShopOrderAddress(order.shipping_address),
    items,
    trackingNumber: order.tracking_number,
    carrier: order.carrier,
    includesKit: order.includes_kit,
    shippingLabel: defaultShippingLabelForFulfillment(order.fulfillment_method, items),
    paymentMethod: order.payment_method_label,
  });

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
    attachments,
  });

  await logEmailSend({
    userId,
    templateType: 'order_placed',
    toEmail: to,
    subject,
    status: error ? 'failed' : 'sent',
    resendMessageId: data?.id ?? null,
  });

  if (error) {
    console.error('[order-placed-email] send failed:', error);
    return { ok: false };
  }

  return { ok: true };
}
