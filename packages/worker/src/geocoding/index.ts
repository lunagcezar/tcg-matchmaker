import { Hono } from 'hono';

type Bindings = {
  NOMINATIM_USER_AGENT: string;
  GEOCODING_KV: KVNamespace;
};

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const CACHE_TTL = 86400; // 24 hours

const geocodeRouter = new Hono<{ Bindings: Bindings }>();

geocodeRouter.get('/search', async (c) => {
  const q = c.req.query('q');
  if (!q || !q.trim()) {
    return c.json({ data: null, error: "Query parameter 'q' is required", meta: null }, 400);
  }

  const cacheKey = `geocode:search:${q.trim().toLowerCase()}`;

  const cached = await c.env.GEOCODING_KV.get(cacheKey);
  if (cached) {
    return c.json({ data: JSON.parse(cached), error: null, meta: { cached: true } });
  }

  const url = `${NOMINATIM_BASE}/search?format=json&limit=5&q=${encodeURIComponent(q.trim())}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': c.env.NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return c.json({ data: null, error: 'Geocoding service unavailable', meta: null }, 502);
  }

  const data = await res.json();
  await c.env.GEOCODING_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });

  return c.json({ data, error: null, meta: null });
});

geocodeRouter.get('/reverse', async (c) => {
  const lat = c.req.query('lat');
  const lng = c.req.query('lng');

  if (!lat || !lng) {
    return c.json(
      { data: null, error: "Parameters 'lat' and 'lng' are required", meta: null },
      400,
    );
  }

  const cacheKey = `geocode:reverse:${lat},${lng}`;

  const cached = await c.env.GEOCODING_KV.get(cacheKey);
  if (cached) {
    return c.json({ data: JSON.parse(cached), error: null, meta: { cached: true } });
  }

  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': c.env.NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return c.json({ data: null, error: 'Geocoding service unavailable', meta: null }, 502);
  }

  const data = await res.json();
  await c.env.GEOCODING_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });

  return c.json({ data, error: null, meta: null });
});

export { geocodeRouter };
