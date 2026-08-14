export const campusPickupPayment = () => ({
  fulfillmentMethod: "CAMPUS_PICKUP" as const,
  paymentMethod: "CASH_ON_PICKUP" as const,
  paymentStatus: "UNPAID" as const,
  feesKobo: 0,
});
