/**
 * Temporary operating mode while the configured transactional sender is not
 * permitted to deliver verification emails to arbitrary marketplace users.
 * Re-enable only after the sender domain has been verified and delivery has
 * been tested with a normal recipient address.
 */
export const EMAIL_VERIFICATION_ENABLED = false;

export const emailVerificationRegistrationState = () => ({
  requiresEmailVerification: EMAIL_VERIFICATION_ENABLED,
  verificationSent: false,
});
