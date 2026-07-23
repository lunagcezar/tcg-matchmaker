import { CreateReportSchema, ReportSchema } from '@tcg/shared';
import type { createSecretClient } from '../db/client.js';
import {
  insertReport,
  findAllReports,
  updateReport,
  findAllUsers,
  softDeleteUser,
  banUser,
  unbanUser,
  findUserById,
  promoteUser,
  removeUserAvatar,
  insertAuditLog,
  findRecentAuditLog,
} from './repository.js';

async function logAudit(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
) {
  await insertAuditLog(supabase, {
    action,
    actor_id: actorId,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  });
}

export async function createReport(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: unknown,
) {
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }
  const { data, error } = await insertReport(supabase, {
    ...(parsed.data as Record<string, unknown>),
    reporter_id: userId,
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: ReportSchema.parse(data!), error: null, meta: null };
}

export async function listReports(supabase: ReturnType<typeof createSecretClient>) {
  const data = await findAllReports(supabase);
  return { data, error: null, meta: null };
}

export async function resolveReport(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  reportId: string,
  body: { status: string; admin_notes?: string },
) {
  if (body.status !== 'resolved' && body.status !== 'dismissed') {
    return { data: null, error: "Status must be 'resolved' or 'dismissed'", meta: null };
  }
  const { data, error } = await updateReport(supabase, reportId, {
    status: body.status,
    admin_notes: body.admin_notes ?? null,
    resolved_at: new Date().toISOString(),
  });
  if (error || !data) return { data: null, error: 'Report not found', meta: null };
  await logAudit(supabase, userId, 'report_resolved', 'report', reportId, {
    status: body.status,
  });
  return { data: ReportSchema.parse(data!), error: null, meta: null };
}

export async function listUsers(supabase: ReturnType<typeof createSecretClient>) {
  const data = await findAllUsers(supabase);
  return { data, error: null, meta: null };
}

export async function deleteUser(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  targetId: string,
) {
  const { error } = await softDeleteUser(supabase, targetId);
  if (error) return { data: null, error: error.message, meta: null };
  await logAudit(supabase, actorId, 'user_deleted', 'user', targetId);
  return { data: { success: true }, error: null, meta: null };
}

export async function banUserAction(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  targetId: string,
) {
  const { data, error } = await banUser(supabase, targetId);
  if (error || !data) return { data: null, error: 'User not found', meta: null };
  await logAudit(supabase, actorId, 'user_banned', 'user', targetId);
  return { data: { success: true }, error: null, meta: null };
}

export async function unbanUserAction(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  targetId: string,
) {
  const { data, error } = await unbanUser(supabase, targetId);
  if (error || !data) return { data: null, error: 'User not found', meta: null };
  await logAudit(supabase, actorId, 'user_unbanned', 'user', targetId);
  return { data: { success: true }, error: null, meta: null };
}

export async function promoteUserAction(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  targetId: string,
) {
  const target = await findUserById(supabase, targetId);
  if (!target) return { data: null, error: 'User not found', meta: null };
  if (target.role === 'admin') {
    return { data: null, error: 'User is already an admin', meta: null };
  }
  const { error } = await promoteUser(supabase, targetId);
  if (error) return { data: null, error: error.message, meta: null };
  await logAudit(supabase, actorId, 'user_promoted', 'user', targetId);
  return { data: { success: true }, error: null, meta: null };
}

export async function removeAvatar(
  supabase: ReturnType<typeof createSecretClient>,
  actorId: string,
  targetId: string,
) {
  const { data, error } = await removeUserAvatar(supabase, targetId);
  if (error || !data) return { data: null, error: 'User not found', meta: null };
  await logAudit(supabase, actorId, 'avatar_removed', 'user', targetId);
  return { data: { success: true }, error: null, meta: null };
}

export async function getAuditLog(supabase: ReturnType<typeof createSecretClient>) {
  const data = await findRecentAuditLog(supabase);
  return { data, error: null, meta: null };
}
