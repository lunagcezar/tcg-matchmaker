import { createClient } from "@supabase/supabase-js";

export function createSecretClient(url: string, secretKey: string) {
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createAuthClient(url: string, publishableKey: string) {
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
