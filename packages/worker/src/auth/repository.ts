import { ROLES } from '@tcg/shared';

import type { createSecretClient } from '../db/client.js';

export async function countAdminUsers(supabase: ReturnType<typeof createSecretClient>) {
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', ROLES[2])
    .is('deleted_at', null);
  return count ?? 0;
}

export async function insertUser(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { error } = await supabase.from('users').insert(input);
  return { error };
}

export async function insertConsent(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  await supabase.from('consents').insert(input);
}

export async function findUserById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data;
}

export async function resolveUserByIdentifier(
  supabase: ReturnType<typeof createSecretClient>,
  identifier: string,
) {
  const { data } = await supabase
    .from('users')
    .select('id, email, username')
    .is('deleted_at', null)
    .or(`email.eq.${identifier},username.eq.${identifier}`)
    .maybeSingle();
  return data;
}

export async function findUserByUsername(
  supabase: ReturnType<typeof createSecretClient>,
  username: string,
  excludeUserId: string,
) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .neq('id', excludeUserId)
    .maybeSingle();
  return data;
}

export async function updateUser(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { error } = await supabase.from('users').update(input).eq('id', id);
  return { error };
}

export async function findUserConsents(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  const { data } = await supabase.from('consents').select('*').eq('user_id', userId);
  return data ?? [];
}

export async function anonymizeUser(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  anonymizedEmail: string,
) {
  const { data, error } = await supabase
    .from('users')
    .update({
      avatar_path: null,
      email: anonymizedEmail,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id');
  return { data, error };
}
