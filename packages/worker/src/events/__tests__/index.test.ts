import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { Hono } from "hono";
import { eventRouter } from "../index.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable",
};

const userId = "00000000-0000-0000-0000-000000000001";
const eventId = "00000000-0000-0000-0000-000000000100";

function makeApp() {
  return new Hono<{
    Bindings: typeof env;
    Variables: { user: { id: string; email: string; username: string; role: string } };
  }>().route("/api/events", eventRouter);
}

function chain(overrides?: Record<string, unknown>) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
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

function authMock(userId: string) {
  const userChain = chain({
    single: vi.fn().mockResolvedValue({
      data: { id: userId, email: "a@b.com", username: "u", role: "player", banned_at: null, deleted_at: null },
      error: null,
    }),
  });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") return userChain;
      return chain();
    }),
  } as any;
}

describe("Event routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/events", () => {
    it("returns 401 when not authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Unauthorized" } }) },
        from: vi.fn(),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/events", { method: "POST" }, env);
      expect(res.status).toBe(401);
    });

    it("creates a match and returns 201", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        ...authMock(userId),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: userId, email: "a@b.com", username: "u", role: "player", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({
              data: {
                id: eventId, type: "match", created_by_user_id: userId,
                organizer_user_id: userId, organizer_store_id: null,
                country: "Brasil", state: "Ceará", city: "Fortaleza",
                custom_location_name: null, lat: -3.7, lng: -38.5,
                name: null, description: null, details: null,
                scheduled_at: "2026-07-20T14:00:00.000Z", end_at: null,
                status: "open", tcg_id: null, tcg_name: null,
                format_id: null, format_name: null,
                max_participants: 2, bracket_type: null,
                created_at: "2026-07-14T00:00:00.000Z",
                updated_at: "2026-07-14T00:00:00.000Z", deleted_at: null,
              },
              error: null,
            }),
            insert: vi.fn().mockReturnThis(),
          });
          if (table === "event_participants") return chain();
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/events", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match", scheduled_at: "2026-07-20T14:00:00.000Z",
          lat: -3.7, lng: -38.5,
        }),
      }, env);
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.data.type).toBe("match");
    });
  });

  describe("GET /api/events", () => {
    it("returns a list of events", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(chain({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/events", {}, env);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe("POST /api/events/:id/join", () => {
    it("returns 401 when not authenticated", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Unauthorized" } }) },
        from: vi.fn(),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(401);
    });

    it("adds participant with pending status", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const eventChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: eventId, type: "match", status: "open", max_participants: null,
            created_by_user_id: "other-user",
          },
          error: null,
        }),
      });
      const participantChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "00000000-0000-0000-0000-000000000010", event_id: eventId, user_id: userId,
            role: "opponent", status: "pending",
            confirmed_at: null, score: null, placement: null, seed: null,
            created_at: "2026-07-14T00:00:00.000Z",
          },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      vi.mocked(createClient).mockReturnValue({
        ...authMock(userId),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: userId, email: "a@b.com", username: "u", role: "player", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return eventChain;
          if (table === "event_participants") return participantChain;
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/events/:id", () => {
    it("returns 403 when user is not the creator", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        ...authMock("other-user-id"),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: "other-user-id", email: "b@b.com", username: "o", role: "player", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: eventId, created_by_user_id: "creator-id" },
              error: null,
            }),
          });
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(403);
    });
  });
});
