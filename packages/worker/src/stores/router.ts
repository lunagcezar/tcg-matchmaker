import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { createSecretClient } from '../db/client.js';
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

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const storeRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

storeRouter.get('/', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listStores(supabase, c.req.query('limit'), c.req.query('cursor')));
});

storeRouter.get('/:id', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getStore(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

storeRouter.post('/', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createStore(supabase, c.var.user.id, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

storeRouter.patch('/:id', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await updateStoreById(supabase, c.var.user.id, c.req.param('id')!, body);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 404);
  return c.json(result);
});

storeRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await removeStore(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

storeRouter.post('/:id/verify', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await verifyStore(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

storeRouter.post('/:id/suspend', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  const result = await suspendStore(supabase, c.req.param('id')!, body.reason);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

storeRouter.get('/:id/members', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getMembers(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 403);
  return c.json(result);
});

storeRouter.post('/:id/members', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as { user_id: string; role?: string };
  const result = await addMember(supabase, c.var.user.id, c.req.param('id')!, body);
  if (result.error) return c.json(result, result.error === 'Forbidden' ? 403 : 400);
  return c.json(result, 201);
});

storeRouter.delete('/:id/members/:userId', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await removeMember(
    supabase,
    c.var.user.id,
    c.req.param('id')!,
    c.req.param('userId')!,
  );
  if (result.error) return c.json(result, result.error === 'Forbidden' ? 403 : 400);
  return c.json(result);
});

export { storeRouter };
