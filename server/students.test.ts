import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "admin" | "student" | "professor" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("students", () => {
  it("should list students", async () => {
    const ctx = createTestContext("admin");
    ctx.user!.role = "gym_admin";
    ctx.user!.gymId = 1;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.students.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should list all students with user data", async () => {
    const ctx = createTestContext("admin");
    ctx.user!.role = "gym_admin";
    ctx.user!.gymId = 1;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.students.listAll({
      gymSlug: "academia-demo",
    });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("cpf");
    }
  });
});
