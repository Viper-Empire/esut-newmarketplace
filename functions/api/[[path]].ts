import { proxyCloudflareStagingApi } from "../../shared/cloudflareStagingApiProxy";

type PagesFunctionContext = {
  request: Request;
};

/**
 * Cloudflare Pages Function catch-all for staging API traffic. Public frontend
 * assets remain on Pages; only /api/* reaches the existing Node/tRPC backend.
 */
const proxyRequest = async (context: PagesFunctionContext) => {
  try {
    return await proxyCloudflareStagingApi(context.request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to proxy the staging API request.";
    return Response.json({ error: message }, { status: 400, headers: { "cache-control": "no-store" } });
  }
};

export function onRequest(context: PagesFunctionContext) { return proxyRequest(context); }
// Explicit write-method declarations avoid a Pages routing method fallback for tRPC mutations.
export function onRequestGet(context: PagesFunctionContext) { return proxyRequest(context); }
export function onRequestPost(context: PagesFunctionContext) { return proxyRequest(context); }
export function onRequestPut(context: PagesFunctionContext) { return proxyRequest(context); }
export function onRequestPatch(context: PagesFunctionContext) { return proxyRequest(context); }
export function onRequestDelete(context: PagesFunctionContext) { return proxyRequest(context); }
export function onRequestOptions(context: PagesFunctionContext) { return proxyRequest(context); }
