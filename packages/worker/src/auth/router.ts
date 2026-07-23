import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { createSecretClient } from '../db/client.js';
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

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  RATE_LIMIT_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
};

const authRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

authRouter.get('/onboarding', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await checkOnboarding(supabase));
});

authRouter.post('/onboarding', rateLimitMiddleware('onboarding', 10, 3600), async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await createFirstAdmin(supabase, body);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

authRouter.get('/me', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getProfile(supabase, c.var.user.id);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

authRouter.get('/resolve/:identifier', async (c) => {
  const identifier = c.req.param('identifier');
  if (!identifier) {
    return c.json({ data: null, error: 'Identifier is required', meta: null }, 400);
  }
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await resolveIdentifier(supabase, identifier);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

authRouter.patch('/profile', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const result = await updateProfile(supabase, c.var.user.id, body);
  if (result.error) return c.json(result, result.error === 'Username already taken' ? 409 : 400);
  return c.json(result);
});

authRouter.post('/suspend', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await suspendAccount(supabase, c.var.user.id);
  if (result.error) return c.json(result, 500);
  return c.json(result);
});

authRouter.post('/export', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await exportUserData(supabase, c.var.user.id));
});

authRouter.delete(
  '/account',
  authMiddleware,
  rateLimitMiddleware('account_delete', 10, 900),
  async (c) => {
    const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
    const result = await deleteAccount(supabase, c.var.user.id, c.var.user.role);
    if (result.error) return c.json(result, 400);
    return c.json(result);
  },
);

export { authRouter };
