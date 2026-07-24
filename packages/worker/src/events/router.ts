import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { result, badRequest, notFound, forbidden } from '../lib/responses.js';
import type { Bindings, Variables } from '../types/hono.js';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEventById,
  cancelEvent,
  listParticipants,
  joinEvent,
  confirmParticipation,
  declineParticipation,
} from './service.js';

const eventRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

eventRouter.get('/', async (c) => {
  return result(
    c,
    await listEvents(c.var.db, {
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      type: c.req.query('type'),
      status: c.req.query('status'),
      tcgId: c.req.query('tcg_id'),
    }),
  );
});

eventRouter.get('/:id', async (c) => {
  const svcResult = await getEvent(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? 'Event not found');
  return result(c, svcResult);
});

eventRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createEvent(c.var.db, c.var.user.id, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

eventRouter.patch('/:id', authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const svcResult = await updateEventById(c.var.db, c.var.user.id, c.req.param('id')!, body);
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : notFound(c, svcResult.error ?? undefined);
  }
  return result(c, svcResult);
});

eventRouter.delete('/:id', authMiddleware, async (c) => {
  const svcResult = await cancelEvent(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : notFound(c, svcResult.error ?? undefined);
  }
  return result(c, svcResult);
});

eventRouter.get('/:id/participants', async (c) => {
  return result(c, await listParticipants(c.var.db, c.req.param('id')!));
});

eventRouter.post('/:id/join', authMiddleware, async (c) => {
  const svcResult = await joinEvent(c.var.db, c.var.user.id, c.req.param('id')!);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult);
});

eventRouter.post('/:id/confirm', authMiddleware, async (c) => {
  const svcResult = await confirmParticipation(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

eventRouter.post('/:id/decline', authMiddleware, async (c) => {
  const svcResult = await declineParticipation(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

export { eventRouter };
