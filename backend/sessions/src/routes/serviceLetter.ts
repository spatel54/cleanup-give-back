import type { FastifyInstance } from 'fastify';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuthOrAdmin } from '../auth.js';
import { buildServiceLetterPdf, ServiceLetterError } from '../letterhead/buildServiceLetter.js';

type BulkBody = {
  sessionIds?: string[];
  courtPacket?: boolean;
};

function authContext(request: AuthenticatedRequest) {
  return {
    userId: request.userId,
    isAdmin: Boolean(request.isAdmin),
  };
}

async function sendServiceLetterPdf(
  sessionIds: string[],
  request: AuthenticatedRequest,
  reply: import('fastify').FastifyReply,
  courtPacket: boolean,
) {
  try {
    const ctx = authContext(request);
    if (!ctx.isAdmin && !ctx.userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const { buffer, filename } = await buildServiceLetterPdf(sessionIds, {
      userId: ctx.userId,
      isAdmin: ctx.isAdmin,
      includeCourtCoverSheet: courtPacket,
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(buffer);
  } catch (error) {
    if (error instanceof ServiceLetterError) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate service letter PDF' });
  }
}

export async function registerServiceLetterRoutes(app: FastifyInstance) {
  app.post<{ Body: BulkBody }>(
    '/sessions/service-letter.pdf',
    { preHandler: verifyAuthOrAdmin },
    async (request, reply) => {
      const authRequest = request as AuthenticatedRequest;
      const sessionIds = request.body?.sessionIds ?? [];
      return sendServiceLetterPdf(sessionIds, authRequest, reply, request.body?.courtPacket ?? false);
    },
  );

  app.get<{ Params: { id: string }; Querystring: { courtPacket?: string } }>(
    '/sessions/:id/service-letter.pdf',
    { preHandler: verifyAuthOrAdmin },
    async (request, reply) => {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params;
      return sendServiceLetterPdf([id], authRequest, reply, request.query?.courtPacket === 'true');
    },
  );
}
