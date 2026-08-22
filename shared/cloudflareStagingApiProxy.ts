const STAGING_BACKEND_ORIGIN = "https://esutshop-59wzg8bs.manus.space";

const HOP_BY_HOP_REQUEST_HEADERS = [
  "connection",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

const HOP_BY_HOP_RESPONSE_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function cleanHeaders(source: Headers, blockedNames: string[]) {
  const headers = new Headers(source);
  blockedNames.forEach(name => headers.delete(name));
  return headers;
}

function getProxyTarget(request: Request) {
  const incoming = new URL(request.url);
  if (!incoming.pathname.startsWith("/api/")) {
    throw new Error("Only /api/* requests may be proxied from Cloudflare staging.");
  }

  return new URL(`${incoming.pathname}${incoming.search}`, STAGING_BACKEND_ORIGIN);
}

/**
 * Proxies only same-origin API traffic from the isolated Cloudflare Pages staging
 * deployment to the existing managed Node backend. The backend remains the sole
 * authority for authentication, commerce rules, MySQL, Redis, and storage.
 */
export async function proxyCloudflareStagingApi(request: Request, fetcher: typeof fetch = fetch) {
  const target = getProxyTarget(request);
  const headers = cleanHeaders(request.headers, HOP_BY_HOP_REQUEST_HEADERS);
  headers.set("x-forwarded-proto", "https");
  headers.set("x-forwarded-host", new URL(request.url).host);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetcher(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
  });

  const responseHeaders = cleanHeaders(upstream.headers, HOP_BY_HOP_RESPONSE_HEADERS);
  // Authentication, checkout, case evidence, and tRPC responses must never be
  // stored at the Cloudflare edge or shared between browser sessions.
  responseHeaders.set("cache-control", "no-store, private, max-age=0");
  responseHeaders.set("x-content-type-options", "nosniff");
  responseHeaders.set("x-robots-tag", "noindex, nofollow, noarchive");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
