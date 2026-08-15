import { describe, expect, it } from "vitest";
import { sellerVerificationInput } from "./sellerVerification";

const evidence = { filename: "identity.pdf", mimeType: "application/pdf" as const, dataUrl: "data:application/pdf;base64,QUJDREVGR0g=" };

describe("seller verification input", () => {
  it("accepts an individual submission without any business fields", () => {
    expect(sellerVerificationInput.safeParse({ sellerType: "INDIVIDUAL", esutEmail: "student@esut.edu.ng", registrationNumber: "ESUT-2024-1001", evidence }).success).toBe(true);
  });
  it("accepts a business submission without any individual fields", () => {
    expect(sellerVerificationInput.safeParse({ sellerType: "BUSINESS", businessName: "Campus Supplies", businessRegistrationNumber: "RC-10293", evidence }).success).toBe(true);
  });
  it("rejects only the fields required by the selected seller type", () => {
    const result = sellerVerificationInput.safeParse({ sellerType: "INDIVIDUAL", esutEmail: "student@esut.edu.ng", registrationNumber: "", evidence });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some(issue => issue.path[0] === "registrationNumber")).toBe(true);
  });
  it("rejects unsupported evidence types and oversized evidence payloads", () => {
    const unsupported = sellerVerificationInput.safeParse({ sellerType: "INDIVIDUAL", esutEmail: "student@esut.edu.ng", registrationNumber: "ESUT-2024-1001", evidence: { ...evidence, mimeType: "text/html" } });
    const oversized = sellerVerificationInput.safeParse({ sellerType: "BUSINESS", businessName: "Campus Supplies", businessRegistrationNumber: "RC-10293", evidence: { ...evidence, dataUrl: `data:application/pdf;base64,${"A".repeat(7_000_000)}` } });
    expect(unsupported.success).toBe(false);
    expect(oversized.success).toBe(false);
  });
});
