import type { createSecretClient } from '../db/client.js';

export async function findAllTcgs(supabase: ReturnType<typeof createSecretClient>) {
  const { data } = await supabase.from('tcgs').select('*').is('deleted_at', null).order('name');
  return data ?? [];
}

export async function findTcgById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase
    .from('tcgs')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}

export async function insertTcg(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('tcgs').insert(input).select().single();
  return { data, error };
}

export async function updateTcg(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('tcgs')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();
  return { data, error };
}

export async function softDeleteTcg(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await supabase
    .from('tcgs')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single();
  return { data, error };
}

export async function findFormatsByTcg(
  supabase: ReturnType<typeof createSecretClient>,
  tcgId: string,
) {
  const { data } = await supabase
    .from('formats')
    .select('*')
    .eq('tcg_id', tcgId)
    .is('deleted_at', null)
    .order('name');
  return data ?? [];
}

export async function insertFormat(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('formats').insert(input).select().single();
  return { data, error };
}

export async function updateFormat(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('formats')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();
  return { data, error };
}

export async function softDeleteFormat(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
) {
  const { data, error } = await supabase
    .from('formats')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single();
  return { data, error };
}
