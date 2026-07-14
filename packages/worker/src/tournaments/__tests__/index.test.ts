import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { tournamentRouter, bracketMatchRouter } from "../index.js";
import { env, testUserId, chain, makeApp, userChain, authMock } from "../../test-utils/supabase.js";

const tournamentId = "00000000-0000-0000-0000-000000000100";
const roundId = "00000000-0000-0000-0000-000000000200";
const organizerId = "00000000-0000-0000-0000-000000000002";

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
  beforeEach(() => { vi.clearAllMocks(); });

  describe("POST /api/tournaments", () => {
    it("creates a tournament and returns 201", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const eChain = chain({ single: vi.fn().mockResolvedValue({ data: draftEvent, error: null }), insert: vi.fn().mockReturnThis() });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ ...authMock(organizerId), from: vi.fn().mockImplementation((t: string) => {
        if (t === "users") return userChain(organizerId);
        if (t === "events") return eChain;
        return chain();
      }) });

      const res = await makeApp().route("/api/tournaments", tournamentRouter).request("/api/tournaments", {
        method: "POST", headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tournament", name: "Test Tournament", bracket_type: "single_elimination", scheduled_at: "2026-08-01T10:00:00.000Z", lat: -3.7, lng: -38.5, max_participants: 8 }),
      }, env);
      expect(res.status).toBe(201);
    });
  });

  describe("POST /api/tournaments/:id/publish", () => {
    it("changes status from draft to open", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const eChain = chain({ single: vi.fn().mockResolvedValue({ data: { ...draftEvent, created_by_user_id: organizerId, status: "draft" }, error: null }), update: vi.fn().mockReturnThis() });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ ...authMock(organizerId), from: vi.fn().mockImplementation((t: string) => {
        if (t === "users") return userChain(organizerId);
        if (t === "events") return eChain;
        return chain();
      }) });

      const res = await makeApp().route("/api/tournaments", tournamentRouter).request(`/api/tournaments/${tournamentId}/publish`, {
        method: "POST", headers: { Authorization: "Bearer t" },
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/tournaments/:id/start", () => {
    it("generates bracket and sets status to in_progress", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const eChain = chain({ single: vi.fn().mockResolvedValue({ data: { ...draftEvent, created_by_user_id: organizerId, status: "open", bracket_type: "single_elimination" }, error: null }), update: vi.fn().mockReturnThis() });
      const pChain = chain({ order: vi.fn().mockResolvedValue({ data: [{ user_id: testUserId }], error: null }) });
      const iChain = chain({ single: vi.fn().mockResolvedValue({ data: { id: roundId }, error: null }), insert: vi.fn().mockReturnThis() });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ ...authMock(organizerId), from: vi.fn().mockImplementation((t: string) => {
        if (t === "users") return userChain(organizerId);
        if (t === "events") return eChain;
        if (t === "event_participants") return pChain;
        if (t === "bracket_rounds" || t === "bracket_matches") return iChain;
        return chain();
      }) });

      const res = await makeApp().route("/api/tournaments", tournamentRouter).request(`/api/tournaments/${tournamentId}/start`, {
        method: "POST", headers: { Authorization: "Bearer t" },
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/tournaments/:id/bracket", () => {
    it("returns rounds with matches", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const rChain = chain({ order: vi.fn().mockResolvedValue({ data: [{ id: roundId, event_id: tournamentId, round_number: 1, name: "Quarterfinals", created_at: "2026-07-14T00:00:00.000Z" }], error: null }) });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ auth: { getUser: vi.fn() }, from: vi.fn().mockImplementation((t: string) => {
        if (t === "events") return chain({ single: vi.fn().mockResolvedValue({ data: { id: tournamentId }, error: null }) });
        if (t === "bracket_rounds") return rChain;
        if (t === "bracket_matches") return chain({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });
        return chain();
      }) });

      const res = await makeApp().route("/api/tournaments", tournamentRouter).request(`/api/tournaments/${tournamentId}/bracket`, {}, env);
      const body = (await res.json()) as { data: { rounds: unknown[]; matches: unknown[] } };
      expect(body.data.rounds).toHaveLength(1);
    });
  });

  describe("POST /api/tournaments/:id/register", () => {
    it("registers a participant", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const eChain = chain({ single: vi.fn().mockResolvedValue({ data: { ...draftEvent, status: "open", max_participants: null }, error: null }) });
      const pChain = chain({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000010", event_id: tournamentId, user_id: testUserId, role: "participant", status: "pending", confirmed_at: null, score: null, placement: null, seed: null, created_at: "2026-07-14T00:00:00.000Z" }, error: null }),
        insert: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ ...authMock(), from: vi.fn().mockImplementation((t: string) => {
        if (t === "users") return userChain();
        if (t === "events") return eChain;
        if (t === "event_participants") return pChain;
        return chain();
      }) });

      const res = await makeApp().route("/api/tournaments", tournamentRouter).request(`/api/tournaments/${tournamentId}/register`, {
        method: "POST", headers: { Authorization: "Bearer t" },
      }, env);
      expect(res.status).toBe(200);
    });
  });
});
