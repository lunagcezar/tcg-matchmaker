import type { createSecretClient } from '../db/client.js';
import type { AuthUser } from '../middleware/auth.js';

declare module 'hono' {
  interface ContextVariableMap {
    db: ReturnType<typeof createSecretClient>;
  }
}

export type Bindings = {
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

export type Variables = {
  db: ReturnType<typeof createSecretClient>;
  user: AuthUser;
};
