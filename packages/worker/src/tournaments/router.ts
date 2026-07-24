import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { result, badRequest, notFound, forbidden } from '../lib/responses.js';
import type { Bindings, Variables } from '../types/hono.js';
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

const tournamentRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const bracketMatchRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

tournamentRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createTournament(c.var.db, c.var.user.id, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

tournamentRouter.get('/', async (c) => {
  return result(c, await listTournaments(c.var.db, c.req.query('status')));
});

tournamentRouter.get('/:id', async (c) => {
  const svcResult = await getTournament(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

tournamentRouter.patch('/:id', authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const svcResult = await updateTournament(c.var.db, c.var.user.id, c.req.param('id')!, body);
  if (!svcResult.data) return forbidden(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

tournamentRouter.post('/:id/publish', authMiddleware, async (c) => {
  const svcResult = await publishTournament(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : badRequest(c, svcResult.error ?? 'Bad request');
  }
  return result(c, svcResult);
});

tournamentRouter.post('/:id/cancel', authMiddleware, async (c) => {
  const svcResult = await cancelTournament(c.var.db, c.var.user.id, c.req.param('id')!);
  if (svcResult.error) return forbidden(c, svcResult.error);
  return result(c, svcResult);
});

tournamentRouter.post('/:id/register', authMiddleware, async (c) => {
  const svcResult = await registerForTournament(c.var.db, c.var.user.id, c.req.param('id')!);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult);
});

tournamentRouter.post('/:id/check-in', authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { user_id: string };
  const svcResult = await checkInParticipant(
    c.var.db,
    c.var.user.id,
    c.req.param('id')!,
    body.user_id,
  );
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : notFound(c, svcResult.error ?? undefined);
  }
  return result(c, svcResult);
});

tournamentRouter.post('/:id/start', authMiddleware, async (c) => {
  const svcResult = await startTournament(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : badRequest(c, svcResult.error ?? 'Bad request');
  }
  return result(c, svcResult);
});

tournamentRouter.get('/:id/bracket', async (c) => {
  const svcResult = await getBracket(c.var.db, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

bracketMatchRouter.post('/:id/report', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await reportMatchResult(c.var.db, c.var.user.id, c.req.param('id')!, body);
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : notFound(c, svcResult.error ?? undefined);
  }
  return result(c, svcResult);
});

bracketMatchRouter.post('/:id/walkover', authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { winner_id?: string };
  const svcResult = await walkoverMatch(
    c.var.db,
    c.var.user.id,
    c.req.param('id')!,
    body.winner_id,
  );
  if (!svcResult.data) {
    return svcResult.error === 'Forbidden'
      ? forbidden(c)
      : notFound(c, svcResult.error ?? undefined);
  }
  return result(c, svcResult);
});

export { tournamentRouter, bracketMatchRouter };
