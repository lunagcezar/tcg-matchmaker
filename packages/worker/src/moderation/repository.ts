import type { createSecretClient } from '../db/client.js';

export async function insertReport(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('reports').insert(input).select().single();
  return { data, error };
}

export async function findAllReports(supabase: ReturnType<typeof createSecretClient>) {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function updateReport(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('reports')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function findAllUsers(supabase: ReturnType<typeof createSecretClient>) {
  const { data } = await supabase
    .from('users')
    .select('id, username, email, role, banned_at, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function softDeleteUser(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  return { error };
}

export async function banUser(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ banned_at: new Date().toISOString(), ban_reason: null })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single();
  return { data, error };
}

export async function unbanUser(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ banned_at: null, ban_reason: null })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single();
  return { data, error };
}

export async function findUserById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}

export async function promoteUser(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', id);
  return { error };
}

export async function removeUserAvatar(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
) {
  const { data, error } = await supabase
    .from('users')
    .update({ avatar_path: null })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single();
  return { data, error };
}

export async function insertAuditLog(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  await supabase.from('audit_log').insert(input);
}

export async function findRecentAuditLog(supabase: ReturnType<typeof createSecretClient>) {
  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}
