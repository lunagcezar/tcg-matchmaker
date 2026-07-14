import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { authMiddleware } from "../auth.js";
import { mockAuthUser, mockBannedUser, mockDeletedUser } from "../../test-utils/mocks.js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test-key",
};

function createTestApp() {
  const app = new Hono<{
    Bindings: typeof env;
    Variables: { user: typeof mockAuthUser };
  }>();

  app.get("/test", authMiddleware, (c) => {
    return c.json({ data: c.var.user, error: null, meta: null });
  });

  return app;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header is present", async () => {
    const app = createTestApp();
    const res = await app.request("/test", {}, env);
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const app = createTestApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Basic token" },
    }, env);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid token" },
        }),
      },
    } as any);

    const app = createTestApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer invalid-token" },
    }, env);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is banned", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockBannedUser.id } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBannedUser, error: null }),
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    const app = createTestApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer valid-token" },
    }, env);
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error).toBe("Account is banned");
  });

  it("returns 404 when user is deleted", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockDeletedUser.id } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDeletedUser, error: null }),
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    const app = createTestApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer valid-token" },
    }, env);
    expect(res.status).toBe(404);
  });

  it("passes through for valid user", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockAuthUser.id } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockAuthUser.id,
            email: mockAuthUser.email,
            username: mockAuthUser.username,
            role: mockAuthUser.role,
            banned_at: null,
            deleted_at: null,
          },
          error: null,
        }),
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    const app = createTestApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer valid-token" },
    }, env);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.id).toBe(mockAuthUser.id);
  });
});
