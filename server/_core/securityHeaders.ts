type HeaderRequest = {
  secure?: boolean;
  headers: Record<string, string | string[] | undefined>;
};

type HeaderResponse = {
  setHeader: (name: string, value: string) => void;
};

function forwardedHttps(request: HeaderRequest) {
  const forwarded = request.headers["x-forwarded-proto"];
  const firstValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return firstValue?.split(",")[0]?.trim().toLowerCase() === "https";
}

export function applySecurityHeaders(request: HeaderRequest, response: HeaderResponse) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Content-Security-Policy", "frame-ancestors 'none'");

  if (Boolean(request.secure) || forwardedHttps(request)) {
    response.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
}
