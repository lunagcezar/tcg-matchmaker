import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

import { Hono } from 'hono';
import { geocodeRouter } from '../index.js';

const origFetch = globalThis.fetch;
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const env = {
  NOMINATIM_USER_AGENT: 'TCGMatchmaker/0.0',
  GEOCODING_KV: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
  },
};

const app = new Hono<{ Bindings: typeof env }>().route('/api/geocode', geocodeRouter);
const mockNominatimResponse = [
  {
    display_name: 'Rua Augusta, São Paulo, Brasil',
    lat: '-23.5505',
    lon: '-46.6333',
    type: 'road',
    importance: 0.6,
  },
  {
    display_name: 'Rua da Consolação, São Paulo, Brasil',
    lat: '-23.5560',
    lon: '-46.6430',
    type: 'road',
    importance: 0.5,
  },
];

describe('Geocode routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterAll(() => {
    globalThis.fetch = origFetch;
  });

  describe('GET /api/geocode/search', () => {
    it('returns 400 when q parameter is missing', async () => {
      const res = await app.request('/api/geocode/search', {}, env);
      expect(res.status).toBe(400);
    });

    it('returns suggestions from Nominatim', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockNominatimResponse),
      });

      const res = await app.request('/api/geocode/search?q=Rua', {}, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: Array<{ display_name: string }> };
      expect(body.data.length).toBe(2);
      expect(body.data[0].display_name).toContain('Rua Augusta');
    });

    it('caches results in KV on first request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockNominatimResponse),
      });

      await app.request('/api/geocode/search?q=Rua', {}, env);
      expect(env.GEOCODING_KV.put).toHaveBeenCalled();
    });

    it('returns cached results on repeated request', async () => {
      env.GEOCODING_KV.get = vi.fn().mockResolvedValue(JSON.stringify(mockNominatimResponse));

      const res = await app.request('/api/geocode/search?q=Rua', {}, env);
      expect(res.status).toBe(200);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/geocode/reverse', () => {
    it('returns 400 when lat or lng is missing', async () => {
      const res = await app.request('/api/geocode/reverse', {}, env);
      expect(res.status).toBe(400);
    });

    it('returns address from Nominatim', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          display_name: 'Praça do Ferreira, Fortaleza, Brasil',
          lat: '-3.7184',
          lon: '-38.5434',
        }),
      });

      const res = await app.request('/api/geocode/reverse?lat=-3.7&lng=-38.5', {}, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: Record<string, unknown> };
      expect(body.data).toBeDefined();
    });
  });
});
