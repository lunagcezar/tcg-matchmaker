import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { Hono } from "hono";
import { authRouter } from "../index.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable",
};

function createTestApp() {
  const app = new Hono<{
    Bindings: typeof env;
    Variables: { user: { id: string; email: string; username: string; role: string } };
  }>();
  app.route("/api/auth", authRouter);
  return app;
}

function makeUser(user: { id: string; email: string; username: string; role: string }) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    banned_at: null,
    deleted_at: null,
  };
}

const adminUser = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  email: "admin@test.com",
  username: "admin",
  role: "admin" as const,
};

const playerUser = {
  id: "bbbbbbbb-0000-0000-0000-000000000002",
  email: "player@test.com",
  username: "player",
  role: "player" as const,
};

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/auth/onboarding", () => {
    it("returns hasAdmin: false when no admin exists", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      };
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn(), admin: { createUser: vi.fn(), deleteUser: vi.fn() } },
        from: vi.fn().mockReturnValue(chain),
      } as any);

      const app = createTestApp();
      const res = await app.request("/api/auth/onboarding", {}, env);
      const body1: any = await res.json();
      expect(res.status).toBe(200);
      expect(body1.data.hasAdmin).toBe(false);
    });

    it("returns hasAdmin: true when admin exists", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: null, error: null, count: 1 }),
      };
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn(), admin: { createUser: vi.fn(), deleteUser: vi.fn() } },
        from: vi.fn().mockReturnValue(chain),
      } as any);

      const app = createTestApp();
      const res = await app.request("/api/auth/onboarding", {}, env);
      const body2: any = await res.json();
      expect(body2.data.hasAdmin).toBe(true);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 when not authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Unauthorized" } }) },
        from: vi.fn(),
      } as any);

      const app = createTestApp();
      const res = await app.request("/api/auth/me", {}, env);
      expect(res.status).toBe(401);
    });

    it("returns user profile when authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const user = makeUser(adminUser);
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              ...user,
              display_name: "Admin User",
              avatar_path: null,
              banned_at: null,
              suspended_at: null,
              created_at: "2026-01-01T00:00:00.000Z",
            },
            error: null,
          }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      const app = createTestApp();
      const res = await app.request("/api/auth/me", {
        headers: { Authorization: "Bearer valid-token" },
      }, env);
      expect(res.status).toBe(200);
      const body3: any = await res.json();
      expect(body3.data.username).toBe("admin");
    });
  });
});
