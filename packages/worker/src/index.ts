import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as Sentry from '@sentry/hono';
import { authRouter } from './auth/index.js';
import { tcgRouter, formatRouter } from './tcgs/index.js';
import { storeRouter } from './stores/index.js';
import { eventRouter } from './events/index.js';
import { tournamentRouter, bracketMatchRouter } from './tournaments/index.js';
import { geocodeRouter } from './geocoding/index.js';
import { reportRouter, adminRouter } from './moderation/index.js';
import { notificationRouter, pushSubscriptionRouter } from './notifications/index.js';
import { createLogger } from './middleware/logger.js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  SENTRY_DSN: string;
  NOMINATIM_USER_AGENT: string;
  GEOCODING_KV: KVNamespace;
  RATE_LIMIT_KV?: KVNamespace;
};

type Variables = {
  user: {
    id: string;
    email: string;
    username: string;
    role: 'player' | 'organizer' | 'admin';
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  '*',
  cors({
    origin: ['http://localhost:9000', 'http://localhost:1420', 'https://*.pages.dev'],
    credentials: true,
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/auth', authRouter);
app.route('/api/tcgs', tcgRouter);
app.route('/api/formats', formatRouter);
app.route('/api/stores', storeRouter);
app.route('/api/events', eventRouter);
app.route('/api/tournaments', tournamentRouter);
app.route('/api/bracket-matches', bracketMatchRouter);
app.route('/api/geocode', geocodeRouter);
app.route('/api/reports', reportRouter);
app.route('/api/admin', adminRouter);
app.route('/api/notifications', notificationRouter);
app.route('/api/push-subscriptions', pushSubscriptionRouter);

// Turnstile verification
app.post('/api/verify-turnstile', async (c) => {
  const { token } = (await c.req.json().catch(() => ({}))) as { token?: string };
  if (!token) return c.json({ data: null, error: 'Token required', meta: null }, 400);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: c.env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const body = (await res.json()) as { success: boolean };
  return c.json({ data: { success: body.success }, error: null, meta: null });
});

app.notFound((c) => c.json({ data: null, error: 'Not found', meta: null }, 404));

// Logger — Sentry transport is configured via env in production
const logger = createLogger({ level: 'debug' });

app.onError((err, c) => {
  logger.critical('Unhandled error', { error: err, path: c.req.path, method: c.req.method });
  return c.json({ data: null, error: 'Internal server error', meta: null }, 500);
});

export default app;
export type AppType = typeof app;
