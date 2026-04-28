import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { eq, and } from "drizzle-orm";
import { menuItems } from "../drizzle/schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  menu: router({
    list: publicProcedure.query(async () => {
      const { getAvailableMenuItems } = await import("./db");
      return getAvailableMenuItems();
    }),
  }),

  discounts: router({
    list: publicProcedure.query(async () => {
      const { getActiveDiscounts } = await import("./db");
      return getActiveDiscounts();
    }),
    forItem: publicProcedure.input(z.object({ menuItemId: z.number() })).query(async ({ input }) => {
      const { getDiscountForItem } = await import("./db");
      return getDiscountForItem(input.menuItemId);
    }),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserCart } = await import("./db");
      return getUserCart(ctx.user.id);
    }),
    add: protectedProcedure
      .input(z.object({ menuItemId: z.number(), quantity: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { cartItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const existing = await db
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.userId, ctx.user.id),
              eq(cartItems.menuItemId, input.menuItemId)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          return db
            .update(cartItems)
            .set({ quantity: existing[0].quantity + input.quantity })
            .where(eq(cartItems.id, existing[0].id));
        }
        
        return db.insert(cartItems).values({
          userId: ctx.user.id,
          menuItemId: input.menuItemId,
          quantity: input.quantity,
        });
      }),
    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { cartItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.delete(cartItems).where(eq(cartItems.id, input.cartItemId));
      }),
  }),

  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserOrders } = await import("./db");
      return getUserOrders(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ items: z.array(z.object({ menuItemId: z.number(), quantity: z.number() })), totalPrice: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { orders, orderItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.insert(orders).values({
          userId: ctx.user.id,
          totalPrice: input.totalPrice,
          notes: input.notes,
        });
        
        const orderId = (result as any).insertId as number;
        
        for (const item of input.items) {
          const menuItem = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId)).limit(1);
          if (menuItem.length > 0) {
            await db.insert(orderItems).values({
              orderId,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              priceAtPurchase: menuItem[0].price,
            });
          }
        }
        
        const { cartItems } = await import("../drizzle/schema");
        await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));
        
        return { success: true, orderId };
      }),
  }),

  admin: router({
    menuList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(menuItems);
    }),
    menuCreate: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), imageUrl: z.string().optional(), price: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.insert(menuItems).values({
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          price: input.price,
        });
      }),
    menuUpdate: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), imageUrl: z.string().optional(), price: z.number().optional(), available: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const updates: any = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
        if (input.price !== undefined) updates.price = input.price;
        if (input.available !== undefined) updates.available = input.available;
        return db.update(menuItems).set(updates).where(eq(menuItems.id, input.id));
      }),
    menuDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(menuItems).where(eq(menuItems.id, input.id));
      }),

    discountsList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("./db");
      const { discounts } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(discounts);
    }),
    discountCreate: protectedProcedure
      .input(z.object({ menuItemId: z.number(), discountPercentage: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { discounts } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.insert(discounts).values({
          menuItemId: input.menuItemId,
          discountPercentage: input.discountPercentage,
          active: 1,
        });
      }),
    discountUpdate: protectedProcedure
      .input(z.object({ id: z.number(), discountPercentage: z.number().optional(), active: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { discounts } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const updates: any = {};
        if (input.discountPercentage !== undefined) updates.discountPercentage = input.discountPercentage;
        if (input.active !== undefined) updates.active = input.active;
        return db.update(discounts).set(updates).where(eq(discounts.id, input.id));
      }),
    discountDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { discounts } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(discounts).where(eq(discounts.id, input.id));
      }),

    ordersList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("./db");
      const { orders } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(orders);
    }),
    orderUpdate: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "ready", "completed", "cancelled"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { orders } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      }),
  }),
});

export type AppRouter = typeof appRouter;
