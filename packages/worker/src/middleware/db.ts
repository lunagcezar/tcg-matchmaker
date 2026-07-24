import type { Context, Next } from 'hono';
import { createSecretClient } from '../db/client.js';

export async function dbClientMiddleware(c: Context, next: Next) {
  c.set('db', createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY));
  await next();
}
