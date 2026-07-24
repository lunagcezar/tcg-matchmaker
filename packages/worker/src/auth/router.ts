import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { result, badRequest, notFound, serverError } from '../lib/responses.js';
import type { Bindings } from '../types/hono.js';
import {
  checkOnboarding,
  createFirstAdmin,
  getProfile,
  resolveIdentifier,
  updateProfile,
  suspendAccount,
  exportUserData,
  deleteAccount,
} from './service.js';

const authRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

authRouter.get('/onboarding', async (c) => {
  return result(c, await checkOnboarding(c.var.db));
});

authRouter.post('/onboarding', rateLimitMiddleware('onboarding', 10, 3600), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await createFirstAdmin(c.var.db, body);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

authRouter.get('/me', authMiddleware, async (c) => {
  const svcResult = await getProfile(c.var.db, c.var.user.id);
  if (!svcResult.data) return notFound(c, svcResult.error ?? 'Profile not found');
  return result(c, svcResult);
});

authRouter.get('/resolve/:identifier', async (c) => {
  const identifier = c.req.param('identifier');
  if (!identifier) {
    return badRequest(c, 'Identifier is required');
  }
  const svcResult = await resolveIdentifier(c.var.db, identifier);
  if (!svcResult.data) return notFound(c, svcResult.error ?? 'User not found');
  return result(c, svcResult);
});

authRouter.patch('/profile', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const svcResult = await updateProfile(c.var.db, c.var.user.id, body);
  if (svcResult.error) {
    return result(c, svcResult, svcResult.error === 'Username already taken' ? 409 : 400);
  }
  return result(c, svcResult);
});

authRouter.post('/suspend', authMiddleware, async (c) => {
  const svcResult = await suspendAccount(c.var.db, c.var.user.id);
  if (svcResult.error) return serverError(c, svcResult.error);
  return result(c, svcResult);
});

authRouter.post('/export', authMiddleware, async (c) => {
  return result(c, await exportUserData(c.var.db, c.var.user.id));
});

authRouter.delete(
  '/account',
  authMiddleware,
  rateLimitMiddleware('account_delete', 10, 900),
  async (c) => {
    const svcResult = await deleteAccount(c.var.db, c.var.user.id, c.var.user.role);
    if (svcResult.error) return badRequest(c, svcResult.error);
    return result(c, svcResult);
  },
);

export { authRouter };
