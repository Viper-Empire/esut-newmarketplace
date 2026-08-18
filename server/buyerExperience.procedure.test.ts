import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][], selectArgs: [] as unknown[], deletedWhere: 0, updatedWhere: 0, updateConditions: [] as unknown[] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: (fields?: unknown) => {
      state.selectArgs.push(fields);
      const next = () => state.selectResults.shift() ?? [];
      const query: any = {
        from: () => query,
        innerJoin: () => query,
        leftJoin: () => query,
        where: () => query,
        orderBy: () => query,
        limit: () => query,
        offset: () => query,
        then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(next()).then(resolve, reject),
      };
      return query;
    },
    update: () => ({ set: () => ({ where: async (condition: unknown) => { state.updatedWhere += 1; state.updateConditions.push(condition); return [{ affectedRows: 1 }]; } }) }),
    delete: () => ({ where: async () => { state.deletedWhere += 1; return []; } }),
    insert: () => ({ values: async () => [{ insertId: 1 }] }),
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(userId = 81): TrpcContext {
  return {
    user: { id: userId, openId: `buyer-${userId}`, name: "Buyer Test", email: "buyer@example.com", loginMethod: "password", role: "CUSTOMER", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function publicContext(): TrpcContext {
  return { user: undefined, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function containsValue(value: unknown, needle: unknown, seen = new Set<object>()): boolean {
  if (value === needle) return true;
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Reflect.ownKeys(value).some(key => {
    try { return containsValue((value as Record<PropertyKey, unknown>)[key], needle, seen); } catch { return false; }
  });
}

function sellerContext(): TrpcContext {
  return {
    user: { id: 44, openId: "seller-44", name: "Seller Test", email: "seller@example.com", loginMethod: "password", role: "SELLER", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("buyer experience procedures", () => {
  beforeEach(() => { state.selectResults = []; state.selectArgs = []; state.deletedWhere = 0; state.updatedWhere = 0; state.updateConditions = []; });

  it("clears only the caller-owned active cart after resolving that caller's cart", async () => {
    state.selectResults = [[{ id: 41, userId: 81 }]];
    await expect(appRouter.createCaller(context(81)).cart.clear()).resolves.toEqual({ success: true });
    expect(state.deletedWhere).toBe(1);
    expect(state.selectArgs).toHaveLength(1);
  });

  it("returns the unread-notification count and supports a scoped mark-all-read mutation", async () => {
    state.selectResults = [[{ total: 3 }]];
    await expect(appRouter.createCaller(context(81)).notifications.unreadCount()).resolves.toEqual({ count: 3 });
    await expect(appRouter.createCaller(context(81)).notifications.markAllRead()).resolves.toEqual({ success: true });
    expect(state.updatedWhere).toBe(1);
    expect(containsValue(state.updateConditions[0], 81)).toBe(true);
  });

  it("returns only limited real product, store, and category suggestions", async () => {
    state.selectResults = [
      [{ slug: "esut-textbook", title: "ESUT Textbook", storeName: "Campus Books" }],
      [{ slug: "campus-books", name: "Campus Books" }],
      [{ slug: "books", name: "Books" }],
    ];
    await expect(appRouter.createCaller(publicContext()).marketplace.suggestions({ q: "book" })).resolves.toEqual({
      products: [{ slug: "esut-textbook", title: "ESUT Textbook", storeName: "Campus Books" }],
      stores: [{ slug: "campus-books", name: "Campus Books" }],
      categories: [{ slug: "books", name: "Books" }],
    });
  });

  it("returns active category listings when a buyer searches by category name", async () => {
    state.selectResults = [
      [{ id: 12 }],
      [{ listing: { slug: "study-desk" }, store: { name: "Campus Home" }, image: null }],
    ];
    await expect(appRouter.createCaller(publicContext()).marketplace.search({ page: 1, limit: 12, q: "home" })).resolves.toMatchObject({
      items: [{ listing: { slug: "study-desk" } }],
      page: 1,
      hasMore: false,
    });
  });

  it("returns a display-safe product review summary and review records", async () => {
    state.selectResults = [
      [{ listing: { id: 8, categoryId: 3 }, store: { status: "ACTIVE" }, category: { name: "Books" } }],
      [],
      [],
      [{ review: { id: 7, rating: 4, comment: "Clear and useful.", sellerResponse: null, createdAt: new Date() }, buyer: { name: "Buyer Test" } }],
    ];
    const result = await appRouter.createCaller(publicContext()).marketplace.product({ slug: "study-guide" });
    expect(result.reviewSummary).toEqual({ count: 1, averageRating: 4 });
    expect(result.productReviews[0]).toMatchObject({ review: { rating: 4 }, buyer: { name: "Buyer T." } });
  });

  it("uses a display-safe buyer projection for public store reviews", async () => {
    state.selectResults = [[{ id: 1, slug: "campus-books", status: "ACTIVE" }], [], []];
    await appRouter.createCaller(publicContext()).marketplace.store({ slug: "campus-books", reviewSort: "RATING" });
    const reviewFields = state.selectArgs[2] as { review?: Record<string, unknown>; buyer?: Record<string, unknown> };
    expect(Object.keys(reviewFields.buyer ?? {})).toEqual(["name"]);
    expect(Object.keys(reviewFields.review ?? {})).toEqual(["id", "rating", "title", "comment", "sellerResponse", "createdAt"]);
  });

  it("rejects unsupported public shop review sort values before querying marketplace records", async () => {
    await expect(appRouter.createCaller(publicContext()).marketplace.store({ slug: "campus-books", reviewSort: "OLDEST" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.selectArgs).toHaveLength(0);
  });

  it("uses display-safe buyer and sender projections in seller queues and participant messages", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], []];
    await appRouter.createCaller(sellerContext()).offers.sellerList();
    const offerFields = state.selectArgs[1] as { buyer?: Record<string, unknown> };
    expect(Object.keys(offerFields.buyer ?? {})).toEqual(["name"]);

    state.selectResults = [[{ verificationStatus: "APPROVED" }], []]; state.selectArgs = [];
    await appRouter.createCaller(sellerContext()).reviews.sellerList();
    const reviewFields = state.selectArgs[1] as { buyer?: Record<string, unknown> };
    expect(Object.keys(reviewFields.buyer ?? {})).toEqual(["name"]);

    state.selectResults = [[{ id: 15 }], [], []]; state.selectArgs = [];
    await appRouter.createCaller(context()).messaging.detail({ conversationId: 15 });
    const messageFields = state.selectArgs[2] as { sender?: Record<string, unknown> };
    expect(Object.keys(messageFields.sender ?? {})).toEqual(["name"]);
  });

  it("returns only display-safe context for each participant-authorized conversation", async () => {
    state.selectResults = [
      [{ conversation: { id: 22 }, listing: { title: "Study Guide", slug: "study-guide" }, store: { name: "Campus Books", slug: "campus-books" } }],
      [{ name: "Seller Test" }],
      [{ body: "It is available.", createdAt: new Date("2026-08-15T12:00:00Z"), senderUserId: 44 }],
    ];
    await expect(appRouter.createCaller(context(81)).messaging.list()).resolves.toEqual([{
      conversation: { id: 22 }, listing: { title: "Study Guide", slug: "study-guide" }, store: { name: "Campus Books", slug: "campus-books" }, counterparty: { name: "Seller Test" }, latestMessage: { body: "It is available.", createdAt: new Date("2026-08-15T12:00:00Z"), isMine: false },
    }]);
    const baseFields = state.selectArgs[0] as { listing?: Record<string, unknown>; store?: Record<string, unknown> };
    expect(Object.keys(baseFields.listing ?? {})).toEqual(["title", "slug"]);
    expect(Object.keys(baseFields.store ?? {})).toEqual(["name", "slug"]);
    expect(state.selectArgs[1]).toEqual({ name: expect.anything() });
  });
});
