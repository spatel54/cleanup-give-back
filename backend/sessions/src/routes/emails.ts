import { randomInt } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { Resend } from 'resend';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { getServiceSupabase } from '../letterhead/supabaseAdmin.js';
import {
  defaultShippingLabelForFulfillment,
  ORDER_EMAIL_SUBJECTS,
  parseShopOrderAddress,
  parseShopOrderItems,
} from '../lib/order-email-html.js';
import { buildOrderEmailForSend } from '../lib/order-email-send.js';
import { deliverOrderPlacedInboxAndPush } from '../lib/volunteer-inbox.js';
import { prisma } from '../prisma.js';

type EventRegistrationBody = {
  to?: string;
  eventTitle?: string;
  eventDateTime?: string;
};

type OrderPlacedBody = {
  orderId?: string;
};

type EmailChangeRequestBody = {
  to?: string;
};

type EmailChangeConfirmBody = {
  to?: string;
  code?: string;
};

type PendingCode = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Keyed by `userId:email` so only the requesting user can confirm. */
const pendingEmailCodes = new Map<string, PendingCode>();

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
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

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

const DEFAULT_EVENT_REGISTRATION_TEMPLATE = {
  subject: "You're registered: {{event_title}}",
  bodyHtml:
    '<p>Thanks for registering with Clean Up Give Back.</p><p>Event: {{event_title}}{{event_when}}</p><p>We look forward to seeing you there.</p>',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Mirrors admin-web-app's `{{var}}`/`{{#if}}` renderer in `lib/email-template-render.ts`.
 * `escapeHtml: true` must be passed when rendering into an HTML body — `eventTitle` here is
 * client-submitted request-body text, so unescaped interpolation into `bodyHtml` is an
 * HTML-injection / phishing vector (subject stays plain-text, no escaping needed there).
 */
function renderTemplate(
  text: string,
  variables: Record<string, string | null | undefined>,
  options?: { escapeHtml?: boolean },
): string {
  const withConditionals = text.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_match, key: string, inner: string) =>
    variables[key] ? inner : '',
  );
  return withConditionals.replace(/{{(\w+)}}/g, (_match, key: string) => {
    const value = variables[key] ?? '';
    return options?.escapeHtml ? escapeHtml(value) : value;
  });
}

/** Reads the admin-editable override for `event_registration`; falls back to the hardcoded default. */
async function getEventRegistrationTemplate(): Promise<{ subject: string; bodyHtml: string }> {
  try {
    const rows = await prisma.$queryRaw<[{ subject: string; body_html: string }]>`
      SELECT subject, body_html FROM public.email_templates WHERE template_type = 'event_registration' LIMIT 1
    `;
    if (rows[0]) {
      return { subject: rows[0].subject, bodyHtml: rows[0].body_html };
    }
  } catch (err) {
    console.warn('[email-templates] failed to load template, using default:', err);
  }
  return DEFAULT_EVENT_REGISTRATION_TEMPLATE;
}

const ORDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOrderPlacedSubject(): Promise<string> {
  try {
    const rows = await prisma.$queryRaw<[{ subject: string }]>`
      SELECT subject FROM public.email_templates WHERE template_type = 'order_placed' LIMIT 1
    `;
    if (rows[0]?.subject?.trim()) return rows[0].subject.trim();
  } catch (err) {
    console.warn('[email-templates] failed to load order_placed subject, using default:', err);
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

/** Mirrors admin-web-app's `lib/email-log.ts` — this service has no Supabase client, only Prisma. */
async function logEmailSend(params: {
  userId?: string | null;
  templateType: 'approved' | 'declined' | 'shipped' | 'event_registration' | 'hours_reminder' | 'order_placed' | 'other';
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
    console.warn('[email-log] failed to record email send:', err);
  }
}

function pruneExpiredCodes(now = Date.now()): void {
  for (const [key, entry] of pendingEmailCodes) {
    if (entry.expiresAt <= now) {
      pendingEmailCodes.delete(key);
    }
  }
}

export async function registerEmailRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/emails/event-registration',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const body = (request.body ?? {}) as EventRegistrationBody;
      // The recipient is always the authenticated caller's own account email — never
      // request-body-supplied — so this endpoint can't be used to relay arbitrary
      // attacker-chosen content to third-party addresses under our sending domain.
      const to = (request as AuthenticatedRequest).email
        ? normalizeEmail((request as AuthenticatedRequest).email as string)
        : '';
      const eventTitle =
        typeof body.eventTitle === 'string' ? body.eventTitle.trim() : '';
      const eventDateTime =
        typeof body.eventDateTime === 'string' ? body.eventDateTime.trim() : '';

      if (!isValidEmail(to)) {
        return reply.code(400).send({ error: 'No email address on file for this account' });
      }
      if (!eventTitle) {
        return reply.code(400).send({ error: 'eventTitle is required' });
      }

      const resend = getResendClient();
      if (!resend) {
        request.log.warn('RESEND_API_KEY not set; skipping event registration email');
        return reply.send({ ok: true, skipped: true });
      }

      const when = eventDateTime ? ` on ${eventDateTime}` : '';
      const templateVars = { event_title: eventTitle, event_when: when };
      const template = await getEventRegistrationTemplate();
      const subject = renderTemplate(template.subject, templateVars);
      const { data, error } = await resend.emails.send({
        from: getFromAddress(),
        to,
        subject,
        html: renderTemplate(template.bodyHtml, templateVars, { escapeHtml: true }),
      });

      await logEmailSend({
        userId: (request as AuthenticatedRequest).userId,
        templateType: 'event_registration',
        toEmail: to,
        subject,
        status: error ? 'failed' : 'sent',
        resendMessageId: data?.id ?? null,
      });

      if (error) {
        request.log.error({ err: error }, 'Failed to send event registration email');
        return reply.code(502).send({ error: 'Failed to send email' });
      }

      return reply.send({ ok: true });
    },
  );

  app.post(
    '/emails/order-placed',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const body = (request.body ?? {}) as OrderPlacedBody;
      const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
      const auth = request as AuthenticatedRequest;

      if (!ORDER_ID_RE.test(orderId)) {
        return reply.code(400).send({ error: 'Valid orderId is required' });
      }

      const rows = await prisma.$queryRaw<
        {
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
        }[]
      >`
        SELECT id, user_id, items, total_cents, shipping_address, tracking_number, carrier, created_at, includes_kit, fulfillment_method, payment_method_label
        FROM public.shop_orders
        WHERE id = ${orderId}::uuid
        LIMIT 1
      `;
      const order = rows[0];
      if (!order || order.user_id !== auth.userId) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      await deliverOrderPlacedInboxAndPush(auth.userId, orderId);

      const contact = await resolveVolunteerContact(auth.userId, auth.email);
      const to = contact.email ? normalizeEmail(contact.email) : '';
      if (!isValidEmail(to)) {
        request.log.warn('No email on file for order-placed send; skipping');
        return reply.send({ ok: true, skipped: true });
      }

      const resend = getResendClient();
      if (!resend) {
        request.log.warn('RESEND_API_KEY not set; skipping order-placed email');
        return reply.send({ ok: true, skipped: true });
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
        userId: auth.userId,
        templateType: 'order_placed',
        toEmail: to,
        subject,
        status: error ? 'failed' : 'sent',
        resendMessageId: data?.id ?? null,
      });

      if (error) {
        request.log.error({ err: error }, 'Failed to send order-placed email');
        return reply.code(502).send({ error: 'Failed to send email' });
      }

      return reply.send({ ok: true });
    },
  );

  app.post(
    '/emails/email-change/request',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const body = (request.body ?? {}) as EmailChangeRequestBody;
      const to = typeof body.to === 'string' ? normalizeEmail(body.to) : '';

      if (!isValidEmail(to)) {
        return reply.code(400).send({ error: 'Valid to email is required' });
      }

      const userId = (request as AuthenticatedRequest).userId;
      pruneExpiredCodes();
      const code = generateCode();
      pendingEmailCodes.set(`${userId}:${to}`, { code, expiresAt: Date.now() + CODE_TTL_MS, attempts: 0 });

      const resend = getResendClient();
      if (!resend) {
        request.log.warn(
          { code },
          'RESEND_API_KEY not set; email-change code logged for local/dev',
        );
        return reply.send({
          ok: true,
          skipped: true,
          ...(process.env.NODE_ENV !== 'production' ? { debugCode: code } : {}),
        });
      }

      const { error } = await resend.emails.send({
        from: getFromAddress(),
        to,
        subject: 'Confirm your email change',
        text: [
          'You requested to change your Clean Up Give Back account email.',
          '',
          `Your verification code is: ${code}`,
          '',
          'This code expires in 10 minutes. If you did not request this, ignore this email.',
        ].join('\n'),
      });

      if (error) {
        pendingEmailCodes.delete(`${userId}:${to}`);
        request.log.error({ err: error }, 'Failed to send email-change code');
        return reply.code(502).send({ error: 'Failed to send email' });
      }

      return reply.send({ ok: true });
    },
  );

  app.post(
    '/emails/email-change/confirm',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).userId;
      const body = (request.body ?? {}) as EmailChangeConfirmBody;
      const to = typeof body.to === 'string' ? normalizeEmail(body.to) : '';
      const code = typeof body.code === 'string' ? body.code.trim() : '';

      if (!isValidEmail(to) || !/^\d{6}$/.test(code)) {
        return reply.code(400).send({ error: 'Valid to email and 6-digit code are required' });
      }

      pruneExpiredCodes();
      const mapKey = `${userId}:${to}`;
      const pending = pendingEmailCodes.get(mapKey);
      if (!pending) {
        return reply.code(400).send({ error: 'Invalid or expired code' });
      }

      pending.attempts += 1;
      if (pending.attempts > MAX_ATTEMPTS) {
        pendingEmailCodes.delete(mapKey);
        return reply.code(400).send({ error: 'Too many attempts; request a new code' });
      }

      if (pending.code !== code) {
        return reply.code(400).send({ error: 'Invalid or expired code' });
      }

      pendingEmailCodes.delete(mapKey);
      return reply.send({ ok: true });
    },
  );
}
