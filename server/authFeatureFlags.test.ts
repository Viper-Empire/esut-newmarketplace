import { describe, expect, it } from "vitest";
import { EMAIL_VERIFICATION_ENABLED, emailVerificationRegistrationState } from "./authFeatureFlags";

describe("temporary email-verification mode", () => {
  it("allows registration without requiring or claiming email verification", () => {
    expect(EMAIL_VERIFICATION_ENABLED).toBe(false);
    expect(emailVerificationRegistrationState()).toEqual({ requiresEmailVerification: false, verificationSent: false });
  });
});
