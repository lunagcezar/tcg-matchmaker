import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  SENTRY_DSN: string;
  NOMINATIM_USER_AGENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:9000", "http://localhost:1420", "https://*.pages.dev"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.notFound((c) => c.json({ data: null, error: "Not found", meta: null }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ data: null, error: "Internal server error", meta: null }, 500);
});

export default app;
export type AppType = typeof app;
