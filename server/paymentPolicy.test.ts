import { describe, expect, it } from "vitest";
import { campusPickupPayment } from "./paymentPolicy";

describe("campus pickup payment policy", () => {
  it("permits only unpaid cash collection with no online checkout fees", () => {
    expect(campusPickupPayment()).toEqual({ fulfillmentMethod: "CAMPUS_PICKUP", paymentMethod: "CASH_ON_PICKUP", paymentStatus: "UNPAID", feesKobo: 0 });
  });
});
