import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter, listingEvidenceDecisionNotification } from "./routers";

function elevatedContext(): TrpcContext {
  return { user: { id: 41, openId: "seller-publishing-validation", name: "Validation Admin", email: "validation@example.com", loginMethod: "password", role: "ADMIN", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("seller product publication boundaries", () => {
  it("does not accept ACTIVE as a seller-controlled status transition", async () => {
    const caller = appRouter.createCaller(elevatedContext());
    await expect(caller.seller.setProductStatus({ id: 1, status: "ACTIVE" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects unsupported video evidence MIME types before storage access", async () => {
    const caller = appRouter.createCaller(elevatedContext());
    await expect(caller.seller.uploadProductVideoEvidence({ listingId: 1, video: { filename: "evidence.exe", mimeType: "application/octet-stream" as never, dataUrl: "data:application/octet-stream;base64,AAAA" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects oversized encoded video evidence before storage access", async () => {
    const caller = appRouter.createCaller(elevatedContext());
    const oversizedDataUrl = `data:video/mp4;base64,${"A".repeat(14_600_000)}`;
    await expect(caller.seller.uploadProductVideoEvidence({ listingId: 1, video: { filename: "evidence.mp4", mimeType: "video/mp4", dataUrl: oversizedDataUrl } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects listing queue states that are not part of the allowed administrator review filter", async () => {
    const caller = appRouter.createCaller(elevatedContext());
    await expect(caller.admin.listings({ page: 1, limit: 12, status: "SOLD" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("builds seller-owned evidence-decision alerts without protected media details", () => {
    const returned = listingEvidenceDecisionNotification({ listingId: 24, listingTitle: "Verified campus calculator", approve: false, note: "Please show the item serial number clearly." });
    const published = listingEvidenceDecisionNotification({ listingId: 24, listingTitle: "Verified campus calculator", approve: true, note: "Evidence accepted." });

    expect(returned).toEqual({ title: "Product evidence needs attention: Verified campus calculator", message: "Your product was returned to draft. Administrator note: Please show the item serial number clearly.", targetRoute: "/seller/products/24/evidence" });
    expect(published).toEqual({ title: "Product published: Verified campus calculator", message: "Your evidence for “Verified campus calculator” was approved and the listing is now live.", targetRoute: "/seller/products/24/evidence" });
    expect(JSON.stringify(returned)).not.toMatch(/storage|signed|video\/|key/i);
  });
});
