import { Hono } from 'hono';
import { CreateStoreSchema, StoreSchema, StoreMembershipSchema } from '@tcg/shared';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { createSecretClient } from '../db/client.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

const storeRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

storeRouter.get('/', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from('game_stores')
    .select('*')
    .is('deleted_at', null)
    .neq('status', 'suspended')
    .order('name');

  return c.json({ data: data ?? [], error: null, meta: null });
});

storeRouter.get('/:id', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from('game_stores')
    .select('*')
    .eq('id', c.req.param('id'))
    .is('deleted_at', null)
    .single();

  if (!data) {
    return c.json({ data: null, error: 'Store not found', meta: null }, 404);
  }

  return c.json({ data: StoreSchema.parse(data), error: null, meta: null });
});

storeRouter.post('/', authMiddleware, async (c) => {
  const user = c.var.user;
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateStoreSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        data: null,
        error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        meta: null,
      },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: store, error: insertError } = await supabase
    .from('game_stores')
    .insert({ ...parsed.data, slug: slugify(parsed.data.name), created_by_user_id: user.id })
    .select()
    .single();

  if (insertError) {
    return c.json({ data: null, error: insertError.message, meta: null }, 400);
  }

  const { error: memberError } = await supabase
    .from('store_memberships')
    .insert({ store_id: store.id, user_id: user.id, role: 'owner' });

  if (memberError) {
    await supabase.from('game_stores').delete().eq('id', store.id);
    return c.json({ data: null, error: 'Failed to create store membership', meta: null }, 500);
  }

  return c.json({ data: StoreSchema.parse(store), error: null, meta: null }, 201);
});

storeRouter.patch('/:id', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: membership } = await supabase
    .from('store_memberships')
    .select('role')
    .eq('store_id', c.req.param('id'))
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'manager')) {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const allowedFields: Record<string, unknown> = {};
  if (body.name) allowedFields.name = body.name;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.address) allowedFields.address = body.address;
  if (body.phone !== undefined) allowedFields.phone = body.phone;
  if (body.website !== undefined) allowedFields.website = body.website;
  if (body.logo_path !== undefined) allowedFields.logo_path = body.logo_path;

  const { data, error } = await supabase
    .from('game_stores')
    .update({ ...allowedFields, updated_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    return c.json({ data: null, error: 'Store not found', meta: null }, 404);
  }

  return c.json({ data: StoreSchema.parse(data), error: null, meta: null });
});

storeRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('game_stores')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error || !data) {
    return c.json({ data: null, error: 'Store not found', meta: null }, 404);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

storeRouter.post('/:id/verify', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('game_stores')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    return c.json({ data: null, error: 'Store not found', meta: null }, 404);
  }

  return c.json({ data: StoreSchema.parse(data), error: null, meta: null });
});

storeRouter.post('/:id/suspend', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));

  const { data, error } = await supabase
    .from('game_stores')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: body.reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', c.req.param('id'))
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    return c.json({ data: null, error: 'Store not found', meta: null }, 404);
  }

  return c.json({ data: StoreSchema.parse(data), error: null, meta: null });
});

storeRouter.get('/:id/members', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: membership } = await supabase
    .from('store_memberships')
    .select('role')
    .eq('store_id', c.req.param('id'))
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }

  const { data } = await supabase
    .from('store_memberships')
    .select('*')
    .eq('store_id', c.req.param('id'))
    .order('created_at');

  return c.json({ data: data ?? [], error: null, meta: null });
});

storeRouter.post('/:id/members', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: membership } = await supabase
    .from('store_memberships')
    .select('role')
    .eq('store_id', c.req.param('id'))
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const targetRole = body.role ?? 'staff';

  if (membership.role === 'manager' && targetRole === 'owner') {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }

  if (membership.role === 'manager' && targetRole === 'manager') {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }

  const { data, error } = await supabase
    .from('store_memberships')
    .insert({ store_id: c.req.param('id'), user_id: body.user_id, role: targetRole })
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: StoreMembershipSchema.parse(data), error: null, meta: null }, 201);
});

storeRouter.delete('/:id/members/:userId', authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: membership } = await supabase
    .from('store_memberships')
    .select('role')
    .eq('store_id', c.req.param('id'))
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || membership.role !== 'owner') {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }

  if (c.req.param('userId') === user.id) {
    const { count } = await supabase
      .from('store_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', c.req.param('id'))
      .eq('role', 'owner');

    if (count === 1) {
      return c.json({ data: null, error: 'Cannot remove the last owner', meta: null }, 400);
    }
  }

  const { error } = await supabase
    .from('store_memberships')
    .delete()
    .eq('store_id', c.req.param('id'))
    .eq('user_id', c.req.param('userId'));

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

export { storeRouter };
