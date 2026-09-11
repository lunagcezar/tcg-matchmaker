import { describe, it, expect, vi, beforeEach } from 'vitest';

import { env, makeUser, makeApp } from '../../test-utils/supabase.js';
import { authMiddleware } from '../auth.js';
import { dbClientMiddleware } from '../db.js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

const authUser = makeUser({ role: 'admin' });
const bannedUser = makeUser({
  id: '00000000-0000-0000-0000-000000000003',
  role: 'player',
  username: 'banned',
});
const deletedUser = makeUser({
  id: '00000000-0000-0000-0000-000000000004',
  role: 'player',
  username: 'deleted',
});

function createTestApp() {
  return makeApp()
    .use('*', dbClientMiddleware)
    .get('/test', authMiddleware, (c) => c.json({ data: c.var.user, error: null, meta: null }));
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no Authorization header is present', async () => {
    const app = createTestApp();
    const res = await app.request('/test', {}, env);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is not Bearer', async () => {
    const app = createTestApp();
    const res = await app.request('/test', { headers: { Authorization: 'Basic token' } }, env);
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } }),
      },
    });

    const res = await createTestApp().request(
      '/test',
      { headers: { Authorization: 'Bearer bad' } },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is banned', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: bannedUser.id } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...bannedUser, banned_at: '2026-01-01T00:00:00.000Z', deleted_at: null },
          error: null,
        }),
      }),
    });

    const res = await createTestApp().request(
      '/test',
      { headers: { Authorization: 'Bearer t' } },
      env,
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when user is deleted', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: deletedUser.id } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...deletedUser, deleted_at: '2026-01-01T00:00:00.000Z', banned_at: null },
          error: null,
        }),
      }),
    });

    const res = await createTestApp().request(
      '/test',
      { headers: { Authorization: 'Bearer t' } },
      env,
    );
    expect(res.status).toBe(404);
  });

  it('passes through for valid user', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: authUser.id } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...authUser, banned_at: null, deleted_at: null },
          error: null,
        }),
      }),
    });

    const res = await createTestApp().request(
      '/test',
      { headers: { Authorization: 'Bearer t' } },
      env,
    );
    expect(res.status).toBe(200);
  });
});
