import {
  CreateEventSchema,
  EventSchema,
  EventParticipantSchema,
  MAX_EVENT_HORIZON_MS,
} from '@tcg/shared';

import type { createSecretClient } from '../db/client.js';
import { validate } from '../lib/validation.js';
import {
  findEventsPaginated,
  findEventById,
  countEventParticipants,
  insertEvent,
  updateEvent,
  findEventOwner,
  findEventParticipants,
  findEventForJoin,
  findExistingParticipant,
  insertParticipant,
  findParticipant,
  updateParticipant,
} from './repository.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function listEvents(
  supabase: ReturnType<typeof createSecretClient>,
  params: {
    limit?: string;
    cursor?: string;
    type?: string;
    status?: string;
    tcgId?: string;
  },
) {
  const rawLimit = params.limit;
  let limit = DEFAULT_PAGE_SIZE;
  if (rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isNaN(parsed)) {
      limit = Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE);
    }
  }

  let cursor: { scheduled_at: string; id: string } | null = null;
  if (params.cursor) {
    try {
      const decoded = Buffer.from(params.cursor, 'base64').toString('utf8');
      cursor = JSON.parse(decoded) as { scheduled_at: string; id: string };
    } catch {
      return { data: null, error: 'Invalid cursor', meta: null };
    }
  }

  const rows = await findEventsPaginated(supabase, {
    cursor,
    limit: limit + 1,
    type: params.type,
    status: params.status,
    tcgId: params.tcgId,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1] as { scheduled_at: string; id: string } | undefined;
  const nextCursor =
    hasMore && last
      ? Buffer.from(JSON.stringify({ scheduled_at: last.scheduled_at, id: last.id })).toString(
          'base64',
        )
      : null;

  return {
    data: page,
    error: null,
    meta: { next_cursor: nextCursor, limit },
  };
}

export async function getEvent(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const event = await findEventById(supabase, id);
  if (!event) return { data: null, error: 'Event not found', meta: null };

  const count = await countEventParticipants(supabase, id);
  return {
    data: { ...EventSchema.parse(event), participant_count: count },
    error: null,
    meta: null,
  };
}

export async function createEvent(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: unknown,
) {
  const parsed = validate(CreateEventSchema, body);
  if (!parsed.success) {
    return { data: null, error: parsed.error, meta: null };
  }

  const defaultStatus = parsed.data.type === 'trading' ? 'planned' : 'open';
  const { data, error } = await insertEvent(supabase, {
    ...(parsed.data as Record<string, unknown>),
    created_by_user_id: userId,
    organizer_user_id: parsed.data.organizer_user_id ?? userId,
    status: defaultStatus,
  });

  if (error) return { data: null, error: error.message, meta: null };
  return { data: EventSchema.parse(data!), error: null, meta: null };
}

export async function updateEventById(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  eventId: string,
  body: Record<string, unknown>,
) {
  const existing = await findEventOwner(supabase, eventId);
  if (!existing) return { data: null, error: 'Event not found', meta: null };
  if (existing.created_by_user_id !== userId) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  if (body.scheduled_at !== undefined) {
    const timestamp = new Date(body.scheduled_at as string).getTime();
    if (Number.isNaN(timestamp)) {
      return { data: null, error: 'Invalid scheduled date', meta: null };
    }
    if (timestamp <= Date.now()) {
      return { data: null, error: 'Event date must be in the future', meta: null };
    }
    if (timestamp > Date.now() + MAX_EVENT_HORIZON_MS) {
      return { data: null, error: 'Event date must be within 1 year', meta: null };
    }
  }

  const allowed: Record<string, unknown> = {};
  const fields = [
    'name',
    'description',
    'details',
    'scheduled_at',
    'end_at',
    'max_participants',
    'lat',
    'lng',
    'custom_location_name',
    'tcg_id',
    'format_id',
  ];
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }

  const { data, error } = await updateEvent(supabase, eventId, {
    ...allowed,
    updated_at: new Date().toISOString(),
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: EventSchema.parse(data!), error: null, meta: null };
}

export async function cancelEvent(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  eventId: string,
) {
  const existing = await findEventOwner(supabase, eventId);
  if (!existing) return { data: null, error: 'Event not found', meta: null };
  if (existing.created_by_user_id !== userId) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  const { error } = await updateEvent(supabase, eventId, {
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: { success: true }, error: null, meta: null };
}

export async function listParticipants(
  supabase: ReturnType<typeof createSecretClient>,
  eventId: string,
) {
  const data = await findEventParticipants(supabase, eventId);
  return { data, error: null, meta: null };
}

export async function joinEvent(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  eventId: string,
) {
  const event = await findEventForJoin(supabase, eventId);
  if (!event) return { data: null, error: 'Event not found', meta: null };
  if (event.type !== 'match' && event.type !== 'trading') {
    return {
      data: null,
      error: 'Only matches and trading sessions support direct joining',
      meta: null,
    };
  }
  if (event.type === 'trading' && !['planned', 'active'].includes(event.status ?? '')) {
    return { data: null, error: 'Trading session is not open for joining', meta: null };
  }
  if (event.type === 'match' && event.status !== 'open') {
    return { data: null, error: 'Event is not open for joining', meta: null };
  }
  if (event.created_by_user_id === userId) {
    return { data: null, error: 'Cannot join your own event', meta: null };
  }

  const existing = await findExistingParticipant(supabase, event.id, userId);
  if (existing) return { data: null, error: 'Already joined', meta: null };

  if (event.max_participants) {
    const count = await countEventParticipants(supabase, event.id);
    if (count >= event.max_participants) {
      return { data: null, error: 'Event is full', meta: null };
    }
  }

  const { data, error } = await insertParticipant(supabase, {
    event_id: event.id,
    user_id: userId,
    role: 'opponent',
    status: 'pending',
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: EventParticipantSchema.parse(data!), error: null, meta: null };
}

export async function confirmParticipation(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  eventId: string,
) {
  const participant = await findParticipant(supabase, eventId, userId);
  if (!participant) return { data: null, error: 'Not a participant', meta: null };

  const { data, error } = await updateParticipant(supabase, participant.id, {
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: EventParticipantSchema.parse(data!), error: null, meta: null };
}

export async function declineParticipation(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  eventId: string,
) {
  const participant = await findParticipant(supabase, eventId, userId);
  if (!participant) return { data: null, error: 'Not a participant', meta: null };

  const { data, error } = await updateParticipant(supabase, participant.id, {
    status: 'declined',
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: EventParticipantSchema.parse(data!), error: null, meta: null };
}
