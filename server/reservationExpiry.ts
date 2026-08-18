import { and, eq, lte } from "drizzle-orm";
import { marketplaceSettings, orders } from "../drizzle/schema";
import { getDb } from "./db";
import { applyOrderTransition } from "./orderTransitions";

export type ReservationExpiryResult = { candidateCount: number; expiredCount: number; skippedCount: number; failureCount: number; failedOrderIds: number[]; processedAt: string };

export async function processExpiredReservations(actorUserId: number | null = null): Promise<ReservationExpiryResult> {
  const db = await getDb();
  if (!db) throw new Error("database-unavailable");
  const now = new Date();
  const candidates = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.status, "PENDING"), lte(orders.reservationExpiresAt, now))).limit(100);
  const result: ReservationExpiryResult = { candidateCount: candidates.length, expiredCount: 0, skippedCount: 0, failureCount: 0, failedOrderIds: [], processedAt: now.toISOString() };
  for (const candidate of candidates) {
    try {
      const outcome = await db.transaction(async tx => {
        const fresh = (await tx.select().from(orders).where(eq(orders.id, candidate.id)).limit(1))[0];
        if (!fresh || fresh.status !== "PENDING" || !fresh.reservationExpiresAt || fresh.reservationExpiresAt > now) return "skipped" as const;
        await applyOrderTransition(tx, fresh, "CANCELLED", actorUserId, "Reservation expired before seller confirmation.", true);
        return "expired" as const;
      });
      if (outcome === "expired") result.expiredCount += 1; else result.skippedCount += 1;
    } catch (error) {
      console.error("[Reservation expiry] unable to process order", candidate.id, error);
      result.failureCount += 1;
      result.failedOrderIds.push(candidate.id);
    }
  }
  await db.insert(marketplaceSettings).values({ settingKey: "reservation_expiry_health", value: result }).onDuplicateKeyUpdate({ set: { value: result } });
  return result;
}
