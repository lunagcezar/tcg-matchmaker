import { hc } from 'hono/client';
import type { AppType } from '@tcg/worker';

type Client = ReturnType<typeof hc<AppType>>;

let cachedClient: Client | null = null;

export function getClient(): Client {
  if (!cachedClient) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
    cachedClient = hc<AppType>(baseUrl);
  }
  return cachedClient;
}
