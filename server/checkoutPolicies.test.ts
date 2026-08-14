import { describe, expect, it } from "vitest";
import { canReserveCheckoutQuantity, hasExistingBatchOrders } from "./checkoutPolicies";

describe("checkout concurrency policies", () => {
  it("permits reservation only when the requested quantity fits unreserved stock", () => {
    expect(canReserveCheckoutQuantity(10, 4, 6)).toBe(true);
    expect(canReserveCheckoutQuantity(10, 4, 7)).toBe(false);
    expect(canReserveCheckoutQuantity(3, 3, 1)).toBe(false);
    expect(canReserveCheckoutQuantity(3, 1, 0)).toBe(false);
  });

  it("recognizes an existing batch as the idempotent checkout outcome", () => {
    expect(hasExistingBatchOrders(0)).toBe(false);
    expect(hasExistingBatchOrders(1)).toBe(true);
    expect(hasExistingBatchOrders(2)).toBe(true);
  });
});
