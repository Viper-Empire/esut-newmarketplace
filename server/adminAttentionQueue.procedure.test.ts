import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => {
      const query: any = {
        from: () => query,
        innerJoin: () => query,
        leftJoin: () => query,
        where: () => query,
        orderBy: () => query,
        limit: () => query,
        then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.selectResults.shift() ?? []).then(resolve, reject),
      };
      return query;
    },
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "ADMIN"): TrpcContext {
  return { user: { id: 77, openId: `attention-${role}`, name: "Attention Test", email: "admin@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("administrator attention queue", () => {
  beforeEach(() => { state.selectResults = []; });

  it("maps genuine records and sorts high priority before medium, oldest first", async () => {
    const now = new Date();
    const older = new Date(now.getTime() - 86_400_000);
    state.selectResults = [
      [{ id: 11, title: "Flagged phone", status: "FLAGGED", updatedAt: older, storeName: "Seller store" }],
      [{ id: 22, reason: "Unsafe listing", targetType: "LISTING", targetId: 11, status: "OPEN", createdAt: now }],
      [],
      [{ id: 33, businessName: null, esutEmail: "seller@esut.edu.ng", verificationType: "INDIVIDUAL_IDENTITY", status: "PENDING", createdAt: older }],
      [],
    ];

    const queue = await appRouter.createCaller(context("ADMIN")).admin.attentionQueue();

    expect(queue).toHaveLength(3);
    expect(queue.map(item => item.source)).toEqual(["Listing", "Report", "Verification"]);
    expect(queue[0]).toMatchObject({ priority: "HIGH", subject: "Flagged phone", href: "/admin/listings?status=FLAGGED" });
    expect(queue[2]).toMatchObject({ priority: "MEDIUM", subject: "seller@esut.edu.ng", href: "/admin/verifications" });
  });

  it("rejects non-administrator callers before queue records are queried", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).admin.attentionQueue()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.selectResults).toEqual([]);
  });
});
