import { Hono } from 'hono';

import { result, badRequest, notFound } from '../lib/responses.js';
import { adminMiddleware } from '../middleware/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Bindings, Variables } from '../types/hono.js';
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

const reportRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const adminRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

reportRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createReport(c.var.db, c.var.user.id, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

reportRouter.get('/', authMiddleware, adminMiddleware, async (c) => {
  return result(c, await listReports(c.var.db));
});

reportRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    status?: string;
    admin_notes?: string;
  };
  if (!body.status || (body.status !== 'resolved' && body.status !== 'dismissed')) {
    return badRequest(c, "Status must be 'resolved' or 'dismissed'");
  }
  const svcResult = await resolveReport(
    c.var.db,
    c.var.user.id,
    c.req.param('id')!,
    body as { status: 'resolved' | 'dismissed'; admin_notes?: string },
  );
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

adminRouter.get('/users', authMiddleware, adminMiddleware, async (c) => {
  return result(c, await listUsers(c.var.db));
});

adminRouter.delete('/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await deleteUser(c.var.db, c.var.user.id, c.req.param('id')!);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult);
});

adminRouter.post('/users/:id/ban', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await banUserAction(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

adminRouter.post('/users/:id/unban', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await unbanUserAction(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

adminRouter.post('/users/:id/promote', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await promoteUserAction(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return badRequest(c, svcResult.error ?? 'Bad request');
  return result(c, svcResult);
});

adminRouter.delete('/users/:id/avatar', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await removeAvatar(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

adminRouter.get('/audit-log', authMiddleware, adminMiddleware, async (c) => {
  return result(c, await getAuditLog(c.var.db));
});

export { reportRouter, adminRouter };
