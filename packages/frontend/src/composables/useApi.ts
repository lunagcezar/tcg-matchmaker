import { hc } from 'hono/client';

let cachedClient: ReturnType<typeof hc> | null = null;

export function useApi() {
  if (!cachedClient) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
    cachedClient = hc(baseUrl);
  }
  return cachedClient;
}
