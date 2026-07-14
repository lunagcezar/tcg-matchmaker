import { Hono } from "hono";
import {
  CreateTcgSchema,
  UpdateTcgSchema,
  TcgSchema,
  CreateFormatSchema,
  UpdateFormatSchema,
  FormatSchema,
} from "@tcg/shared";
import type { AuthUser } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { createSecretClient } from "../db/client.js";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};

const tcgRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

tcgRouter.get("/", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from("tcgs")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  return c.json({ data: data ?? [], error: null, meta: null });
});

tcgRouter.get("/:id", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from("tcgs")
    .select("*")
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .single();

  if (!data) {
    return c.json({ data: null, error: "TCG not found", meta: null }, 404);
  }

  return c.json({ data: TcgSchema.parse(data), error: null, meta: null });
});

tcgRouter.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateTcgSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("tcgs")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: TcgSchema.parse(data), error: null, meta: null }, 201);
});

tcgRouter.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateTcgSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("tcgs")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .select()
    .single();

  if (error || !data) {
    return c.json({ data: null, error: "TCG not found", meta: null }, 404);
  }

  return c.json({ data: TcgSchema.parse(data), error: null, meta: null });
});

tcgRouter.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("tcgs")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return c.json({ data: null, error: "TCG not found", meta: null }, 404);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

tcgRouter.get("/:tcgId/formats", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data } = await supabase
    .from("formats")
    .select("*")
    .eq("tcg_id", c.req.param("tcgId"))
    .is("deleted_at", null)
    .order("name");

  return c.json({ data: data ?? [], error: null, meta: null });
});

tcgRouter.post("/:tcgId/formats", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateFormatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("formats")
    .insert({ ...parsed.data, tcg_id: c.req.param("tcgId") })
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message, meta: null }, 400);
  }

  return c.json({ data: FormatSchema.parse(data), error: null, meta: null }, 201);
});

const formatRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

formatRouter.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateFormatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("formats")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .select()
    .single();

  if (error || !data) {
    return c.json({ data: null, error: "Format not found", meta: null }, 404);
  }

  return c.json({ data: FormatSchema.parse(data), error: null, meta: null });
});

formatRouter.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data, error } = await supabase
    .from("formats")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", c.req.param("id"))
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return c.json({ data: null, error: "Format not found", meta: null }, 404);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

export { tcgRouter, formatRouter };
