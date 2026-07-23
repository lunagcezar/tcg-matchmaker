import type { createSecretClient } from '../db/client.js';

export async function insertEvent(
  supabase: ReturnType<typeof createSecretClient>,
  input: Record<string, unknown>,
) {
  const { data, error } = await supabase.from('events').insert(input).select().single();
  return { data, error };
}

export async function findTournaments(
  supabase: ReturnType<typeof createSecretClient>,
  status?: string,
) {
  let query = supabase
    .from('events')
    .select('*')
    .eq('type', 'tournament')
    .is('deleted_at', null)
    .order('scheduled_at');

  if (status) query = query.eq('status', status);
  const { data } = await query;
  return data ?? [];
}

export async function findTournamentById(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('type', 'tournament')
    .is('deleted_at', null)
    .single();
  return data;
}

export async function findEventById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase.from('events').select('*').eq('id', id).single();
  return data;
}

export async function updateEvent(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  input: Record<string, unknown>,
) {
  const { data } = await supabase.from('events').update(input).eq('id', id).select().single();
  return data;
}

export async function findEventParticipants(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
) {
  const { data } = await supabase
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'checked_in')
    .order('seed', { ascending: true });
  return data ?? [];
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
  const { data } = await supabase.from('event_participants').insert(input).select().single();
  return data;
}

export async function updateParticipantByEvent(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  const { data } = await supabase
    .from('event_participants')
    .update(input)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  return data;
}

export async function findRoundsByEvent(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
) {
  const { data } = await supabase
    .from('bracket_rounds')
    .select('*')
    .eq('event_id', eventId)
    .order('round_number');
  return data ?? [];
}

export async function findMatchesByRound(
  supabase: ReturnType<typeof createSecretClient>,
  roundId: string,
) {
  const { data } = await supabase
    .from('bracket_matches')
    .select('*')
    .eq('round_id', roundId)
    .order('id');
  return data ?? [];
}

export async function findAllMatchesByEvent(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
) {
  const rounds = await findRoundsByEvent(supabase, eventId);
  if (rounds.length === 0) {
    return { rounds: [], matches: [] };
  }
  const matches = await findMatchesByRound(supabase, rounds[0].id);
  return { rounds, matches };
}

export async function findMatchById(
  supabase: ReturnType<typeof createSecretClient>,
  matchId: string,
) {
  const { data } = await supabase.from('bracket_matches').select('*').eq('id', matchId).single();
  return data;
}

export async function updateMatch(
  supabase: ReturnType<typeof createSecretClient>,
  matchId: string,
  input: Record<string, unknown>,
) {
  await supabase.from('bracket_matches').update(input).eq('id', matchId);
}

export async function findRoundById(
  supabase: ReturnType<typeof createSecretClient>,
  roundId: string,
) {
  const { data } = await supabase
    .from('bracket_rounds')
    .select('event_id')
    .eq('id', roundId)
    .single();
  return data;
}
