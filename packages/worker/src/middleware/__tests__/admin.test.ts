import { Hono } from 'hono';
import { describe, it, expect } from 'vitest';

import { env } from '../../test-utils/supabase.js';
import { adminMiddleware } from '../admin.js';

function createTestApp(role: string) {
  const app = new Hono<{
    Variables: { user: { id: string; email: string; username: string; role: string } };
  }>();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'test-id', email: 'test@test.com', username: 'test', role });
    await next();
  });
  app.get('/admin', adminMiddleware, (c) =>
    c.json({ data: { ok: true }, error: null, meta: null }),
  );
  return app;
}

describe('adminMiddleware', () => {
  it('returns 403 for non-admin users', async () => {
    const res = await createTestApp('player').request('/admin', {}, env);
    expect(res.status).toBe(403);
  });

  it('passes through for admin users', async () => {
    const res = await createTestApp('admin').request('/admin', {}, env);
    expect(res.status).toBe(200);
  });
});
