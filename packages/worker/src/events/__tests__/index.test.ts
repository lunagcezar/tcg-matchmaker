import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import {
  env,
  testUserId,
  testUserId2,
  chain,
  createTestApp,
  userChain,
  authMock,
} from '../../test-utils/supabase.js';
import { eventRouter } from '../index.js';

const eventId = '00000000-0000-0000-0000-000000000100';

const eventData = {
  id: eventId,
  type: 'match',
  created_by_user_id: testUserId,
  organizer_user_id: testUserId,
  organizer_store_id: null,
  country: 'Brasil',
  state: 'Ceará',
  city: 'Fortaleza',
  custom_location_name: null,
  lat: -3.7,
  lng: -38.5,
  name: null,
  description: null,
  details: null,
  scheduled_at: '2026-07-20T14:00:00.000Z',
  end_at: null,
  status: 'open',
  tcg_id: null,
  tcg_name: null,
  format_id: null,
  format_name: null,
  max_participants: null,
  bracket_type: null,
  best_of: null,
  created_at: '2026-07-14T00:00:00.000Z',
  updated_at: '2026-07-14T00:00:00.000Z',
  deleted_at: null,
};

describe('Event routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/events', () => {
    it('returns a list of events', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp('/api/events', eventRouter).request('/api/events', {}, env);
      const body = (await res.json()) as { data: unknown[] };
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('paginates events with cursor and limit', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const rows = [
        {
          ...eventData,
          id: '00000000-0000-0000-0000-000000000101',
          scheduled_at: '2026-07-21T14:00:00.000Z',
        },
        {
          ...eventData,
          id: '00000000-0000-0000-0000-000000000102',
          scheduled_at: '2026-07-22T14:00:00.000Z',
        },
      ];
      const c = chain({ limit: vi.fn().mockResolvedValue({ data: rows, error: null }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp('/api/events', eventRouter).request(
        '/api/events?limit=1',
        {},
        env,
      );
      const body = (await res.json()) as {
        data: unknown[];
        meta: { next_cursor: string | null; limit: number };
      };
      expect(body.data).toHaveLength(1);
      expect(body.meta.limit).toBe(1);
      expect(body.meta.next_cursor).toBeTruthy();
    });
  });

  describe('POST /api/events', () => {
    it('returns 401 when not authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
        from: vi.fn(),
      });

      const res = await createTestApp('/api/events', eventRouter).request(
        '/api/events',
        { method: 'POST' },
        env,
      );
      expect(res.status).toBe(401);
    });

    it('creates a match and returns 201', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const eChain = chain({
        single: vi.fn().mockResolvedValue({ data: eventData, error: null }),
        insert: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'events') return eChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/events', eventRouter).request(
        '/api/events',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'match',
            scheduled_at: '2026-07-20T14:00:00.000Z',
            lat: -3.7,
            lng: -38.5,
          }),
        },
        env,
      );
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/events/:id/join', () => {
    it('returns 401 when not authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
        from: vi.fn(),
      });

      const res = await createTestApp('/api/events', eventRouter).request(
        `/api/events/${eventId}/join`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(401);
    });

    it('adds participant with pending status', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const eChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: eventId,
            type: 'match',
            status: 'open',
            max_participants: null,
            created_by_user_id: testUserId2,
          },
          error: null,
        }),
      });
      const pChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-0000-0000-000000000010',
            event_id: eventId,
            user_id: testUserId,
            role: 'opponent',
            status: 'pending',
            confirmed_at: null,
            score: null,
            placement: null,
            seed: null,
            created_at: '2026-07-14T00:00:00.000Z',
          },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'events') return eChain;
          if (t === 'event_participants') return pChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/events', eventRouter).request(
        `/api/events/${eventId}/join`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('returns 403 when user is not the creator', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const eChain = chain({
        single: vi.fn().mockResolvedValue({
          data: { id: eventId, created_by_user_id: testUserId2 },
          error: null,
        }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'events') return eChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/events', eventRouter).request(
        `/api/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(403);
    });
  });
});
