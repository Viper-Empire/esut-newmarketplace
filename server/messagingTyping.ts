export const TYPING_SIGNAL_TTL_MS = 9_000;

export function typingSignalExpiry(now = new Date()) {
  return new Date(now.getTime() + TYPING_SIGNAL_TTL_MS);
}

export function typingSignalIsActive(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime();
}
