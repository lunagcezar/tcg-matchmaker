import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { createSecretClient } from '../db/client.js';
import {
  createReport,
  listReports,
  resolveReport,
  listUsers,
  deleteUser,
  banUserAction,
  unbanUserAction,
  promoteUserAction,
  removeAvatar,
  getAuditLog,
} from './service.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const reportRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
const adminRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

reportRouter.post('/', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createReport(supabase, c.var.user.id, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

reportRouter.get('/', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listReports(supabase));
});

reportRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as {
    status?: string;
    admin_notes?: string;
  };
  if (!body.status || (body.status !== 'resolved' && body.status !== 'dismissed')) {
    return c.json(
      { data: null, error: "Status must be 'resolved' or 'dismissed'", meta: null },
      400,
    );
  }
  const result = await resolveReport(
    supabase,
    c.var.user.id,
    c.req.param('id')!,
    body as { status: 'resolved' | 'dismissed'; admin_notes?: string },
  );
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

adminRouter.get('/users', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listUsers(supabase));
});

adminRouter.delete('/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await deleteUser(supabase, c.var.user.id, c.req.param('id')!);
  if (result.error) return c.json(result, 400);
  return c.json(result);
});

adminRouter.post('/users/:id/ban', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await banUserAction(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

adminRouter.post('/users/:id/unban', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await unbanUserAction(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

adminRouter.post('/users/:id/promote', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await promoteUserAction(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 400);
  return c.json(result);
});

adminRouter.delete('/users/:id/avatar', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await removeAvatar(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

adminRouter.get('/audit-log', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await getAuditLog(supabase));
});

export { reportRouter, adminRouter };
