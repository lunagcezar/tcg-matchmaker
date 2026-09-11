import {
  CreateEventSchema,
  EventSchema,
  EventParticipantSchema,
  BracketMatchSchema,
  ReportMatchSchema,
} from '@tcg/shared';

import type { createSecretClient } from '../db/client.js';
import { validate } from '../lib/validation.js';
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateRoundRobin,
  generateSwiss,
  generatePoolPlay,
} from './bracket-generators.js';
import {
  insertEvent,
  findTournaments,
  findTournamentById,
  findEventById,
  updateEvent,
  findEventParticipants,
  countEventParticipants,
  findExistingParticipant,
  insertParticipant,
  updateParticipantByEvent,
  findAllMatchesByEvent,
  findMatchById,
  updateMatch,
  findRoundById,
} from './repository.js';

function orgGuard(uid: string, creatorId: string) {
  return uid === creatorId;
}

export async function createTournament(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: unknown,
) {
  const parsed = validate(CreateEventSchema, body);
  if (!parsed.success) {
    return { data: null, error: parsed.error, meta: null };
  }

  const { data, error } = await insertEvent(supabase, {
    ...(parsed.data as Record<string, unknown>),
    type: 'tournament',
    created_by_user_id: userId,
    organizer_user_id: parsed.data.organizer_user_id ?? userId,
    status: 'draft',
  });

  if (error) return { data: null, error: error.message, meta: null };
  return { data: EventSchema.parse(data!), error: null, meta: null };
}

export async function listTournaments(
  supabase: ReturnType<typeof createSecretClient>,
  status?: string,
) {
  const data = await findTournaments(supabase, status);
  return { data, error: null, meta: null };
}

export async function getTournament(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const data = await findTournamentById(supabase, id);
  if (!data) return { data: null, error: 'Tournament not found', meta: null };
  const count = await countEventParticipants(supabase, id);
  return {
    data: { ...EventSchema.parse(data!), participant_count: count },
    error: null,
    meta: null,
  };
}

export async function updateTournament(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  tournamentId: string,
  body: Record<string, unknown>,
) {
  const existing = await findEventById(supabase, tournamentId);
  if (!existing || !orgGuard(userId, existing.created_by_user_id)) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  const allowed: Record<string, unknown> = {};
  for (const f of [
    'name',
    'description',
    'scheduled_at',
    'end_at',
    'max_participants',
    'lat',
    'lng',
    'bracket_type',
  ]) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }

  const data = await updateEvent(supabase, tournamentId, {
    ...allowed,
    updated_at: new Date().toISOString(),
  });
  return { data: EventSchema.parse(data!), error: null, meta: null };
}

export async function publishTournament(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  tournamentId: string,
) {
  const existing = await findEventById(supabase, tournamentId);
  if (!existing || !orgGuard(userId, existing.created_by_user_id)) {
    return { data: null, error: 'Forbidden', meta: null };
  }
  if (existing.status !== 'draft') {
    return { data: null, error: 'Tournament must be in draft status', meta: null };
  }
  const data = await updateEvent(supabase, tournamentId, {
    status: 'open',
    updated_at: new Date().toISOString(),
  });
  return { data: EventSchema.parse(data!), error: null, meta: null };
}

export async function cancelTournament(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  tournamentId: string,
) {
  const existing = await findEventById(supabase, tournamentId);
  if (!existing || !orgGuard(userId, existing.created_by_user_id)) {
    return { data: null, error: 'Forbidden', meta: null };
  }
  await updateEvent(supabase, tournamentId, {
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  });
  return { data: { success: true }, error: null, meta: null };
}

export async function registerForTournament(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  tournamentId: string,
) {
  const event = await findEventById(supabase, tournamentId);
  if (!event || event.status !== 'open') {
    return { data: null, error: 'Tournament is not open for registration', meta: null };
  }

  const existing = await findExistingParticipant(supabase, event.id, userId);
  if (existing) return { data: null, error: 'Already registered', meta: null };

  if (event.max_participants) {
    const count = await countEventParticipants(supabase, event.id);
    if (count >= event.max_participants) {
      return { data: null, error: 'Tournament is full', meta: null };
    }
  }

  const data = await insertParticipant(supabase, {
    event_id: event.id,
    user_id: userId,
    role: 'participant',
    status: 'pending',
  });
  return { data: EventParticipantSchema.parse(data!), error: null, meta: null };
}

export async function checkInParticipant(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  tournamentId: string,
  participantUserId: string,
) {
  const existing = await findEventById(supabase, tournamentId);
  if (!existing || !orgGuard(userId, existing.created_by_user_id)) {
    return { data: null, error: 'Forbidden', meta: null };
  }
  const data = await updateParticipantByEvent(supabase, tournamentId, participantUserId, {
    status: 'checked_in',
  });
  if (!data) return { data: null, error: 'Participant not found', meta: null };
  return { data: EventParticipantSchema.parse(data!), error: null, meta: null };
}

export async function startTournament(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  tournamentId: string,
) {
  const existing = await findEventById(supabase, tournamentId);
  if (!existing || !orgGuard(userId, existing.created_by_user_id)) {
    return { data: null, error: 'Forbidden', meta: null };
  }
  if (existing.status !== 'open') {
    return { data: null, error: 'Tournament must be open to start', meta: null };
  }

  const participants = await findEventParticipants(supabase, tournamentId);
  const ids = participants.map((p: { user_id: string }) => p.user_id);

  const bracketType = existing.bracket_type || 'single_elimination';
  const generators: Record<
    string,
    (s: typeof supabase, t: string, ids: string[]) => Promise<void>
  > = {
    single_elimination: generateSingleElimination,
    double_elimination: generateDoubleElimination,
    round_robin: generateRoundRobin,
    swiss: generateSwiss,
    pool_play: generatePoolPlay,
  };
  const generator = generators[bracketType] ?? generators.single_elimination;
  await generator(supabase, tournamentId, ids);

  const data = await updateEvent(supabase, tournamentId, {
    status: 'in_progress',
    updated_at: new Date().toISOString(),
  });
  return { data: EventSchema.parse(data!), error: null, meta: null };
}

export async function getBracket(
  supabase: ReturnType<typeof createSecretClient>,
  tournamentId: string,
) {
  const event = await findEventById(supabase, tournamentId);
  if (!event) return { data: null, error: 'Tournament not found', meta: null };
  const result = await findAllMatchesByEvent(supabase, tournamentId);
  return { data: result, error: null, meta: null };
}

async function orgGuardByMatch(
  supabase: ReturnType<typeof createSecretClient>,
  matchId: string,
  userId: string,
): Promise<boolean> {
  const match = await findMatchById(supabase, matchId);
  if (!match) return false;
  const round = await findRoundById(supabase, match.round_id);
  if (!round) return false;
  const event = await findEventById(supabase, round.event_id);
  return event?.created_by_user_id === userId;
}

export async function reportMatchResult(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  matchId: string,
  body: unknown,
) {
  if (!matchId) return { data: null, error: 'Match ID required', meta: null };

  if (!(await orgGuardByMatch(supabase, matchId, userId))) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  const parsed = validate(ReportMatchSchema, body);
  if (!parsed.success) {
    return { data: null, error: parsed.error, meta: null };
  }

  const { winner_id: winnerId, score_player1: score1, score_player2: score2 } = parsed.data;

  const match = await findMatchById(supabase, matchId);
  if (!match || match.status === 'completed' || match.status === 'walkover') {
    return { data: null, error: 'Match not found or already completed', meta: null };
  }

  await updateMatch(supabase, matchId, {
    winner_id: winnerId,
    score_player1: score1,
    score_player2: score2,
    status: 'completed',
    updated_at: new Date().toISOString(),
  });

  if (match.next_match_id && winnerId) {
    const slot = match.next_match_player_slot;
    const updateField = slot === 1 ? { player1_id: winnerId } : { player2_id: winnerId };
    await updateMatch(supabase, match.next_match_id, updateField);
  }

  const updated = await findMatchById(supabase, matchId);
  return { data: BracketMatchSchema.parse(updated!), error: null, meta: null };
}

export async function walkoverMatch(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  matchId: string,
  winnerId: string | undefined,
) {
  if (!matchId) return { data: null, error: 'Match ID required', meta: null };

  if (!(await orgGuardByMatch(supabase, matchId, userId))) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  const match = await findMatchById(supabase, matchId);
  if (!match || match.status === 'completed' || match.status === 'walkover') {
    return { data: null, error: 'Match not found or already completed', meta: null };
  }

  await updateMatch(supabase, matchId, {
    winner_id: winnerId,
    status: 'walkover',
    updated_at: new Date().toISOString(),
  });

  if (match.next_match_id && winnerId) {
    const slot = match.next_match_player_slot;
    const updateField = slot === 1 ? { player1_id: winnerId } : { player2_id: winnerId };
    await updateMatch(supabase, match.next_match_id, updateField);
  }

  const updated = await findMatchById(supabase, matchId);
  return { data: BracketMatchSchema.parse(updated!), error: null, meta: null };
}
