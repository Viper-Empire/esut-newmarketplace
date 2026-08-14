import { beforeEach, describe, expect, it, vi } from "vitest";
import { addGuestCartLine, readGuestCart, removeGuestCartLine, replaceGuestCart, setGuestCartQuantity } from "./guestCart";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) });

describe("guest cart persistence", () => {
  beforeEach(() => store.clear());
  it("merges duplicate anonymous additions and caps their quantity", () => {
    addGuestCartLine({ listingId: 8, title: "Campus bag", priceKobo: 14_500, quantity: 20 });
    addGuestCartLine({ listingId: 8, title: "Campus bag", priceKobo: 14_500, quantity: 10 });
    expect(readGuestCart()).toEqual([{ listingId: 8, title: "Campus bag", priceKobo: 14_500, quantity: 25 }]);
  });
  it("updates and removes a persisted anonymous line", () => {
    addGuestCartLine({ listingId: 3, title: "Study lamp", priceKobo: 12_000, quantity: 2 });
    setGuestCartQuantity(3, 4);
    expect(readGuestCart()[0]?.quantity).toBe(4);
    removeGuestCartLine(3);
    expect(readGuestCart()).toEqual([]);
  });
  it("persists only unresolved lines after a partial authenticated merge", () => {
    replaceGuestCart([{ listingId: 4, title: "Unavailable item", priceKobo: 9_800, quantity: 1 }]);
    expect(readGuestCart()).toEqual([{ listingId: 4, title: "Unavailable item", priceKobo: 9_800, quantity: 1 }]);
  });
});
