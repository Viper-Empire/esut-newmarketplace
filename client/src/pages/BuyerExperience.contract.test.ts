import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

describe("buyer experience continuity contracts", () => {
  it("keeps a direct marketplace escape on cart and checkout", () => {
    expect(source("CartPage.tsx")).toContain('href="/explore"');
    expect(source("CheckoutPage.tsx")).toContain('href="/cart"');
    expect(source("CheckoutPage.tsx")).toContain('href="/explore"');
  });

  it("keeps pickup notes bounded and trims blank notes before submission", () => {
    const checkout = source("CheckoutPage.tsx");
    expect(checkout).toContain('maxLength={500}');
    expect(checkout).toContain('pickupNote: note.trim() || undefined');
    expect(checkout).toContain('aria-busy={place.isPending}');
  });

  it("exposes truthful loading semantics for account and order surfaces", () => {
    expect(source("AccountPage.tsx")).toContain('aria-label="Loading your account"');
    const orders = source("OrderPages.tsx");
    expect(orders).toContain('aria-label="Loading orders"');
    expect(orders).toContain('href="/account"');
    expect(orders).toContain('href="/explore"');
  });
});


describe("buyer account escape contracts", () => {
  it("keeps direct account return links on secondary buyer pages", () => {
    const features = source("AccountFeaturePages.tsx");
    expect(features.match(/Back to account/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(features).toContain('href="/account"');
  });
});


describe("buyer safety continuity contracts", () => {
  it("keeps protected dispute and security navigation connected", () => {
    const features = source("AccountFeaturePages.tsx");
    expect(features).toContain("/account/orders/${order.publicId}");
    expect(features).toContain("View protected order details");
    expect(source("AccountSecurityPage.tsx")).toContain('href="/account"');
  });
});
