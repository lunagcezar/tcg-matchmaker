import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { createSecretClient } from '../db/client.js';
import {
  createTournament,
  listTournaments,
  getTournament,
  updateTournament,
  publishTournament,
  cancelTournament,
  registerForTournament,
  checkInParticipant,
  startTournament,
  getBracket,
  reportMatchResult,
  walkoverMatch,
} from './service.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const tournamentRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
const bracketMatchRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

tournamentRouter.post('/', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createTournament(supabase, c.var.user.id, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

tournamentRouter.get('/', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listTournaments(supabase, c.req.query('status')));
});

tournamentRouter.get('/:id', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getTournament(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

tournamentRouter.patch('/:id', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await updateTournament(supabase, c.var.user.id, c.req.param('id')!, body);
  if (!result.data) return c.json(result, 403);
  return c.json(result);
});

tournamentRouter.post('/:id/publish', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await publishTournament(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 400);
  return c.json(result);
});

tournamentRouter.post('/:id/cancel', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await cancelTournament(supabase, c.var.user.id, c.req.param('id')!);
  if (result.error) return c.json(result, 403);
  return c.json(result);
});

tournamentRouter.post('/:id/register', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await registerForTournament(supabase, c.var.user.id, c.req.param('id')!);
  if (result.error) return c.json(result, 400);
  return c.json(result);
});

tournamentRouter.post('/:id/check-in', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as { user_id: string };
  const result = await checkInParticipant(
    supabase,
    c.var.user.id,
    c.req.param('id')!,
    body.user_id,
  );
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 404);
  return c.json(result);
});

tournamentRouter.post('/:id/start', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await startTournament(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 400);
  return c.json(result);
});

tournamentRouter.get('/:id/bracket', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getBracket(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

bracketMatchRouter.post('/:id/report', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await reportMatchResult(supabase, c.var.user.id, c.req.param('id')!, body);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 404);
  return c.json(result);
});

bracketMatchRouter.post('/:id/walkover', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as { winner_id?: string };
  const result = await walkoverMatch(supabase, c.var.user.id, c.req.param('id')!, body.winner_id);
  if (!result.data) return c.json(result, result.error === 'Forbidden' ? 403 : 404);
  return c.json(result);
});

export { tournamentRouter, bracketMatchRouter };
