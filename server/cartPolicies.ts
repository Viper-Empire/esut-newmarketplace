export type CartLineLike = { store: { id: number }; item: { quantity: number }; listing: { priceKobo: number } };

export function canRestoreSavedItem(quantity: number, reservedQuantity: number, requestedQuantity: number) {
  return quantity - reservedQuantity >= requestedQuantity;
}

export function groupCartByStore<T extends CartLineLike>(items: T[]) {
  return Array.from(items.reduce((groups, row) => {
    const current = groups.get(row.store.id) ?? { store: row.store, items: [] as T[], subtotalKobo: 0 };
    current.items.push(row);
    current.subtotalKobo += row.item.quantity * row.listing.priceKobo;
    groups.set(row.store.id, current);
    return groups;
  }, new Map<number, { store: T["store"]; items: T[]; subtotalKobo: number }>()).values());
}
