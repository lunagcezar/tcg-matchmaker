import { z } from 'zod';

export const BracketRoundSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  round_number: z.number().int(),
  name: z.string(),
  created_at: z.string().datetime(),
});

export const BracketMatchSchema = z.object({
  id: z.string().uuid(),
  round_id: z.string().uuid(),
  player1_id: z.string().uuid().nullable(),
  player2_id: z.string().uuid().nullable(),
  winner_id: z.string().uuid().nullable(),
  score_player1: z.number().int().nullable(),
  score_player2: z.number().int().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'walkover']),
  next_match_id: z.string().uuid().nullable(),
  next_match_player_slot: z.number().int().nullable(),
  scheduled_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type BracketRound = z.infer<typeof BracketRoundSchema>;
export type BracketMatch = z.infer<typeof BracketMatchSchema>;
