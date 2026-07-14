export const mockAuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@test.com",
  username: "admin_user",
  role: "admin" as const,
};

export const mockPlayerUser = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "player@test.com",
  username: "regular_player",
  role: "player" as const,
};

export const mockBannedUser = {
  id: "00000000-0000-0000-0000-000000000003",
  email: "banned@test.com",
  username: "banned_user",
  role: "player" as const,
  banned_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null as string | null,
};

export const mockDeletedUser = {
  id: "00000000-0000-0000-0000-000000000004",
  email: "deleted@test.com",
  username: "deleted_user",
  role: "player" as const,
  banned_at: null as string | null,
  deleted_at: "2026-01-01T00:00:00.000Z",
};

export const mockTcg = {
  id: "00000000-0000-0000-0000-000000000010",
  name: "Magic: The Gathering",
  slug: "mtg",
  description: "A trading card game",
  logo_path: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};

export const mockFormat = {
  id: "00000000-0000-0000-0000-000000000020",
  tcg_id: mockTcg.id,
  name: "Standard",
  slug: "standard",
  description: "The current standard format",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};
