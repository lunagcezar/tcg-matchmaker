import { STORE_MEMBERSHIP_ROLES } from '@tcg/shared';
import type { createSecretClient } from '../db/client.js';

export async function findStoresPaginated(
  supabase: ReturnType<typeof createSecretClient>,
  options: {
    cursor: { name: string; id: string } | null;
    limit: number;
  },
) {
  let query = supabase
    .from('game_stores')
    .select('*')
    .is('deleted_at', null)
    .neq('status', 'suspended');

  if (options.cursor) {
    query = query.or(
      `name.gt.${options.cursor.name},and(name.eq.${options.cursor.name},id.gt.${options.cursor.id})`,
    );
  }

  const { data } = await query.order('name').order('id').limit(options.limit);
  return data ?? [];
}

export async function findStoreById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase
    .from('game_stores')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}

export async function insertStore(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('game_stores').insert(input).select().single();
  return { data, error };
}

export async function deleteStoreById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await supabase
    .from('game_stores')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single();
  return { data, error };
}

export async function updateStore(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('game_stores')
    .update(input)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();
  return { data, error };
}

export async function findStoreMembership(
  supabase: ReturnType<typeof createSecretClient>,
  storeId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('store_memberships')
    .select('role')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function findStoreMembers(
  supabase: ReturnType<typeof createSecretClient>,
  storeId: string,
) {
  const { data } = await supabase
    .from('store_memberships')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at');
  return data ?? [];
}

export async function insertStoreMembership(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('store_memberships').insert(input).select().single();
  return { data, error };
}

export async function deleteStoreMembership(
  supabase: ReturnType<typeof createSecretClient>,
  storeId: string,
  userId: string,
) {
  const { error } = await supabase
    .from('store_memberships')
    .delete()
    .eq('store_id', storeId)
    .eq('user_id', userId);
  return { error };
}

export async function countOwnerMemberships(
  supabase: ReturnType<typeof createSecretClient>,
  storeId: string,
) {
  const { count } = await supabase
    .from('store_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('role', STORE_MEMBERSHIP_ROLES[0]);
  return count ?? 0;
}
