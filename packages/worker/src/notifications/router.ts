import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { createSecretClient } from '../db/client.js';
import {
  listNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
  addPushSubscription,
  removePushSubscription,
} from './service.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const notificationRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
const pushSubscriptionRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

notificationRouter.get('/', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await listNotifications(supabase, c.var.user.id));
});

notificationRouter.get('/unread-count', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await getUnreadCount(supabase, c.var.user.id));
});

notificationRouter.patch('/:id/read', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await readNotification(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

notificationRouter.post('/read-all', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await readAllNotifications(supabase, c.var.user.id));
});

pushSubscriptionRouter.post('/', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = (await c.req.json().catch(() => ({}))) as {
    endpoint?: string;
    p256dh?: string;
    auth?: string;
    user_agent?: string;
  };
  if (!body.endpoint || !body.p256dh || !body.auth) {
    return c.json(
      { data: null, error: 'endpoint, p256dh, and auth are required', meta: null },
      400,
    );
  }
  const result = await addPushSubscription(supabase, c.var.user.id, body as Required<typeof body>);
  if (result.error) return c.json(result, 400);
  return c.json(result, 201);
});

pushSubscriptionRouter.delete('/:id', authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await removePushSubscription(supabase, c.var.user.id, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});

export { notificationRouter, pushSubscriptionRouter };
