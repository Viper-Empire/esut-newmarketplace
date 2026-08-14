import { describe, expect, it } from "vitest";
import { assertAllowedOrderTransition, isTerminalOrderStatus } from "./orderLifecycle";

describe("order lifecycle policy", () => {
  it("permits the pickup fulfilment sequence and dispute resolution", () => {
    expect(() => assertAllowedOrderTransition("PENDING", "CONFIRMED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("CONFIRMED", "PROCESSING")).not.toThrow();
    expect(() => assertAllowedOrderTransition("PROCESSING", "READY_FOR_PICKUP")).not.toThrow();
    expect(() => assertAllowedOrderTransition("READY_FOR_PICKUP", "COMPLETED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("DISPUTED", "CANCELLED")).not.toThrow();
  });

  it("permits disputes only from active fulfilment states", () => {
    expect(() => assertAllowedOrderTransition("PENDING", "DISPUTED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("CONFIRMED", "DISPUTED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("PROCESSING", "DISPUTED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("READY_FOR_PICKUP", "DISPUTED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("COMPLETED", "DISPUTED")).toThrow("cannot transition");
    expect(() => assertAllowedOrderTransition("CANCELLED", "DISPUTED")).toThrow("cannot transition");
  });

  it("rejects arbitrary and terminal-status changes", () => {
    expect(() => assertAllowedOrderTransition("PENDING", "COMPLETED")).toThrow("cannot transition");
    expect(() => assertAllowedOrderTransition("COMPLETED", "PROCESSING")).toThrow("cannot transition");
    expect(isTerminalOrderStatus("COMPLETED")).toBe(true);
    expect(isTerminalOrderStatus("CANCELLED")).toBe(true);
    expect(isTerminalOrderStatus("DISPUTED")).toBe(false);
  });
});
