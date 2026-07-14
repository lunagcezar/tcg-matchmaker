import { Hono } from "hono";
import {
  CreateEventSchema,
  EventSchema,
  EventParticipantSchema,
} from "@tcg/shared";
import type { AuthUser } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { createSecretClient } from "../db/client.js";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const eventRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

eventRouter.get("/", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  let query = supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true });

  const type = c.req.query("type");
  if (type) query = query.eq("type", type);

  const status = c.req.query("status");
  if (status) query = query.eq("status", status);

  const tcgId = c.req.query("tcg_id");
  if (tcgId) query = query.eq("tcg_id", tcgId);

  const { data } = await query;

  return c.json({ data: data ?? [], error: null, meta: null });
});

eventRouter.get("/:id", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .single();

  if (!event) {
    return c.json({ data: null, error: "Event not found", meta: null }, 404);
  }

  const { count } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id);

  return c.json({
    data: { ...EventSchema.parse(event), participant_count: count ?? 0 },
    error: null,
    meta: null,
  });
});

eventRouter.post("/", authMiddleware, async (c) => {
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

  const defaultStatus = parsed.data.type === "trading" ? "planned" : "open";

  const eventData: Record<string, unknown> = {
    ...parsed.data,
    created_by_user_id: user.id,
    organizer_user_id: parsed.data.organizer_user_id ?? user.id,
    status: defaultStatus,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: EventSchema.parse(data), error: null, meta: null }, 201);
});

eventRouter.patch("/:id", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: existing } = await supabase
    .from("events")
    .select("created_by_user_id")
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return c.json({ data: null, error: "Event not found", meta: null }, 404);
  }

  if (existing.created_by_user_id !== user.id) {
    return c.json({ data: null, error: "Forbidden", meta: null }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  const fields = ["name", "description", "details", "scheduled_at", "end_at", "max_participants", "lat", "lng", "custom_location_name", "tcg_id", "format_id"];
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }

  const { data, error } = await supabase
    .from("events")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"))
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: EventSchema.parse(data), error: null, meta: null });
});

eventRouter.delete("/:id", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: existing } = await supabase
    .from("events")
    .select("created_by_user_id")
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return c.json({ data: null, error: "Event not found", meta: null }, 404);
  }

  if (existing.created_by_user_id !== user.id) {
    return c.json({ data: null, error: "Forbidden", meta: null }, 403);
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"));

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

eventRouter.get("/:id/participants", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", c.req.param("id"))
    .order("created_at");

  return c.json({ data: data ?? [], error: null, meta: null });
});

eventRouter.post("/:id/join", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: event } = await supabase
    .from("events")
    .select("id, type, status, max_participants, created_by_user_id")
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .single();

  if (!event) {
    return c.json({ data: null, error: "Event not found", meta: null }, 404);
  }

  if (event.type !== "match") {
    return c.json({ data: null, error: "Only matches support direct joining", meta: null }, 400);
  }

  if (event.status !== "open") {
    return c.json({ data: null, error: "Event is not open for joining", meta: null }, 400);
  }

  if (event.created_by_user_id === user.id) {
    return c.json({ data: null, error: "Cannot join your own event", meta: null }, 400);
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return c.json({ data: null, error: "Already joined", meta: null }, 400);
  }

  if (event.max_participants) {
    const { count } = await supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id);

    if ((count ?? 0) >= event.max_participants) {
      return c.json({ data: null, error: "Event is full", meta: null }, 400);
    }
  }

  const { data: participant, error } = await supabase
    .from("event_participants")
    .insert({ event_id: event.id, user_id: user.id, role: "opponent", status: "pending" })
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: EventParticipantSchema.parse(participant), error: null, meta: null }, 200);
});

eventRouter.post("/:id/confirm", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: participant } = await supabase
    .from("event_participants")
    .select("id, status, event_id")
    .eq("event_id", c.req.param("id"))
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return c.json({ data: null, error: "Not a participant", meta: null }, 404);
  }

  const { data: updated, error } = await supabase
    .from("event_participants")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", participant.id)
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: EventParticipantSchema.parse(updated), error: null, meta: null });
});

eventRouter.post("/:id/decline", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: participant } = await supabase
    .from("event_participants")
    .select("id, status, event_id")
    .eq("event_id", c.req.param("id"))
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return c.json({ data: null, error: "Not a participant", meta: null }, 404);
  }

  const { data: updated, error } = await supabase
    .from("event_participants")
    .update({ status: "declined" })
    .eq("id", participant.id)
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: EventParticipantSchema.parse(updated), error: null, meta: null });
});

export { eventRouter };
