import { Hono } from 'hono';
import { CreateReportSchema, ReportSchema } from '@tcg/shared';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { createSecretClient } from '../db/client.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const reportRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
const adminRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

async function logAudit(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
) {
  await supabase.from('audit_log').insert({
    action,
    actor_id: actorId,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  });
}

reportRouter.post('/', authMiddleware, async (c) => {
  const user = c.var.user;
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateReportSchema.safeParse(body);

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

  const { data, error } = await supabase
    .from('reports')
    .insert({ ...parsed.data, reporter_id: user.id })
    .select()
    .single();

  if (error) return c.json({ data: null, error: error.message, meta: null }, 400);

  return c.json({ data: ReportSchema.parse(data), error: null, meta: null }, 201);
});

reportRouter.get('/', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  return c.json({ data: data ?? [], error: null, meta: null });
});

reportRouter.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const user = c.var.user;
  const body = await c.req.json().catch(() => ({}));
  const status = body.status;
  if (status !== 'resolved' && status !== 'dismissed') {
    return c.json(
      { data: null, error: "Status must be 'resolved' or 'dismissed'", meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      admin_notes: body.admin_notes ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', c.req.param('id'))
    .select()
    .single();

  if (error || !data) return c.json({ data: null, error: 'Report not found', meta: null }, 404);

  await logAudit(supabase, user.id, 'report_resolved', 'report', c.req.param('id')!, { status });

  return c.json({ data: ReportSchema.parse(data), error: null, meta: null });
});

adminRouter.get('/users', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from('users')
    .select('id, username, email, role, banned_at, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return c.json({ data: data ?? [], error: null, meta: null });
});

adminRouter.delete('/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const user = c.var.user;
  const targetId = c.req.param('id')!;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', targetId)
    .is('deleted_at', null);

  if (error) return c.json({ data: null, error: error.message, meta: null }, 400);

  await logAudit(supabase, user.id, 'user_deleted', 'user', targetId);

  return c.json({ data: { success: true }, error: null, meta: null });
});

adminRouter.post('/users/:id/ban', authMiddleware, adminMiddleware, async (c) => {
  const user = c.var.user;
  const targetId = c.req.param('id')!;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('users')
    .update({ banned_at: new Date().toISOString(), ban_reason: null })
    .eq('id', targetId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error || !data) return c.json({ data: null, error: 'User not found', meta: null }, 404);

  await logAudit(supabase, user.id, 'user_banned', 'user', targetId);

  return c.json({ data: { success: true }, error: null, meta: null });
});

adminRouter.post('/users/:id/unban', authMiddleware, adminMiddleware, async (c) => {
  const user = c.var.user;
  const targetId = c.req.param('id')!;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('users')
    .update({ banned_at: null, ban_reason: null })
    .eq('id', targetId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error || !data) return c.json({ data: null, error: 'User not found', meta: null }, 404);

  await logAudit(supabase, user.id, 'user_unbanned', 'user', targetId);

  return c.json({ data: { success: true }, error: null, meta: null });
});

adminRouter.post('/users/:id/promote', authMiddleware, adminMiddleware, async (c) => {
  const user = c.var.user;
  const targetId = c.req.param('id')!;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: target } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', targetId)
    .is('deleted_at', null)
    .single();

  if (!target) return c.json({ data: null, error: 'User not found', meta: null }, 404);
  if (target.role === 'admin')
    return c.json({ data: null, error: 'User is already an admin', meta: null }, 400);

  const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', targetId);

  if (error) return c.json({ data: null, error: error.message, meta: null }, 400);

  await logAudit(supabase, user.id, 'user_promoted', 'user', targetId);

  return c.json({ data: { success: true }, error: null, meta: null });
});

adminRouter.delete('/users/:id/avatar', authMiddleware, adminMiddleware, async (c) => {
  const user = c.var.user;
  const targetId = c.req.param('id')!;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from('users')
    .update({ avatar_path: null })
    .eq('id', targetId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error || !data) return c.json({ data: null, error: 'User not found', meta: null }, 404);

  await logAudit(supabase, user.id, 'avatar_removed', 'user', targetId);

  return c.json({ data: { success: true }, error: null, meta: null });
});

adminRouter.get('/audit-log', authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return c.json({ data: data ?? [], error: null, meta: null });
});

export { reportRouter, adminRouter };
