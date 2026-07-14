import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { adminMiddleware } from "../admin.js";
import { mockAuthUser, mockPlayerUser } from "../../test-utils/mocks.js";

function createTestApp(role: string) {
  const app = new Hono<{ Variables: { user: { id: string; email: string; username: string; role: string } } }>();

  app.use("*", async (c, next) => {
    c.set("user", { id: "test-id", email: "test@test.com", username: "test", role });
    await next();
  });

  app.get("/admin", adminMiddleware, (c) => {
    return c.json({ data: { ok: true }, error: null, meta: null });
  });

  return app;
}

describe("adminMiddleware", () => {
  it("returns 403 for non-admin users", async () => {
    const app = createTestApp("player");
    const res = await app.request("/admin");
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("passes through for admin users", async () => {
    const app = createTestApp("admin");
    const res = await app.request("/admin");
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.ok).toBe(true);
  });
});
