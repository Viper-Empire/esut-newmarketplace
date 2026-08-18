import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { marketplaceSettings } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { processExpiredReservations } from "./reservationExpiry";

export function registerReservationExpirySchedule(app: Express) {
  app.post("/api/scheduled/reservation-expiry", async (req: Request, res: Response) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ error: "cron-only" });
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database-unavailable" });
      const row = (await db.select({ value: marketplaceSettings.value }).from(marketplaceSettings).where(eq(marketplaceSettings.settingKey, "reservation_expiry_schedule")).limit(1))[0];
      const schedule = row?.value as { taskUid?: string } | undefined;
      if (!schedule?.taskUid || schedule.taskUid !== caller.taskUid) return res.status(403).json({ error: "unknown-reservation-expiry-schedule" });
      const result = await processExpiredReservations();
      if (result.failureCount) return res.status(500).json({ ok: false, ...result, error: "reservation-expiry-partial-failure" });
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "reservation-expiry-failed", timestamp: new Date().toISOString() });
    }
  });
}
