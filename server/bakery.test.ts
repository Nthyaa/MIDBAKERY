import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
type AdminUser = AuthenticatedUser & { role: "admin" };

function createUserContext(role: "user" | "admin" = "user"): { ctx: TrpcContext; } {
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
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Bakery Website - Core Features", () => {
  describe("Menu Management", () => {
    it("should allow public access to menu list", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      const result = await caller.menu.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should allow admin to list all menu items", async () => {
      const { ctx } = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.menuList();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should deny non-admin access to admin menu list", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.menuList();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Discount Management", () => {
    it("should allow public access to discounts list", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      const result = await caller.discounts.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should allow admin to list all discounts", async () => {
      const { ctx } = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.discountsList();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should deny non-admin access to admin discounts list", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.discountsList();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Authentication", () => {
    it("should return current user info", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      const user = await caller.auth.me();
      expect(user).toEqual(ctx.user);
      expect(user.role).toBe("user");
    });

    it("should allow logout and clear cookie", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });

    it("should return null for unauthenticated user", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      const user = await caller.auth.me();
      expect(user).toBeNull();
    });
  });

  describe("Cart Operations", () => {
    it("should allow authenticated users to view their cart", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      const cart = await caller.cart.list();
      expect(Array.isArray(cart)).toBe(true);
    });

    it("should deny unauthenticated users access to cart", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      try {
        await caller.cart.list();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("Order Management", () => {
    it("should allow authenticated users to view their orders", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      const orders = await caller.orders.list();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should deny unauthenticated users access to orders", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      try {
        await caller.orders.list();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should allow admin to list all orders", async () => {
      const { ctx } = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);
      const orders = await caller.admin.ordersList();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should deny non-admin access to admin orders list", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.ordersList();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Admin Authorization", () => {
    it("should verify admin role for menu operations", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.menuCreate({
          name: "Test Item",
          price: 1000,
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should verify admin role for discount operations", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.discountCreate({
          menuItemId: 1,
          discountPercentage: 50,
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should verify admin role for order updates", async () => {
      const { ctx } = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.orderUpdate({
          id: 1,
          status: "completed",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Public Access", () => {
    it("should allow public access to menu", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      const menu = await caller.menu.list();
      expect(Array.isArray(menu)).toBe(true);
    });

    it("should allow public access to discounts", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      const discounts = await caller.discounts.list();
      expect(Array.isArray(discounts)).toBe(true);
    });

    it("should allow public access to discount for specific item", async () => {
      const caller = appRouter.createCaller({ user: null } as any);
      const discount = await caller.discounts.forItem({ menuItemId: 1 });
      expect(discount === null || typeof discount === "object").toBe(true);
    });
  });
});
