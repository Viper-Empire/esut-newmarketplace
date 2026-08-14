export const orderStatusValues = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED", "DISPUTED"] as const;
export type OrderStatus = (typeof orderStatusValues)[number];

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "DISPUTED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "DISPUTED"],
  PROCESSING: ["READY_FOR_PICKUP", "CANCELLED", "DISPUTED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED", "DISPUTED"],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ["COMPLETED", "CANCELLED"],
};

export function assertAllowedOrderTransition(current: OrderStatus, next: OrderStatus) {
  if (!transitions[current].includes(next)) {
    throw new Error(`Order cannot transition from ${current} to ${next}.`);
  }
}

export function isTerminalOrderStatus(status: OrderStatus) {
  return status === "COMPLETED" || status === "CANCELLED";
}
