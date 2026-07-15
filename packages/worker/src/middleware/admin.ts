import type { Context, Next } from 'hono';

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.var.user;
  if (user.role !== 'admin') {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }
  await next();
}
