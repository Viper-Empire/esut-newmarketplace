export function isCloudflareStagingPreview(hostname?: string) {
  const currentHostname = (hostname ?? (typeof window === "undefined" ? "" : window.location.hostname)).trim().toLowerCase();
  return currentHostname === "esut-marketplace-staging.pages.dev" || currentHostname === "staging.esut-marketplace-staging.pages.dev" || currentHostname.endsWith(".esut-marketplace-staging.pages.dev");
}
