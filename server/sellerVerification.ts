import { z } from "zod";
import { isValidMarketplaceEmail, normalizeEmail } from "./localAuth";

const marketplaceEmailInput = z.string().max(320).transform(normalizeEmail).refine(isValidMarketplaceEmail, { message: "Enter a valid email address." });

export const verificationEvidenceSchema = z.object({
  filename: z.string().trim().min(1).max(120),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  dataUrl: z.string().min(24).max(7_000_000),
});

export const sellerVerificationInput = z.discriminatedUnion("sellerType", [
  z.object({
    sellerType: z.literal("INDIVIDUAL"),
    esutEmail: marketplaceEmailInput,
    registrationNumber: z.string().trim().min(4).max(80),
    evidence: verificationEvidenceSchema,
  }),
  z.object({
    sellerType: z.literal("BUSINESS"),
    businessName: z.string().trim().min(2).max(180),
    businessRegistrationNumber: z.string().trim().min(4).max(120),
    evidence: verificationEvidenceSchema,
  }),
]);

export type SellerVerificationInput = z.infer<typeof sellerVerificationInput>;
