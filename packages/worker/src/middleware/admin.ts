import type { Context, Next } from 'hono';
import { ROLES } from '@tcg/shared';
import { forbidden } from '../lib/responses.js';

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.var.user;
  if (user.role !== ROLES[2]) {
    return forbidden(c);
  }
  await next();
}
