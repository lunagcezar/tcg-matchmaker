import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { createSecretClient } from '../db/client.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const notificationRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
const pushSubscriptionRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

notificationRouter.get('/', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return c.json({ data: data ?? [], error: null, meta: null });
});

notificationRouter.get('/unread-count', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  return c.json({ data: { unread_count: count ?? 0 }, error: null, meta: null });
});

notificationRouter.patch('/:id/read', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', c.req.param('id')!)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data)
    return c.json({ data: null, error: 'Notification not found', meta: null }, 404);

  return c.json({ data, error: null, meta: null });
});

notificationRouter.post('/read-all', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  return c.json({ data: { success: true }, error: null, meta: null });
});

pushSubscriptionRouter.post('/', authMiddleware, async (c) => {
  const user = c.var.user;
  const body = await c.req.json().catch(() => ({}));

  if (!body.endpoint || !body.p256dh || !body.auth) {
    return c.json(
      { data: null, error: 'endpoint, p256dh, and auth are required', meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
      user_agent: body.user_agent ?? null,
    })
    .select()
    .single();

  if (error) return c.json({ data: null, error: error.message, meta: null }, 400);

  return c.json({ data, error: null, meta: null }, 201);
});

pushSubscriptionRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', c.req.param('id')!)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (error || !data)
    return c.json({ data: null, error: 'Subscription not found', meta: null }, 404);

  return c.json({ data: { success: true }, error: null, meta: null });
});

export { notificationRouter, pushSubscriptionRouter };
