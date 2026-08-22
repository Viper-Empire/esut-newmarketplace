import { proxyCloudflareStagingApi } from "../../shared/cloudflareStagingApiProxy";

type PagesFunctionContext = {
  request: Request;
};

/**
 * Cloudflare Pages Function catch-all for staging API traffic. Public frontend
 * assets remain on Pages; only /api/* reaches the existing Node/tRPC backend.
 */
export const onRequest = async (context: PagesFunctionContext) => {
  try {
    return await proxyCloudflareStagingApi(context.request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to proxy the staging API request.";
    return Response.json({ error: message }, { status: 400, headers: { "cache-control": "no-store" } });
  }
};
