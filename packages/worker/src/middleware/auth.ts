import type { Context, Next } from 'hono';
import { createAuthClient, createSecretClient } from '../db/client.js';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'organizer' | 'admin';
};

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ data: null, error: 'Unauthorized', meta: null }, 401);
  }

  const token = authHeader.slice(7);
  const authClient = createAuthClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY);
  const dbClient = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return c.json({ data: null, error: 'Unauthorized', meta: null }, 401);
  }

  const { data: userRecord, error: dbError } = await dbClient
    .from('users')
    .select('id, email, username, role, banned_at, deleted_at')
    .eq('id', authData.user.id)
    .single();

  if (dbError || !userRecord) {
    return c.json({ data: null, error: 'Unauthorized', meta: null }, 401);
  }

  if (userRecord.deleted_at) {
    return c.json({ data: null, error: 'Account not found', meta: null }, 404);
  }

  if (userRecord.banned_at) {
    return c.json({ data: null, error: 'Account is banned', meta: null }, 403);
  }

  c.set('user', {
    id: userRecord.id,
    email: userRecord.email,
    username: userRecord.username,
    role: userRecord.role,
  } satisfies AuthUser);

  await next();
}
