import { GeocodeQuerySchema, GeocodeResponseSchema, GeocodeResultSchema } from '@tcg/shared';
import type { GeocodeResponse, GeocodeResult } from '@tcg/shared';
import { Hono } from 'hono';

import { ok, badRequest, serverError } from '../lib/responses.js';
import { validate } from '../lib/validation.js';
import type { Bindings } from '../types/hono.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const CACHE_TTL = 86400; // 24 hours

const geocodeRouter = new Hono<{ Bindings: Bindings }>();

geocodeRouter.get('/search', async (c) => {
  const query = { q: c.req.query('q') };
  const validation = validate(GeocodeQuerySchema, query);
  if (!validation.success) {
    return badRequest(c, validation.error);
  }

  const q = validation.data.q;
  const cacheKey = `geocode:search:${q.trim().toLowerCase()}`;

  const cached = await c.env.GEOCODING_KV.get(cacheKey);
  if (cached) {
    return ok(c, JSON.parse(cached), { cached: true });
  }

  const url = `${NOMINATIM_BASE}/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(q.trim())}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': c.env.NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return serverError(c, 'Geocoding service unavailable');
  }

  const rawData = await res.json();
  let data: GeocodeResponse;
  try {
    data = GeocodeResponseSchema.parse(rawData);
  } catch {
    return serverError(c, 'Invalid geocoding response');
  }

  await c.env.GEOCODING_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });

  return ok(c, data);
});

geocodeRouter.get('/reverse', async (c) => {
  const lat = c.req.query('lat');
  const lng = c.req.query('lng');

  if (!lat || !lng) {
    return badRequest(c, "Parameters 'lat' and 'lng' are required");
  }

  const cacheKey = `geocode:reverse:${lat},${lng}`;

  const cached = await c.env.GEOCODING_KV.get(cacheKey);
  if (cached) {
    return ok(c, JSON.parse(cached), { cached: true });
  }

  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': c.env.NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return serverError(c, 'Geocoding service unavailable');
  }

  const rawData = await res.json();
  let data: GeocodeResult;
  try {
    data = GeocodeResultSchema.parse(rawData);
  } catch {
    return serverError(c, 'Invalid geocoding response');
  }

  await c.env.GEOCODING_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });

  return ok(c, data);
});

export { geocodeRouter };
