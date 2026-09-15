import type { FastifyInstance } from 'fastify';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { deleteVolunteerAccount } from '../lib/accountDeletion.js';

export async function registerAccountRoutes(app: FastifyInstance) {
  app.delete(
    '/users/me',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      try {
        const result = await deleteVolunteerAccount(userId);
        return result;
      } catch (error) {
        request.log.error({ err: error, userId }, 'account deletion failed');
        const message = error instanceof Error ? error.message : 'Could not delete account';
        if (message.includes('misconfigured')) {
          return reply.code(503).send({ error: message });
        }
        return reply.code(500).send({ error: 'Could not delete account. Please try again.' });
      }
    },
  );
}
