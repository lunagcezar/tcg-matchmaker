import { Hono } from 'hono';

import { result, badRequest, notFound } from '../lib/responses.js';
import { adminMiddleware } from '../middleware/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Bindings, Variables } from '../types/hono.js';
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

const tcgRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

tcgRouter.get('/', async (c) => {
  return result(c, await listTcgs(c.var.db));
});

tcgRouter.get('/:id', async (c) => {
  const svcResult = await getTcg(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

tcgRouter.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createTcg(c.var.db, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

tcgRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await editTcg(c.var.db, c.req.param('id')!, body);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

tcgRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await removeTcg(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

tcgRouter.get('/:tcgId/formats', async (c) => {
  return result(c, await listFormats(c.var.db, c.req.param('tcgId')!));
});

tcgRouter.post('/:tcgId/formats', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createFormat(c.var.db, c.req.param('tcgId')!, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

const formatRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

formatRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await editFormat(c.var.db, c.req.param('id')!, body);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

formatRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const svcResult = await removeFormat(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

export { tcgRouter, formatRouter };
