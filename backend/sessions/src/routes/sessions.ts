import type { FastifyInstance } from 'fastify';
import { Prisma, SessionStatus } from '@prisma/client';
import { Resend } from 'resend';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { prisma } from '../prisma.js';
import { computePlausibilitySignal } from '../lib/sessionPlausibility.js';

type CreateSessionBody = {
  activity?: string;
  courtOrdered?: boolean;
  description?: string;
  date?: string;
};

type CheckpointBody = {
  selfiePath: string;
  progressPath: string;
  capturedAt: string;
  submittedEarly?: boolean;
  /** WGS84 — optional for older clients; preferred for trail photo pins. */
  latitude?: number | null;
  longitude?: number | null;
};

type FinalizeBody = {
  endedAt: string;
  durationSeconds: number;
  distanceMiles: number;
  route: number[][];
  status?: SessionStatus;
  /**
   * Legacy free-orientation flag. Ignored — finalize never auto-approves.
   * Kept so older clients still get under_review instead of a 400.
   */
  skipOrientation?: boolean;
};

type ApprovalBody = {
  status: 'approved' | 'not_approved' | 'invalid';
};

type FeedbackBody = {
  source: 'session' | 'account';
  rating: 'excited' | 'happy' | 'neutral' | 'sad' | 'very_sad';
  comment?: string;
  sessionId?: string;
};

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

/** Mirrors admin-web-app's `lib/email-log.ts` — this service has no Supabase client, only Prisma. */
async function logEmailSend(params: {
  userId?: string | null;
  sessionId?: string | null;
  templateType: 'approved' | 'declined' | 'shipped' | 'event_registration' | 'hours_reminder' | 'order_placed' | 'other';
  toEmail: string;
  subject: string;
  status: 'sent' | 'failed';
  resendMessageId?: string | null;
}): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO public.email_log (user_id, session_id, template_type, to_email, subject, status, resend_message_id)
      VALUES (
        ${params.userId ?? null}::uuid,
        ${params.sessionId ?? null}::uuid,
        ${params.templateType},
        ${params.toEmail},
        ${params.subject},
        ${params.status},
        ${params.resendMessageId ?? null}
      )
    `;
  } catch (err) {
    // Soft-fail — table may not exist yet if the migration hasn't been applied.
    console.warn('[email-log] failed to record email send:', err);
  }
}

async function sendAdminReviewEmail(sessionId: string, activity: string | null): Promise<void> {
  const resend = getResendClient();
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

  if (!resend || !adminEmail) {
    return;
  }

  const subject = 'Session ready for review';
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: adminEmail,
      subject,
      text: [
        'A volunteer session is ready for review.',
        '',
        `Session ID: ${sessionId}`,
        `Activity: ${activity ?? 'Not specified'}`,
        '',
        'Please review in the admin portal.',
      ].join('\n'),
    });
    await logEmailSend({
      sessionId,
      templateType: 'other',
      toEmail: adminEmail,
      subject,
      status: error ? 'failed' : 'sent',
      resendMessageId: data?.id ?? null,
    });
  } catch {
    // Soft-fail: log only, don't throw
    await logEmailSend({ sessionId, templateType: 'other', toEmail: adminEmail, subject, status: 'failed' });
  }
}

function serializeSession(session: {
  id: string;
  userId: string;
  activity: string | null;
  courtOrdered: boolean;
  description: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  distanceMiles: Prisma.Decimal | null;
  route: Prisma.JsonValue;
  status: SessionStatus;
  declineReason?: string | null;
  createdAt: Date;
  _count?: { checkpoints: number };
}) {
  const checkpointCount = session._count?.checkpoints ?? 0;

  return {
    id: session.id,
    userId: session.userId,
    activity: session.activity,
    courtOrdered: session.courtOrdered,
    description: session.description,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    durationSeconds: session.durationSeconds,
    distanceMiles: session.distanceMiles ? Number(session.distanceMiles) : null,
    route: session.route,
    status: session.status,
    declineReason: session.declineReason?.trim() || null,
    createdAt: session.createdAt.toISOString(),
    checkpointCount,
    photoCount: checkpointCount * 2,
  };
}

export async function registerSessionRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateSessionBody }>(
    '/sessions',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const body = request.body ?? {};

      const session = await prisma.session.create({
        data: {
          userId,
          activity: body.activity ?? null,
          courtOrdered: body.courtOrdered ?? false,
          description: body.description ?? null,
          startedAt: new Date(),
          status: SessionStatus.active,
        },
      });

      return reply.code(201).send({
        id: session.id,
        status: session.status,
        startedAt: session.startedAt?.toISOString(),
      });
    },
  );

  app.post<{ Params: { id: string }; Body: CheckpointBody }>(
    '/sessions/:id/checkpoints',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;
      const body = request.body;

      const session = await prisma.session.findFirst({
        where: { id, userId, status: SessionStatus.active },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Active session not found' });
      }

      if (!body?.selfiePath || !body?.progressPath || !body?.capturedAt) {
        return reply.code(400).send({ error: 'Missing checkpoint fields' });
      }

      const latitude =
        typeof body.latitude === 'number' && Number.isFinite(body.latitude)
          ? body.latitude
          : null;
      const longitude =
        typeof body.longitude === 'number' && Number.isFinite(body.longitude)
          ? body.longitude
          : null;
      const hasCoords = latitude != null && longitude != null;
      if (hasCoords && (Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
        return reply.code(400).send({ error: 'Invalid checkpoint coordinates' });
      }

      const checkpoint = await prisma.checkpoint.create({
        data: {
          sessionId: id,
          selfiePath: body.selfiePath,
          progressPath: body.progressPath,
          capturedAt: new Date(body.capturedAt),
          submittedEarly: body.submittedEarly ?? false,
          latitude: hasCoords ? latitude : null,
          longitude: hasCoords ? longitude : null,
        },
      });

      return reply.code(201).send({ id: checkpoint.id });
    },
  );

  app.patch<{ Params: { id: string }; Body: FinalizeBody }>(
    '/sessions/:id/finalize',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;
      const body = request.body;

      const session = await prisma.session.findFirst({
        where: { id, userId, status: SessionStatus.active },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Active session not found' });
      }

      if (
        !body?.endedAt ||
        body.durationSeconds == null ||
        body.distanceMiles == null ||
        !Array.isArray(body.route)
      ) {
        return reply.code(400).send({ error: 'Missing finalize fields' });
      }

      const endedAt = new Date(body.endedAt);
      // `skipOrientation` used to auto-approve a free 1-hour orientation credit.
      // That product path is off — every volunteer finalize stays under_review
      // (or invalid). Ignore the flag so older clients cannot auto-approve.
      const durationSeconds =
        session.startedAt != null
          ? Math.max(
              0,
              Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000),
            )
          : body.durationSeconds;

      const nextStatus =
        body.status === SessionStatus.invalid
          ? SessionStatus.invalid
          : SessionStatus.under_review;

      // Advisory only — computed from the client's own submitted route/distance/duration,
      // never used to change `nextStatus` or reject the finalize. See
      // docs/agents/session-abuse-checklist.md section 1 and `sessionPlausibility.ts`.
      const plausibilitySignal = computePlausibilitySignal(
        body.route,
        body.distanceMiles,
        durationSeconds,
      );

      const updated = await prisma.session.update({
        where: { id },
        data: {
          endedAt,
          durationSeconds,
          distanceMiles: body.distanceMiles,
          route: body.route,
          status: nextStatus,
          plausibilitySignal: plausibilitySignal as unknown as Prisma.InputJsonValue,
        },
      });

      if (nextStatus === SessionStatus.under_review) {
        void sendAdminReviewEmail(updated.id, updated.activity);
      }

      return reply.send({
        id: updated.id,
        status: updated.status,
      });
    },
  );

  app.get<{ Querystring: { status?: string; limit?: string; offset?: string } }>(
    '/sessions',
    { preHandler: verifyAuth },
    async (request) => {
      const { userId } = request as AuthenticatedRequest;
      const { status, limit = '50', offset = '0' } = request.query;

      const where: Prisma.SessionWhereInput = { userId };
      if (status && Object.values(SessionStatus).includes(status as SessionStatus)) {
        where.status = status as SessionStatus;
      }

      const sessions = await prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit) || 50, 100),
        skip: Number(offset) || 0,
        include: {
          _count: {
            select: { checkpoints: true },
          },
        },
      });

      return { sessions: sessions.map(serializeSession) };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/sessions/:id',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;

      const session = await prisma.session.findFirst({
        where: { id, userId },
        include: { checkpoints: { orderBy: { capturedAt: 'asc' } } },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      const { checkpoints, ...rest } = session;
      return {
        session: serializeSession(rest),
        checkpoints: checkpoints.map((cp) => ({
          id: cp.id,
          selfiePath: cp.selfiePath,
          progressPath: cp.progressPath,
          capturedAt: cp.capturedAt?.toISOString() ?? null,
          submittedEarly: cp.submittedEarly,
          latitude: cp.latitude ?? null,
          longitude: cp.longitude ?? null,
        })),
      };
    },
  );

  app.patch<{ Params: { id: string }; Body: ApprovalBody }>(
    '/sessions/:id/approval',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const adminKey = process.env.ADMIN_API_KEY;
      const providedKey = request.headers['x-admin-key'];
      if (!adminKey || providedKey !== adminKey) {
        return reply.code(403).send({ error: 'Admin access required' });
      }

      if (
        !body?.status ||
        !['approved', 'not_approved', 'invalid'].includes(body.status)
      ) {
        return reply.code(400).send({ error: 'Invalid status' });
      }

      const updated = await prisma.session.update({
        where: { id },
        data: { status: body.status as SessionStatus },
      });

      return { id: updated.id, status: updated.status };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/sessions/:id',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;

      const session = await prisma.session.findFirst({
        where: { id, userId },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      if (session.status === SessionStatus.approved) {
        return reply.code(409).send({ error: 'Approved sessions cannot be deleted' });
      }

      await prisma.session.delete({
        where: { id },
      });

      // Feeds admin-web-app's volunteer pattern rollup (delete/resubmit detection,
      // see docs/agents/session-abuse-checklist.md §3) — same `admin_audit_log` table
      // `writeAuditLog` in admin-web-app writes to, inserted directly since this
      // service has no Supabase client, only a direct Postgres connection via Prisma.
      await prisma.$executeRaw`
        INSERT INTO public.admin_audit_log (admin_user_id, action, target_table, target_id, before_value)
        VALUES (${userId}::uuid, 'volunteer deleted session', 'sessions', ${id}::uuid, ${JSON.stringify(session)}::jsonb)
      `;

      return reply.code(204).send();
    },
  );

  app.post<{ Body: FeedbackBody }>(
    '/feedback',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const body = request.body;

      if (!body?.source || !body?.rating) {
        return reply.code(400).send({ error: 'source and rating are required' });
      }

      if (!['session', 'account'].includes(body.source)) {
        return reply.code(400).send({ error: 'source must be session or account' });
      }

      if (!['excited', 'happy', 'neutral', 'sad', 'very_sad'].includes(body.rating)) {
        return reply.code(400).send({ error: 'Invalid rating value' });
      }

      const result = await prisma.$queryRaw<[{ id: string }]>`
        INSERT INTO public.volunteer_feedback (user_id, session_id, source, rating, comment)
        VALUES (${userId}::uuid, ${body.sessionId ?? null}::uuid, ${body.source}, ${body.rating}, ${body.comment ?? null})
        RETURNING id
      `;

      const feedbackId = result[0]?.id;

      return reply.code(201).send({ ok: true, id: feedbackId });
    },
  );
}
