import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { Hono } from "hono";
import { tournamentRouter, bracketMatchRouter } from "../index.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable",
};

const userId = "00000000-0000-0000-0000-000000000001";
const organizerId = "00000000-0000-0000-0000-000000000002";
const tournamentId = "00000000-0000-0000-0000-000000000100";
const roundId = "00000000-0000-0000-0000-000000000200";
const matchId = "00000000-0000-0000-0000-000000000300";

function chain(overrides?: Record<string, unknown>) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: undefined,
    ...overrides,
  };
  for (const key of Object.keys(c)) {
    if (vi.isMockFunction(c[key]) && !overrides?.[key]) {
      c[key].mockReturnValue(c);
    }
  }
  return c;
}

function makeApp() {
  return new Hono<{
    Bindings: typeof env;
    Variables: { user: { id: string; email: string; username: string; role: string } };
  }>()
    .route("/api/tournaments", tournamentRouter)
    .route("/api/bracket-matches", bracketMatchRouter);
}

function authMock(uid: string): any {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: uid } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") return chain({
        single: vi.fn().mockResolvedValue({
          data: { id: uid, email: "a@b.com", username: "u", role: "player", banned_at: null, deleted_at: null },
          error: null,
        }),
      });
      return chain();
    }),
  };
}

const draftEvent = {
  id: tournamentId, type: "tournament", created_by_user_id: organizerId,
  organizer_user_id: organizerId, organizer_store_id: null,
  country: "Brasil", state: "Ceará", city: "Fortaleza",
  custom_location_name: null, lat: -3.7, lng: -38.5,
  name: "Test Tournament", description: null, details: null,
  scheduled_at: "2026-08-01T10:00:00.000Z", end_at: "2026-08-01T18:00:00.000Z",
  status: "draft", tcg_id: null, tcg_name: null,
  format_id: null, format_name: null,
  max_participants: 8, bracket_type: "single_elimination",
  created_at: "2026-07-14T00:00:00.000Z", updated_at: "2026-07-14T00:00:00.000Z", deleted_at: null,
};

describe("Tournament routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/tournaments", () => {
    it("creates a tournament and returns 201", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        ...authMock(organizerId),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: organizerId, email: "o@b.com", username: "org", role: "organizer", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({ data: draftEvent, error: null }),
            insert: vi.fn().mockReturnThis(),
          });
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request("/api/tournaments", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tournament", name: "Test Tournament", bracket_type: "single_elimination",
          scheduled_at: "2026-08-01T10:00:00.000Z",
          lat: -3.7, lng: -38.5, max_participants: 8,
        }),
      }, env);
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.data.name).toBe("Test Tournament");
    });
  });

  describe("POST /api/tournaments/:id/publish", () => {
    it("changes status from draft to open", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        ...authMock(organizerId),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: organizerId, email: "o@b.com", username: "org", role: "organizer", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({ data: { ...draftEvent, created_by_user_id: organizerId, status: "draft" }, error: null }),
            update: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          });
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/tournaments/${tournamentId}/publish`, {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/tournaments/:id/start", () => {
    it("generates bracket and sets status to in_progress", async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const insertChain = chain({
        single: vi.fn().mockResolvedValue({ data: { id: tournamentId }, error: null }),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });
      const countChain = chain({
        order: vi.fn().mockResolvedValue({ data: [{ user_id: userId }, { user_id: organizerId }], error: null }),
      });

      vi.mocked(createClient).mockReturnValue({
        ...authMock(organizerId),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: organizerId, email: "o@b.com", username: "org", role: "organizer", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({ data: { ...draftEvent, created_by_user_id: organizerId, status: "open", bracket_type: "single_elimination" }, error: null }),
            update: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          });
          if (table === "event_participants") return countChain;
          if (table === "bracket_rounds") return insertChain;
          if (table === "bracket_matches") return insertChain;
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/tournaments/${tournamentId}/start`, {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/tournaments/:id/bracket", () => {
    it("returns rounds with matches", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({ data: draftEvent, error: null }),
          });
          if (table === "bracket_rounds") return chain({
            order: vi.fn().mockResolvedValue({ data: [{ id: roundId, event_id: tournamentId, round_number: 1, name: "Quarterfinals", created_at: "2026-07-14T00:00:00.000Z" }], error: null }),
          });
          if (table === "bracket_matches") return chain({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          });
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/tournaments/${tournamentId}/bracket`, {}, env);
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(Array.isArray(body.data.rounds)).toBe(true);
      expect(Array.isArray(body.data.matches)).toBe(true);
    });
  });

  describe("POST /api/tournaments/:id/register", () => {
    it("registers a participant", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      vi.mocked(createClient).mockReturnValue({
        ...authMock(userId),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") return chain({
            single: vi.fn().mockResolvedValue({
              data: { id: userId, email: "p@b.com", username: "p", role: "player", banned_at: null, deleted_at: null },
              error: null,
            }),
          });
          if (table === "events") return chain({
            single: vi.fn().mockResolvedValue({ data: { ...draftEvent, status: "open", max_participants: null }, error: null }),
          });
          if (table === "event_participants") return chain({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({
              data: { id: "00000000-0000-0000-0000-000000000010", event_id: tournamentId, user_id: userId, role: "participant", status: "pending", confirmed_at: null, score: null, placement: null, seed: null, created_at: "2026-07-14T00:00:00.000Z" },
              error: null,
            }),
            insert: vi.fn().mockReturnThis(),
          });
          return chain();
        }),
      } as any);

      const app = makeApp();
      const res = await app.request(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }, env);
      expect(res.status).toBe(200);
    });
  });
});
