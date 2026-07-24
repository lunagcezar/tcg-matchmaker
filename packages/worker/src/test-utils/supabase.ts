import { vi } from 'vitest';
import { Hono } from 'hono';
import { dbClientMiddleware } from '../middleware/db.js';
import type { Bindings, Variables } from '../types/hono.js';

type MockResponse<T = unknown> = { data: T | null; error: unknown; count?: number };

function toMockResponse<T>(data: T): MockResponse<T> {
  return { data, error: null };
}

export function chain(overrides?: Partial<Record<string, ReturnType<typeof vi.fn>>>) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    neq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  for (const key of Object.keys(c)) {
    if (vi.isMockFunction(c[key]) && !overrides?.[key]) {
      c[key].mockReturnValue(c);
    }
  }
  return c;
}

const mockKv: KVNamespace = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  getWithMetadata: vi.fn(),
} as unknown as KVNamespace;

export const env: Bindings = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SECRET_KEY: 'test-secret',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable',
  RESEND_API_KEY: 'test-resend',
  TURNSTILE_SECRET_KEY: 'test-turnstile',
  SENTRY_DSN: '',
  NOMINATIM_USER_AGENT: 'TCG Matchmaker Test',
  GEOCODING_KV: mockKv,
};

export const testUserId = '00000000-0000-0000-0000-000000000001';
export const testUserId2 = '00000000-0000-0000-0000-000000000002';

export function makeApp() {
  return new Hono<{ Bindings: Bindings; Variables: Partial<Variables> }>();
}

export function createTestApp<R>(basePath: string, router: R) {
  return makeApp()
    .use('*', dbClientMiddleware)
    .route(basePath, router as unknown as Hono<{ Bindings: Bindings; Variables: Variables }>);
}

export function makeUser(
  overrides?: Partial<{ id: string; email: string; username: string; role: string }>,
) {
  return {
    id: testUserId,
    email: 'a@test.com',
    username: 'testuser',
    role: 'player',
    ...overrides,
  };
}

export function userChain(uid: string = testUserId) {
  return chain({
    single: vi.fn().mockResolvedValue(
      toMockResponse({
        id: uid,
        email: 'a@b.com',
        username: 'u',
        role: 'player',
        banned_at: null,
        deleted_at: null,
      }),
    ),
  });
}

export function authMock(uid: string = testUserId) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: uid } }, error: null }),
      admin: { createUser: vi.fn(), deleteUser: vi.fn() },
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return userChain(uid);
      return chain();
    }),
  };
}

export { toMockResponse };
export type { MockResponse };
