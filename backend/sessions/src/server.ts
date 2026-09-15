import cors from '@fastify/cors';
import type { FastifyRequest } from 'fastify';
import Fastify from 'fastify';

import { prisma } from './prisma.js';
import { registerAccountRoutes } from './routes/account.js';
import { registerCompanyCodeRoutes } from './routes/companyCodes.js';
import { registerEmailRoutes } from './routes/emails.js';
import { registerPaymentRoutes } from './routes/payments.js';
import { registerServiceLetterRoutes } from './routes/serviceLetter.js';
import { registerSessionRoutes } from './routes/sessions.js';
import { registerShippingRoutes } from './routes/shipping.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

type RawBodyRequest = FastifyRequest & { rawBody?: Buffer };

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Admin-Key', 'Stripe-Signature'],
  });

  // Stripe webhook signature verification requires the unparsed JSON body.
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      try {
        const buffer = body as Buffer;
        if (req.url === '/webhooks/stripe') {
          (req as RawBodyRequest).rawBody = buffer;
          done(null, buffer);
        } else {
          done(null, JSON.parse(buffer.toString('utf8')));
        }
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  app.get('/health', async () => ({ status: 'ok' }));

  // Checked by admin-web-app's production readiness page (`lib/health-checks.ts`) to
  // confirm the Sessions API can actually reach its database, not just that the
  // process is up.
  app.get('/health/deep', async (_request, reply) => {
    const startedAt = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', checks: { database: true, timestampMs: Date.now() - startedAt } };
    } catch (error) {
      reply.status(503);
      return {
        status: 'error',
        checks: { database: false, timestampMs: Date.now() - startedAt },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  await registerServiceLetterRoutes(app);
  await registerAccountRoutes(app);
  await registerCompanyCodeRoutes(app);
  await registerSessionRoutes(app);
  await registerEmailRoutes(app);
  await registerPaymentRoutes(app);
  await registerShippingRoutes(app);

  await app.listen({ port: PORT, host: HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
