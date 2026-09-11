import type { Role } from '@tcg/shared';
import type { Context, Next } from 'hono';

import { createAuthClient } from '../db/client.js';
import { unauthorized, notFound, forbidden } from '../lib/responses.js';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
};

type ResolveResult =
  | { status: 'ok'; user: AuthUser }
  | { status: 'unauthorized' }
  | { status: 'deleted' }
  | { status: 'banned' };

async function resolveUser(c: Context): Promise<ResolveResult> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { status: 'unauthorized' };
  }

  const token = authHeader.slice(7);
  const authClient = createAuthClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY);
  const dbClient = c.var.db;

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return { status: 'unauthorized' };
  }

  const { data: userRecord, error: dbError } = await dbClient
    .from('users')
    .select('id, email, username, role, banned_at, deleted_at')
    .eq('id', authData.user.id)
    .single();

  if (dbError || !userRecord) {
    return { status: 'unauthorized' };
  }

  if (userRecord.deleted_at) {
    return { status: 'deleted' };
  }

  if (userRecord.banned_at) {
    return { status: 'banned' };
  }

  return {
    status: 'ok',
    user: {
      id: userRecord.id,
      email: userRecord.email,
      username: userRecord.username,
      role: userRecord.role as Role,
    } satisfies AuthUser,
  };
}

export async function authMiddleware(c: Context, next: Next) {
  const result = await resolveUser(c);
  if (result.status === 'ok') {
    c.set('user', result.user);
    await next();
    return;
  }
  if (result.status === 'deleted') {
    return notFound(c, 'Account not found');
  }
  if (result.status === 'banned') {
    return forbidden(c, 'Account is banned');
  }
  return unauthorized(c);
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const result = await resolveUser(c);
  if (result.status === 'ok') {
    c.set('user', result.user);
  }
  await next();
}
