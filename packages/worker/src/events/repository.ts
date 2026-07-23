import type { createSecretClient } from '../db/client.js';

export async function findEventsPaginated(
  supabase: ReturnType<typeof createSecretClient>,
  options: {
    cursor: { scheduled_at: string; id: string } | null;
    limit: number;
    type?: string;
    status?: string;
    tcgId?: string;
  },
) {
  let query = supabase.from('events').select('*').is('deleted_at', null);

  if (options.cursor) {
    query = query.or(
      `scheduled_at.gt.${options.cursor.scheduled_at},and(scheduled_at.eq.${options.cursor.scheduled_at},id.gt.${options.cursor.id})`,
    );
  }

  if (options.type) query = query.eq('type', options.type);
  if (options.status) query = query.eq('status', options.status);
  if (options.tcgId) query = query.eq('tcg_id', options.tcgId);

  const { data } = await query
    .order('scheduled_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(options.limit);

  return data ?? [];
}

export async function findEventById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}

export async function countEventParticipants(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
) {
  const { count } = await supabase
    .from('event_participants')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  return count ?? 0;
}

export async function insertEvent(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('events').insert(input).select().single();
  return { data, error };
}

export async function updateEvent(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function findEventOwner(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase
    .from('events')
    .select('created_by_user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}

export async function findEventParticipants(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
) {
  const { data } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at');
  return data ?? [];
}

export async function findEventForJoin(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
) {
  const { data } = await supabase
    .from('events')
    .select('id, type, status, max_participants, created_by_user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}

export async function findExistingParticipant(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function insertParticipant(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('event_participants').insert(input).select().single();
  return { data, error };
}

export async function findParticipant(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('event_participants')
    .select('id, status, event_id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function updateParticipant(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('event_participants')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}
