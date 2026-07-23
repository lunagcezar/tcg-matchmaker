import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { createSecretClient } from '../db/client.js';
import {
  listTcgs,
  getTcg,
  createTcg,
  editTcg,
  removeTcg,
  listFormats,
  createFormat,
  editFormat,
  removeFormat,
} from './service.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const tcgRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

tcgRouter.get('/', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listTcgs(supabase));
});

tcgRouter.get('/:id', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getTcg(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

tcgRouter.post('/', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createTcg(supabase, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

tcgRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await editTcg(supabase, c.req.param('id')!, body);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

tcgRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await removeTcg(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

tcgRouter.get('/:tcgId/formats', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listFormats(supabase, c.req.param('tcgId')!));
});

tcgRouter.post('/:tcgId/formats', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createFormat(supabase, c.req.param('tcgId')!, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

const formatRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

formatRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await editFormat(supabase, c.req.param('id')!, body);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

formatRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await removeFormat(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

export { tcgRouter, formatRouter };
