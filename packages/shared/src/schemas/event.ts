import { z } from "zod";

export const CreateEventSchema = z.object({
  type: z.enum(["match", "tournament", "trading"]),
  organizer_user_id: z.string().uuid().optional(),
  organizer_store_id: z.string().uuid().optional(),
  country: z.string().default("Brasil"),
  state: z.string().default("Ceará"),
  city: z.string().default("Fortaleza"),
  custom_location_name: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  scheduled_at: z.string().datetime(),
  end_at: z.string().datetime().optional(),
  tcg_id: z.string().uuid().optional(),
  format_id: z.string().uuid().optional(),
  max_participants: z.number().int().positive().optional(),
  bracket_type: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "pool_play"]).optional(),
});

export const EventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["match", "tournament", "trading"]),
  created_by_user_id: z.string().uuid(),
  organizer_user_id: z.string().uuid().nullable(),
  organizer_store_id: z.string().uuid().nullable(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  custom_location_name: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  details: z.string().nullable(),
  scheduled_at: z.string().datetime(),
  end_at: z.string().datetime().nullable(),
  status: z.enum(["open", "challenged", "confirmed", "in_progress", "active", "completed", "cancelled", "draft", "planned"]),
  tcg_id: z.string().uuid().nullable(),
  tcg_name: z.string().nullable(),
  format_id: z.string().uuid().nullable(),
  format_name: z.string().nullable(),
  max_participants: z.number().int().nullable(),
  bracket_type: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "pool_play"]).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const EventParticipantSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["opponent", "participant"]),
  status: z.enum(["pending", "confirmed", "declined", "checked_in"]),
  confirmed_at: z.string().datetime().nullable(),
  score: z.string().nullable(),
  placement: z.number().int().nullable(),
  seed: z.number().int().nullable(),
  created_at: z.string().datetime(),
});

export type CreateEventInput = z.input<typeof CreateEventSchema>;
export type Event = z.infer<typeof EventSchema>;
export type EventParticipant = z.infer<typeof EventParticipantSchema>;
