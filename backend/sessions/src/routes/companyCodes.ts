import type { FastifyInstance } from 'fastify';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { getServiceSupabase } from '../letterhead/supabaseAdmin.js';

type RedeemBody = {
  code?: string;
};

/**
 * Volunteer redeem for single-use company codes (`admin/db/029_company_codes.sql`).
 */
export async function registerCompanyCodeRoutes(app: FastifyInstance) {
  app.post(
    '/company-codes/redeem',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const body = (request.body ?? {}) as RedeemBody;
      const code = String(body.code ?? '')
        .trim()
        .replace(/\D/g, '')
        .slice(0, 10);

      if (!/^\d{10}$/.test(code)) {
        return reply.code(400).send({ error: 'Enter a valid 10-digit company code.' });
      }

      try {
        const supabase = getServiceSupabase();
        const { data: row, error: lookupError } = await supabase
          .from('company_codes')
          .select('id, status')
          .eq('code', code)
          .maybeSingle();

        if (lookupError) {
          request.log.error({ err: lookupError }, 'company code lookup failed');
          return reply.code(500).send({ error: 'Could not validate company code.' });
        }

        if (!row) {
          return reply.code(404).send({ error: 'Invalid company code' });
        }

        if (row.status !== 'active') {
          return reply.code(409).send({ error: 'This company code has already been used.' });
        }

        const { data: updated, error: updateError } = await supabase
          .from('company_codes')
          .update({
            status: 'used',
            used_by: userId,
            used_at: new Date().toISOString(),
          })
          .eq('id', row.id)
          .eq('status', 'active')
          .select('id')
          .maybeSingle();

        if (updateError) {
          request.log.error({ err: updateError }, 'company code redeem failed');
          return reply.code(500).send({ error: 'Could not redeem company code.' });
        }

        if (!updated) {
          return reply.code(409).send({ error: 'This company code has already been used.' });
        }

        return { ok: true };
      } catch (error) {
        request.log.error({ err: error }, 'company code redeem unexpected');
        const message = error instanceof Error ? error.message : 'Could not redeem company code';
        if (message.includes('misconfigured') || message.includes('SUPABASE')) {
          return reply.code(503).send({ error: message });
        }
        return reply.code(500).send({ error: 'Could not redeem company code.' });
      }
    },
  );
}
