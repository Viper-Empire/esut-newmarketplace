import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter, assessListingPublication, canBuyerViewListing, listingEvidenceDecisionNotification, publicBuyerDisplayName, reminderTime } from "./routers";

function sellerContext(): TrpcContext {
  return { user: { id: 41, openId: "seller-publishing-validation", name: "Validation Seller", email: "validation@example.com", loginMethod: "password", role: "SELLER", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function adminContext(): TrpcContext {
  return { user: { id: 42, openId: "admin-publishing-validation", name: "Validation Admin", email: "admin@example.com", loginMethod: "password", role: "ADMIN", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("seller product publication boundaries", () => {
  it("does not accept ACTIVE as a seller-controlled status transition", async () => {
    const caller = appRouter.createCaller(sellerContext());
    await expect(caller.seller.setProductStatus({ id: 1, status: "ACTIVE" as never })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires a valid product reference before a seller can publish", async () => {
    const caller = appRouter.createCaller(sellerContext());
    await expect(caller.seller.publishProduct({ id: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("auto-publishes only listings that pass all server-owned validation checks", () => {
    expect(assessListingPublication({ title: "Campus calculator", description: "A reliable scientific calculator for daily ESUT coursework.", priceKobo: 8_500, availableUnits: 3, hasActiveCategory: true, images: [{ mimeType: "image/jpeg", sizeBytes: 420_000 }] })).toMatchObject({ validationErrors: [], invalidImageCount: 0, outcome: "ACTIVE" });
  });

  it("flags a listing for moderation when an image record cannot be trusted after otherwise valid publication checks", () => {
    expect(assessListingPublication({ title: "Campus calculator", description: "A reliable scientific calculator for daily ESUT coursework.", priceKobo: 8_500, availableUnits: 3, hasActiveCategory: true, images: [{ mimeType: null, sizeBytes: null }] })).toMatchObject({ validationErrors: [], invalidImageCount: 1, outcome: "FLAGGED" });
  });

  it("keeps flagged and paused listings out of buyer-visible listing policy", () => {
    expect(canBuyerViewListing("ACTIVE")).toBe(true);
    expect(canBuyerViewListing("FLAGGED")).toBe(false);
    expect(canBuyerViewListing("PAUSED")).toBe(false);
    expect(canBuyerViewListing("SUSPENDED")).toBe(false);
  });

  it("rejects unsupported video evidence MIME types before storage access", async () => {
    const caller = appRouter.createCaller(sellerContext());
    await expect(caller.seller.uploadProductVideoEvidence({ listingId: 1, video: { filename: "evidence.exe", mimeType: "application/octet-stream" as never, dataUrl: "data:application/octet-stream;base64,AAAA" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects oversized encoded video evidence before storage access", async () => {
    const caller = appRouter.createCaller(sellerContext());
    const oversizedDataUrl = `data:video/mp4;base64,${"A".repeat(14_600_000)}`;
    await expect(caller.seller.uploadProductVideoEvidence({ listingId: 1, video: { filename: "evidence.mp4", mimeType: "video/mp4", dataUrl: oversizedDataUrl } })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows the protected flagged moderation queue while rejecting unsupported listing filter states", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.listings({ page: 1, limit: 12, status: "SOLD" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(caller.admin.setListingStatus).toBeDefined();
    expect(caller.admin.listings).toBeDefined();
  });

  it("builds seller-owned evidence-decision alerts without protected media details", () => {
    const returned = listingEvidenceDecisionNotification({ listingId: 24, listingTitle: "Verified campus calculator", approve: false, note: "Please show the item serial number clearly." });
    const published = listingEvidenceDecisionNotification({ listingId: 24, listingTitle: "Verified campus calculator", approve: true, note: "Evidence accepted." });

    expect(returned).toEqual({ title: "Product evidence needs attention: Verified campus calculator", message: "Your product was returned to draft. Administrator note: Please show the item serial number clearly.", targetRoute: "/seller/products/24/evidence" });
    expect(published).toEqual({ title: "Product published: Verified campus calculator", message: "Your evidence for “Verified campus calculator” was approved and the listing is now live.", targetRoute: "/seller/products/24/evidence" });
    expect(JSON.stringify(returned)).not.toMatch(/storage|signed|video\/|key/i);
  });

  it("reduces public reviewer identity to a display-safe first name and initial", () => {
    expect(publicBuyerDisplayName("John David Okafor")).toBe("John D.");
    expect(publicBuyerDisplayName("Ada")).toBe("Ada");
    expect(publicBuyerDisplayName(null)).toBe("Verified buyer");
  });

  it("derives reminder times on the server and rejects missing or past custom dates", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    expect(reminderTime({ reminderType: "TOMORROW" }, now).toISOString()).toBe("2026-08-19T12:00:00.000Z");
    expect(reminderTime({ reminderType: "THREE_DAYS" }, now).toISOString()).toBe("2026-08-21T12:00:00.000Z");
    expect(() => reminderTime({ reminderType: "CUSTOM" }, now)).toThrow(/Choose a reminder time/);
    expect(() => reminderTime({ reminderType: "CUSTOM", scheduledFor: new Date("2026-08-18T12:00:30.000Z") }, now)).toThrow(/Choose a reminder time/);
  });
});
