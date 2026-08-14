import { describe, expect, it } from "vitest";
import { canRestoreSavedItem, groupCartByStore } from "./cartPolicies";

describe("cart policies", () => {
  it("groups active cart lines by seller and calculates per-seller subtotals", () => {
    const groups = groupCartByStore([
      { store: { id: 10 }, item: { quantity: 2 }, listing: { priceKobo: 12_500 } },
      { store: { id: 20 }, item: { quantity: 1 }, listing: { priceKobo: 8_000 } },
      { store: { id: 10 }, item: { quantity: 3 }, listing: { priceKobo: 2_000 } },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ store: { id: 10 }, subtotalKobo: 31_000 });
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1]).toMatchObject({ store: { id: 20 }, subtotalKobo: 8_000 });
  });

  it("blocks restoring a saved item when available stock is insufficient", () => {
    expect(canRestoreSavedItem(10, 4, 6)).toBe(true);
    expect(canRestoreSavedItem(10, 4, 7)).toBe(false);
    expect(canRestoreSavedItem(3, 3, 1)).toBe(false);
  });
});
