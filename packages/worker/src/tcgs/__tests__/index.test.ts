import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { Hono } from "hono";
import { tcgRouter, formatRouter } from "../index.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
};

function makeUser(role: string) {
  return {
    id: "user-0001",
    email: `${role}@test.com`,
    username: role,
    role,
  };
}

describe("TCG routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tcgs", () => {
    it("returns a list of TCGs", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const mockTcg = {
        id: "tcg-1", name: "MTG", slug: "mtg",
        description: null, logo_path: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z", deleted_at: null,
      };
      const chain = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockTcg], error: null }),
      };
      chain.select.mockReturnValue(chain);
      chain.is.mockReturnValue(chain);

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(chain),
      } as any);

      const app = new Hono<{ Bindings: typeof env; Variables: { user: ReturnType<typeof makeUser> } }>();
      app.route("/api/tcgs", tcgRouter);

      const res = await app.request("/api/tcgs", {}, env);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe("MTG");
    });
  });

  describe("POST /api/tcgs", () => {
    it("returns 401 when not authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "No auth" } }) },
        from: vi.fn(),
      } as any);

      const app = new Hono<{ Bindings: typeof env; Variables: { user: ReturnType<typeof makeUser> } }>();
      app.route("/api/tcgs", tcgRouter);

      const res = await app.request("/api/tcgs", {
        method: "POST",
        body: JSON.stringify({ name: "Test", slug: "test" }),
      }, env);
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not admin", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const player = makeUser("player");
      const userChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...player, banned_at: null, deleted_at: null },
          error: null,
        }),
      };
      userChain.select.mockReturnValue(userChain);
      userChain.eq.mockReturnValue(userChain);

      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: player.id } }, error: null }),
        },
        from: vi.fn().mockReturnValue(userChain),
      } as any);

      const app = new Hono<{ Bindings: typeof env; Variables: { user: ReturnType<typeof makeUser> } }>();
      app.route("/api/tcgs", tcgRouter);

      const res = await app.request("/api/tcgs", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", slug: "test" }),
      }, env);
      expect(res.status).toBe(403);
    });

    it("creates a TCG when admin is authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = makeUser("admin");
      const createdTcg = {
        id: "00000000-0000-0000-0000-000000000010", name: "Test TCG", slug: "test-tcg",
        description: null, logo_path: null,
        created_at: "2026-07-14T00:00:00.000Z",
        updated_at: "2026-07-14T00:00:00.000Z", deleted_at: null,
      };
      const userChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...admin, banned_at: null, deleted_at: null },
          error: null,
        }),
      };
      userChain.select.mockReturnValue(userChain);
      userChain.eq.mockReturnValue(userChain);

      const tcgChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdTcg, error: null }),
      };
      tcgChain.select.mockReturnValue(tcgChain);
      tcgChain.eq.mockReturnValue(tcgChain);
      tcgChain.insert.mockReturnValue(tcgChain);

      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: admin.id } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return userChain;
          return tcgChain;
        }),
      } as any);

      const app = new Hono<{ Bindings: typeof env; Variables: { user: ReturnType<typeof makeUser> } }>();
      app.route("/api/tcgs", tcgRouter);

      const res = await app.request("/api/tcgs", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test TCG", slug: "test-tcg" }),
      }, env);
      expect(res.status).toBe(201);
      const body2: any = await res.json();
      expect(body2.data.name).toBe("Test TCG");
    });
  });

  describe("DELETE /api/tcgs/:id", () => {
    it("soft-deletes a TCG", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = makeUser("admin");
      const userChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...admin, banned_at: null, deleted_at: null },
          error: null,
        }),
      };
      userChain.select.mockReturnValue(userChain);
      userChain.eq.mockReturnValue(userChain);

      const tcgChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "tcg-1" }, error: null }),
      };
      tcgChain.select.mockReturnValue(tcgChain);
      tcgChain.eq.mockReturnValue(tcgChain);
      tcgChain.is.mockReturnValue(tcgChain);
      tcgChain.update.mockReturnValue(tcgChain);

      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: admin.id } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return userChain;
          return tcgChain;
        }),
      } as any);

      const app = new Hono<{ Bindings: typeof env; Variables: { user: ReturnType<typeof makeUser> } }>();
      app.route("/api/tcgs", tcgRouter);

      const res = await app.request("/api/tcgs/tcg-1", {
        method: "DELETE",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(200);
      const body3: any = await res.json();
      expect(body3.data.success).toBe(true);
    });
  });
});
