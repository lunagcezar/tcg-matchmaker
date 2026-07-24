import type { Context, Next } from 'hono';
import { createAuthClient } from '../db/client.js';
import { unauthorized, notFound, forbidden } from '../lib/responses.js';
import type { Role } from '@tcg/shared';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
};

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(c);
  }

  const token = authHeader.slice(7);
  const authClient = createAuthClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY);
  const dbClient = c.var.db;

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return unauthorized(c);
  }

  const { data: userRecord, error: dbError } = await dbClient
    .from('users')
    .select('id, email, username, role, banned_at, deleted_at')
    .eq('id', authData.user.id)
    .single();

  if (dbError || !userRecord) {
    return unauthorized(c);
  }

  if (userRecord.deleted_at) {
    return notFound(c, 'Account not found');
  }

  if (userRecord.banned_at) {
    return forbidden(c, 'Account is banned');
  }

  c.set('user', {
    id: userRecord.id,
    email: userRecord.email,
    username: userRecord.username,
    role: userRecord.role as Role,
  } satisfies AuthUser);

  await next();
}
