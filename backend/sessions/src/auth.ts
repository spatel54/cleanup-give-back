import type { FastifyReply, FastifyRequest } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');

const JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

export type AuthenticatedRequest = FastifyRequest & {
  userId: string;
  /** From the JWT's `email` claim — undefined for anonymous/no-email accounts. */
  email?: string;
  isAdmin?: boolean;
};

export async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!JWKS || !SUPABASE_URL) {
    reply.code(500).send({ error: 'Server misconfigured: missing SUPABASE_URL' });
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
    });

    const sub = payload.sub;
    if (!sub || typeof sub !== 'string') {
      reply.code(401).send({ error: 'Invalid token: missing subject' });
      return;
    }

    (request as AuthenticatedRequest).userId = sub;
    if (typeof payload.email === 'string') {
      (request as AuthenticatedRequest).email = payload.email;
    }
  } catch {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

/** Volunteer JWT or `x-admin-key` (admin may access any volunteer's sessions). */
export async function verifyAuthOrAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey = request.headers['x-admin-key'];
  if (adminKey && typeof providedKey === 'string' && providedKey === adminKey) {
    (request as AuthenticatedRequest).isAdmin = true;
    return;
  }

  await verifyAuth(request, reply);
}

/** Admin proxy only (`X-Admin-Key`). Volunteer JWTs are not accepted. */
export async function verifyAdminKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey = request.headers['x-admin-key'];
  if (adminKey && typeof providedKey === 'string' && providedKey === adminKey) {
    (request as AuthenticatedRequest).isAdmin = true;
    return;
  }

  reply.code(401).send({ error: 'Admin key required' });
}
