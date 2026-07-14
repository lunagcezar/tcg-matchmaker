import { vi } from "vitest";
import { Hono } from "hono";

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
    order: vi.fn(),
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

type WorkerEnv = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
};

type WorkerVars = {
  user: { id: string; email: string; username: string; role: string };
};

export const env: WorkerEnv = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable",
};

export const testUserId = "00000000-0000-0000-0000-000000000001";
export const testUserId2 = "00000000-0000-0000-0000-000000000002";

export function makeApp() {
  return new Hono<{ Bindings: WorkerEnv; Variables: WorkerVars }>();
}

export function makeUser(overrides?: Partial<{ id: string; email: string; username: string; role: string }>) {
  return {
    id: testUserId,
    email: "a@test.com",
    username: "testuser",
    role: "player",
    ...overrides,
  };
}

export function userChain(uid: string = testUserId) {
  return chain({
    single: vi.fn().mockResolvedValue(
      toMockResponse({
        id: uid, email: "a@b.com", username: "u",
        role: "player", banned_at: null, deleted_at: null,
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
      if (table === "users") return userChain(uid);
      return chain();
    }),
  };
}

export { toMockResponse };
export type { MockResponse, WorkerEnv, WorkerVars };
