import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { marketplaceSettings } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { processDueProductReminders } from "./productReminders";

export function registerProductReminderSchedule(app: Express) {
  app.post("/api/scheduled/product-reminders", async (req: Request, res: Response) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ error: "cron-only" });
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database-unavailable" });
      const row = (await db.select({ value: marketplaceSettings.value }).from(marketplaceSettings).where(eq(marketplaceSettings.settingKey, "product_reminder_schedule")).limit(1))[0];
      const settings = row?.value as { taskUid?: string } | undefined;
      if (!settings?.taskUid || settings.taskUid !== caller.taskUid) return res.status(403).json({ error: "unknown-reminder-schedule" });
      return res.json({ ok: true, ...(await processDueProductReminders()) });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "reminder-processing-failed", timestamp: new Date().toISOString() });
    }
  });
}
