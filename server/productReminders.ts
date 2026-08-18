import { and, eq, lte } from "drizzle-orm";
import { inventory, listings, notifications, productReminders, stores } from "../drizzle/schema";
import { getDb } from "./db";

const affectedRows = (result: unknown) => Number((result as { affectedRows?: number })?.affectedRows ?? (result as [{ affectedRows?: number }])?.[0]?.affectedRows ?? 0);

export async function processDueProductReminders(now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const due = await db.select({ id: productReminders.id }).from(productReminders).where(and(eq(productReminders.status, "ACTIVE"), lte(productReminders.scheduledFor, now))).limit(100);
  let triggered = 0;
  let unavailable = 0;

  for (const dueReminder of due) {
    await db.transaction(async tx => {
      const row = (await tx.select({ reminder: productReminders, listing: listings, store: stores, inventory }).from(productReminders).leftJoin(listings, eq(productReminders.listingId, listings.id)).leftJoin(stores, eq(productReminders.storeId, stores.id)).leftJoin(inventory, eq(inventory.listingId, listings.id)).where(eq(productReminders.id, dueReminder.id)).limit(1))[0];
      if (!row) return;
      const claimed = await tx.update(productReminders).set({ status: "TRIGGERED", triggeredAt: now, notificationSentAt: now }).where(and(eq(productReminders.id, row.reminder.id), eq(productReminders.status, "ACTIVE"), lte(productReminders.scheduledFor, now)));
      if (!affectedRows(claimed)) return;
      const availableUnits = Math.max(0, (row.inventory?.quantity ?? 0) - (row.inventory?.reservedQuantity ?? 0));
      const isAvailable = row.listing?.status === "ACTIVE" && row.store?.status === "ACTIVE" && availableUnits > 0;
      if (isAvailable) triggered += 1;
      else unavailable += 1;
      await tx.insert(notifications).values({
        userId: row.reminder.userId,
        type: "PRODUCT_REMINDER",
        title: isAvailable ? "Your reminder is ready" : "Product reminder: availability changed",
        message: isAvailable ? `You asked us to remind you about ${row.listing?.title ?? "a saved product"}. Check current availability now.` : `${row.listing?.title ?? "This saved product"} is currently unavailable. You can view the store or search for similar products.`,
        targetRoute: isAvailable && row.listing?.slug ? `/product/${row.listing.slug}` : row.store?.status === "ACTIVE" ? `/store/${row.store.slug}` : `/explore?q=${encodeURIComponent(row.listing?.title ?? "")}`,
      });
    });
  }

  return { scanned: due.length, triggered, unavailable };
}
