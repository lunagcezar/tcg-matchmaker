import { Hono } from 'hono';

import { result, badRequest, notFound, forbidden } from '../lib/responses.js';
import { adminMiddleware } from '../middleware/admin.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import type { Bindings, Variables } from '../types/hono.js';
import {
  listStores,
  getStore,
  createStore,
  updateStoreById,
  removeStore,
  verifyStore,
  suspendStore,
  getMembers,
  addMember,
  removeMember,
} from './service.js';

const storeRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

storeRouter.get('/', async (c) => {
  return result(c, await listStores(c.var.db, c.req.query('limit'), c.req.query('cursor')));
});

storeRouter.get('/:id', optionalAuthMiddleware, async (c) => {
  const svcResult = await getStore(c.var.db, c.req.param('id')!, c.var.user);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

storeRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createStore(c.var.db, c.var.user.id, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

storeRouter.patch('/:id', authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const svcResult = await updateStoreById(c.var.db, c.var.user.id, c.req.param('id')!, body);
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : notFound(c, svcResult.error ?? undefined);
  }
  return result(c, svcResult);
});

storeRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await removeStore(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

storeRouter.post('/:id/verify', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await verifyStore(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

storeRouter.post('/:id/suspend', authMiddleware, adminMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  const svcResult = await suspendStore(c.var.db, c.req.param('id')!, body.reason);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

storeRouter.get('/:id/members', authMiddleware, async (c) => {
  const svcResult = await getMembers(c.var.db, c.var.user, c.req.param('id')!);
  if (!svcResult.data) return forbidden(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

storeRouter.post('/:id/members', authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { user_id: string; role?: string };
  const svcResult = await addMember(c.var.db, c.var.user.id, c.req.param('id')!, body);
  if (svcResult.error) {
    return svcResult.error === 'Forbidden' ? forbidden(c) : badRequest(c, svcResult.error);
  }
  return result(c, svcResult, 201);
});

storeRouter.delete('/:id/members/:userId', authMiddleware, async (c) => {
  const svcResult = await removeMember(
    c.var.db,
    c.var.user.id,
    c.req.param('id')!,
    c.req.param('userId')!,
  );
  if (svcResult.error) {
    return svcResult.error === 'Forbidden' ? forbidden(c) : badRequest(c, svcResult.error);
  }
  return result(c, svcResult);
});

export { storeRouter };
