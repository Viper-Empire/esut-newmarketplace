export type AuthTokenLifecycle = { expiresAt: Date; consumedAt: Date | null };

export function isAuthTokenUsable(token: AuthTokenLifecycle, now = new Date()) {
  return token.consumedAt === null && token.expiresAt.getTime() > now.getTime();
}
