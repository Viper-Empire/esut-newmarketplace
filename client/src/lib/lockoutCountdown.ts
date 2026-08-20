export function secondsUntilRetry(retryAt: number | null, now = Date.now()) {
  if (!retryAt) return 0;
  return Math.max(0, Math.ceil((retryAt - now) / 1000));
}

export function formatRetryCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function retryAtFromError(error: unknown) {
  const candidate = (error as { data?: { retryAt?: unknown } } | null)?.data?.retryAt;
  if (typeof candidate !== "string") return null;
  const timestamp = Date.parse(candidate);
  return Number.isFinite(timestamp) && timestamp > Date.now() ? timestamp : null;
}
