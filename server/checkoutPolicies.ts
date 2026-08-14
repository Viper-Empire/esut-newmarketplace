export function canReserveCheckoutQuantity(quantity: number, reservedQuantity: number, requestedQuantity: number) {
  return quantity >= 0 && reservedQuantity >= 0 && requestedQuantity > 0 && quantity - reservedQuantity >= requestedQuantity;
}

export function hasExistingBatchOrders(existingOrderCount: number) {
  return existingOrderCount > 0;
}
