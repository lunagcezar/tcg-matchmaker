import { Hono } from "hono";
import {
  CreateEventSchema,
  EventSchema,
  EventParticipantSchema,
  BracketRoundSchema,
  BracketMatchSchema,
} from "@tcg/shared";
import type { AuthUser } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { createSecretClient } from "../db/client.js";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const tournamentRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
const bracketMatchRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

function orgGuard(uid: string, creatorId: string) {
  return uid === creatorId;
}

tournamentRouter.post("/", authMiddleware, async (c) => {
  const user = c.var.user;
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateEventSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...parsed.data,
      type: "tournament",
      created_by_user_id: user.id,
      organizer_user_id: parsed.data.organizer_user_id ?? user.id,
      status: "draft",
    })
    .select()
    .single();

  if (error) return c.json({ data: null, error: error.message, meta: null }, 400);

  return c.json({ data: EventSchema.parse(data), error: null, meta: null }, 201);
});

tournamentRouter.get("/", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  let query = supabase.from("events").select("*").eq("type", "tournament").is("deleted_at", null).order("scheduled_at");

  const status = c.req.query("status");
  if (status) query = query.eq("status", status);

  const { data } = await query;
  return c.json({ data: data ?? [], error: null, meta: null });
});

tournamentRouter.get("/:id", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data } = await supabase.from("events").select("*").eq("id", c.req.param("id")).eq("type", "tournament").is("deleted_at", null).single();
  if (!data) return c.json({ data: null, error: "Tournament not found", meta: null }, 404);

  const { count } = await supabase.from("event_participants").select("id", { count: "exact", head: true }).eq("event_id", data.id);
  return c.json({ data: { ...EventSchema.parse(data), participant_count: count ?? 0 }, error: null, meta: null });
});

tournamentRouter.patch("/:id", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: existing } = await supabase.from("events").select("created_by_user_id").eq("id", c.req.param("id")).single();
  if (!existing || !orgGuard(user.id, existing.created_by_user_id)) return c.json({ data: null, error: "Forbidden", meta: null }, 403);

  const body = await c.req.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  for (const f of ["name", "description", "scheduled_at", "end_at", "max_participants", "lat", "lng", "bracket_type"]) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }

  const { data } = await supabase.from("events").update({ ...allowed, updated_at: new Date().toISOString() }).eq("id", c.req.param("id")).select().single();
  return c.json({ data: EventSchema.parse(data), error: null, meta: null });
});

tournamentRouter.post("/:id/publish", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: existing } = await supabase.from("events").select("created_by_user_id, status").eq("id", c.req.param("id")).single();
  if (!existing || !orgGuard(user.id, existing.created_by_user_id)) return c.json({ data: null, error: "Forbidden", meta: null }, 403);
  if (existing.status !== "draft") return c.json({ data: null, error: "Tournament must be in draft status", meta: null }, 400);

  const { data } = await supabase.from("events").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", c.req.param("id")).select().single();
  return c.json({ data: EventSchema.parse(data), error: null, meta: null });
});

tournamentRouter.post("/:id/cancel", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: existing } = await supabase.from("events").select("created_by_user_id").eq("id", c.req.param("id")).single();
  if (!existing || !orgGuard(user.id, existing.created_by_user_id)) return c.json({ data: null, error: "Forbidden", meta: null }, 403);

  await supabase.from("events").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", c.req.param("id"));
  return c.json({ data: { success: true }, error: null, meta: null });
});

tournamentRouter.post("/:id/register", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: event } = await supabase.from("events").select("id, status, max_participants").eq("id", c.req.param("id")).single();
  if (!event || event.status !== "open") return c.json({ data: null, error: "Tournament is not open for registration", meta: null }, 400);

  const { data: existing } = await supabase.from("event_participants").select("id").eq("event_id", event.id).eq("user_id", user.id).maybeSingle();
  if (existing) return c.json({ data: null, error: "Already registered", meta: null }, 400);

  if (event.max_participants) {
    const { count } = await supabase.from("event_participants").select("id", { count: "exact", head: true }).eq("event_id", event.id);
    if ((count ?? 0) >= event.max_participants) return c.json({ data: null, error: "Tournament is full", meta: null }, 400);
  }

  const { data: participant } = await supabase.from("event_participants").insert({ event_id: event.id, user_id: user.id, role: "participant", status: "pending" }).select().single();
  return c.json({ data: EventParticipantSchema.parse(participant), error: null, meta: null });
});

tournamentRouter.post("/:id/check-in", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: existing } = await supabase.from("events").select("created_by_user_id").eq("id", c.req.param("id")).single();
  if (!existing || !orgGuard(user.id, existing.created_by_user_id)) return c.json({ data: null, error: "Forbidden", meta: null }, 403);

  const body = await c.req.json().catch(() => ({}));
  const { data } = await supabase.from("event_participants").update({ status: "checked_in" }).eq("event_id", c.req.param("id")).eq("user_id", body.user_id).select().single();
  if (!data) return c.json({ data: null, error: "Participant not found", meta: null }, 404);
  return c.json({ data: EventParticipantSchema.parse(data), error: null, meta: null });
});

async function generateSingleEliminationBracket(supabase: ReturnType<typeof createSecretClient>, tournamentId: string) {
  const { data: participants } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", tournamentId)
    .eq("status", "checked_in")
    .order("seed", { ascending: true });

  const ids = participants?.map((p: any) => p.user_id) ?? [];
  const totalRounds = Math.ceil(Math.log2(ids.length));
  const roundNames = ["Finals", "Semifinals", "Quarterfinals", "Round 4", "Round 5", "Round 6"];

  const roundRecords: Array<{ id: string; round_number: number; name: string }> = [];

  for (let r = 0; r < totalRounds; r++) {
    const roundNum = totalRounds - r;
    const name = roundNames[r] ?? `Round ${roundNum}`;
    const { data: roundData } = await supabase.from("bracket_rounds").insert({ event_id: tournamentId, round_number: roundNum, name }).select().single();
    if (roundData) roundRecords.push(roundData);
  }

  roundRecords.reverse();

  let matchCount = Math.pow(2, totalRounds - 1);
  const matchRecords: Array<{ id: string; round_id: string; player1_id: string | null; player2_id: string | null }> = [];

  for (const round of roundRecords) {
    for (let m = 0; m < matchCount; m++) {
      const p1 = round.round_number === 1 ? (ids[m * 2] ?? null) : null;
      const p2 = round.round_number === 1 ? (ids[m * 2 + 1] ?? null) : null;
      const { data: matchData } = await supabase.from("bracket_matches").insert({
        round_id: round.id, player1_id: p1, player2_id: p2, status: "pending",
      }).select().single();
      if (matchData) matchRecords.push(matchData);
    }
    matchCount = Math.max(1, Math.floor(matchCount / 2));
  }

  const nextRoundStart = Math.floor(matchRecords.length / 2);
  for (let i = 0; i < nextRoundStart; i++) {
    const match = matchRecords[i];
    const nextMatchIndex = Math.floor(i / 2) + nextRoundStart;
    if (nextMatchIndex < matchRecords.length) {
      const nextMatch = matchRecords[nextMatchIndex];
      await supabase.from("bracket_matches").update({
        next_match_id: nextMatch.id,
        next_match_player_slot: (i % 2) + 1,
      }).eq("id", match.id);
    }
  }
}

tournamentRouter.post("/:id/start", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: existing } = await supabase.from("events").select("created_by_user_id, status, bracket_type").eq("id", c.req.param("id")).single();
  if (!existing || !orgGuard(user.id, existing.created_by_user_id)) return c.json({ data: null, error: "Forbidden", meta: null }, 403);
  if (existing.status !== "open") return c.json({ data: null, error: "Tournament must be open to start", meta: null }, 400);

  await generateSingleEliminationBracket(supabase, c.req.param("id")!);

  const { data } = await supabase.from("events").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", c.req.param("id")).select().single();
  return c.json({ data: EventSchema.parse(data), error: null, meta: null });
});

tournamentRouter.get("/:id/bracket", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: event } = await supabase.from("events").select("id").eq("id", c.req.param("id")).single();
  if (!event) return c.json({ data: null, error: "Tournament not found", meta: null }, 404);

  const { data: rounds } = await supabase.from("bracket_rounds").select("*").eq("event_id", event.id).order("round_number");
  const { data: matches } = await supabase.from("bracket_matches").select("*").eq("round_id", rounds?.[0]?.id ?? "").order("id");
  return c.json({ data: { rounds: rounds ?? [], matches: matches ?? [] }, error: null, meta: null });
});

bracketMatchRouter.post("/:id/report", authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const winnerId = body.winner_id;
  const score1 = body.score_player1;
  const score2 = body.score_player2;

  const { data: match } = await supabase.from("bracket_matches").select("*").eq("id", c.req.param("id")).single();
  if (!match || match.status === "completed" || match.status === "walkover") return c.json({ data: null, error: "Match not found or already completed", meta: null }, 404);

  await supabase.from("bracket_matches").update({
    winner_id: winnerId, score_player1: score1, score_player2: score2, status: "completed", updated_at: new Date().toISOString(),
  }).eq("id", match.id);

  if (match.next_match_id && winnerId) {
    const slot = match.next_match_player_slot;
    const updateField = slot === 1 ? { player1_id: winnerId } : { player2_id: winnerId };
    await supabase.from("bracket_matches").update(updateField).eq("id", match.next_match_id);
  }

  const { data: updated } = await supabase.from("bracket_matches").select("*").eq("id", match.id).single();
  return c.json({ data: BracketMatchSchema.parse(updated), error: null, meta: null });
});

bracketMatchRouter.post("/:id/walkover", authMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const body = await c.req.json().catch(() => ({}));
  const winnerId = body.winner_id;

  const { data: match } = await supabase.from("bracket_matches").select("*").eq("id", c.req.param("id")).single();
  if (!match || match.status === "completed" || match.status === "walkover") return c.json({ data: null, error: "Match not found or already completed", meta: null }, 404);

  await supabase.from("bracket_matches").update({
    winner_id: winnerId, status: "walkover", updated_at: new Date().toISOString(),
  }).eq("id", match.id);

  if (match.next_match_id && winnerId) {
    const slot = match.next_match_player_slot;
    const updateField = slot === 1 ? { player1_id: winnerId } : { player2_id: winnerId };
    await supabase.from("bracket_matches").update(updateField).eq("id", match.next_match_id);
  }

  const { data: updated } = await supabase.from("bracket_matches").select("*").eq("id", match.id).single();
  return c.json({ data: BracketMatchSchema.parse(updated), error: null, meta: null });
});

export { tournamentRouter, bracketMatchRouter };
