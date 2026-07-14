import { Hono } from "hono";
import {
  SignupSchema,
  ProfileUpdateSchema,
  OnboardingStatusSchema,
  UserResponseSchema,
  AccountActionResponseSchema,
} from "@tcg/shared";
import type { AuthUser } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { createSecretClient } from "../db/client.js";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
};

const authRouter = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();

authRouter.get("/onboarding", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .is("deleted_at", null);

  return c.json({
    data: OnboardingStatusSchema.parse({ hasAdmin: (count ?? 0) > 0 }),
    error: null,
    meta: null,
  });
});

authRouter.post("/onboarding", async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    return c.json({ data: null, error: "Admin already exists", meta: null }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const secretClient = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { data: authData, error: authError } = await secretClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return c.json({ data: null, error: authError?.message ?? "Failed to create user", meta: null }, 400);
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: parsed.data.email,
    username: parsed.data.username,
    display_name: parsed.data.display_name,
    role: "admin",
  });

  if (insertError) {
    await secretClient.auth.admin.deleteUser(authData.user.id);
    return c.json({ data: null, error: "Failed to create user profile", meta: null }, 500);
  }

  await supabase.from("consents").insert({
    user_id: authData.user.id,
    policy_version: "1.0",
  });

  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  return c.json(
    {
      data: userRecord ? UserResponseSchema.parse(userRecord) : null,
      error: null,
      meta: null,
    },
    201,
  );
});

authRouter.get("/me", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userRecord) {
    return c.json({ data: null, error: "User not found", meta: null }, 404);
  }

  return c.json({ data: UserResponseSchema.parse(userRecord), error: null, meta: null });
});

authRouter.patch("/profile", authMiddleware, async (c) => {
  const user = c.var.user;
  const body = await c.req.json().catch(() => ({}));
  const parsed = ProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { data: null, error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`, meta: null },
      400,
    );
  }

  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { error: updateError } = await supabase
    .from("users")
    .update({ display_name: parsed.data.display_name, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return c.json({ data: null, error: "Failed to update profile", meta: null }, 500);
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return c.json({ data: userRecord ? UserResponseSchema.parse(userRecord) : null, error: null, meta: null });
});

authRouter.post("/suspend", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { error } = await supabase
    .from("users")
    .update({ suspended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return c.json({ data: null, error: "Failed to suspend account", meta: null }, 500);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

authRouter.post("/export", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  const { data: userRecord } = await supabase.from("users").select("*").eq("id", user.id).single();
  const { data: consents } = await supabase.from("consents").select("*").eq("user_id", user.id);

  return c.json({
    data: { profile: userRecord, consents: consents ?? [] },
    error: null,
    meta: null,
  });
});

authRouter.delete("/account", authMiddleware, async (c) => {
  const user = c.var.user;
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);

  if (user.role === "admin") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .is("deleted_at", null);

    if (count === 1) {
      return c.json(
        { data: null, error: "Promote another admin before deleting your account", meta: null },
        400,
      );
    }
  }

  const secretClient = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const { error: deleteError } = await secretClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return c.json({ data: null, error: "Failed to delete account", meta: null }, 500);
  }

  const { data: deletedUsers, error: anonymizeError } = await supabase
    .from("users")
    .update({
      display_name: `Deleted User #${user.id.slice(0, 8)}`,
      avatar_path: null,
      email: `deleted-${user.id.slice(0, 8)}@deleted.local`,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id");

  if (anonymizeError || !deletedUsers || deletedUsers.length === 0) {
    return c.json({ data: null, error: "Failed to anonymize profile", meta: null }, 500);
  }

  return c.json({ data: { success: true }, error: null, meta: null });
});

export { authRouter };
