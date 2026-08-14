/**
 * Temporary operating mode while the configured transactional sender is not
 * permitted to deliver verification emails to arbitrary marketplace users.
 * Re-enable only after the sender domain has been verified and delivery has
 * been tested with a normal recipient address.
 */
export const EMAIL_VERIFICATION_ENABLED = false;
/**
 * The current Resend test sender can deliver only to the approved test mailbox.
 * Keep ordinary-account password recovery unavailable until a verified sending
 * domain is configured; this avoids issuing reset tokens that cannot be delivered.
 */
export const PASSWORD_RESET_EMAIL_DELIVERY_ENABLED = false;

export const emailVerificationRegistrationState = () => ({
  requiresEmailVerification: EMAIL_VERIFICATION_ENABLED,
  verificationSent: false,
});

export const emailVerificationLoginState = () => ({
  requiresEmailVerification: EMAIL_VERIFICATION_ENABLED,
});

export const passwordResetDeliveryState = () => ({
  passwordResetEmailAvailable: PASSWORD_RESET_EMAIL_DELIVERY_ENABLED,
});
