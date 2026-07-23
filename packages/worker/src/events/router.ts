import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { createSecretClient } from '../db/client.js';
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

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const eventRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

eventRouter.get('/', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(
    await listEvents(supabase, {
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      type: c.req.query('type'),
      status: c.req.query('status'),
      tcgId: c.req.query('tcg_id'),
    }),
  );
});

eventRouter.get('/:id', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getEvent(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

eventRouter.post('/', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createEvent(supabase, c.var.user.id, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

eventRouter.patch('/:id', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await updateEventById(supabase, c.var.user.id, c.req.param('id')!, body);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 404);
  return c.json(result);
});

eventRouter.delete('/:id', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await cancelEvent(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 404);
  return c.json(result);
});

eventRouter.get('/:id/participants', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listParticipants(supabase, c.req.param('id')!));
});

eventRouter.post('/:id/join', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await joinEvent(supabase, c.var.user.id, c.req.param('id')!);
  if (result.error) return c.json(result, 400);
  return c.json(result);
});

eventRouter.post('/:id/confirm', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await confirmParticipation(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

eventRouter.post('/:id/decline', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await declineParticipation(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

export { eventRouter };
