import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { Hono } from "hono";
import { storeRouter } from "../index.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable",
};

const storeId = "00000000-0000-0000-0000-000000000100";
const userId1 = "00000000-0000-0000-0000-000000000001";
const userId2 = "00000000-0000-0000-0000-000000000002";

function makeApp() {
  return new Hono<{
    Bindings: typeof env;
    Variables: { user: { id: string; email: string; username: string; role: string } };
  }>().route("/api/stores", storeRouter);
}

function chainBuilder(overrides?: Record<string, unknown>) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  c.select.mockReturnValue(c);
  c.eq.mockReturnValue(c);
  c.is.mockReturnValue(c);
  c.neq.mockReturnValue(c);
  c.insert.mockReturnValue(c);
  c.update.mockReturnValue(c);
  c.delete.mockReturnValue(c);
  return c;
}

const storeData = {
  id: storeId,
  name: "Test Store",
  slug: "test-store",
  description: null,
  country: "Brasil",
  state: "Ceará",
  city: "Fortaleza",
  address: "Rua Teste, 123",
  lat: -3.7,
  lng: -38.5,
  phone: null,
  website: null,
  logo_path: null,
  created_by_user_id: userId1,
  is_verified: false,
  status: "active",
  suspended_at: null,
  suspension_reason: null,
  created_at: "2026-07-14T00:00:00.000Z",
  updated_at: "2026-07-14T00:00:00.000Z",
  deleted_at: null,
};

describe("Store routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/stores", () => {
    it("returns a list of active stores", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const chain = chainBuilder({
        order: vi.fn().mockResolvedValue({ data: [storeData], error: null }),
      });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(chain),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/stores", {}, env);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data[0].name).toBe("Test Store");
    });
  });

  describe("POST /api/stores", () => {
    it("returns 401 when not authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Unauthorized" } }) },
        from: vi.fn(),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/stores", { method: "POST" }, env);
      expect(res.status).toBe(401);
    });

    it("creates a store and returns 201", async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const insertChain = chainBuilder({
        single: vi.fn().mockResolvedValue({ data: storeData, error: null }),
      });

      const membershipChain = chainBuilder();
      const userChain = chainBuilder({
        single: vi.fn().mockResolvedValue({
          data: { id: userId1, email: "a@b.com", username: "u", role: "player", banned_at: null, deleted_at: null },
          error: null,
        }),
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId1 } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "game_stores") return insertChain;
          if (table === "store_memberships") return membershipChain;
          if (table === "users") return userChain;
          return insertChain;
        }),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/stores", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Store", address: "Rua Teste, 123", lat: -3.7, lng: -38.5 }),
      }, env);
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.data.name).toBe("Test Store");
    });
  });

  describe("PATCH /api/stores/:id", () => {
    it("returns 403 when user is not a member", async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const membershipChain = chainBuilder({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const userChain = chainBuilder({
        single: vi.fn().mockResolvedValue({
          data: { id: userId2, email: "b@b.com", username: "u2", role: "player", banned_at: null, deleted_at: null },
          error: null,
        }),
      });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId2 } }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "store_memberships") return membershipChain;
          if (table === "users") return userChain;
          return userChain;
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      }, env);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/stores/:id/verify", () => {
    it("returns 403 when user is not admin", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const userChain = chainBuilder({
        single: vi.fn().mockResolvedValue({
          data: { id: userId2, email: "b@b.com", username: "u2", role: "player", banned_at: null, deleted_at: null },
          error: null,
        }),
      });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId2 } }, error: null }) },
        from: vi.fn().mockReturnValue(userChain),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/stores/${storeId}/verify`, {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/stores/:id/members", () => {
    it("returns list of members", async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const membershipCheckChain = chainBuilder({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { store_id: storeId, user_id: userId1, role: "owner" },
          error: null,
        }),
      });

      const listChain = chainBuilder({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      listChain.eq.mockReturnValue(listChain);

      const userChain = chainBuilder({
        single: vi.fn().mockResolvedValue({
          data: { id: userId1, email: "a@b.com", username: "u", role: "player", banned_at: null, deleted_at: null },
          error: null,
        }),
      });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId1 } }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "store_memberships") return membershipCheckChain;
          if (table === "users") return userChain;
          return listChain;
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/stores/${storeId}/members`, {
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
