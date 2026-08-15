export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createMarketplaceApiFetch(fetchImpl: FetchLike = globalThis.fetch.bind(globalThis)) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetchImpl(input, { ...(init ?? {}), credentials: "include" });
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (contentType.includes("application/json")) return response;

    const preview = (await response.clone().text()).replace(/\s+/g, " ").trim().slice(0, 120);
    const appearsToBeHtml = /<!doctype|<html|<body/i.test(preview);
    const endpoint = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
    const reason = appearsToBeHtml
      ? "The marketplace received a webpage instead of API data."
      : "The marketplace received an unexpected API response.";

    throw new Error(`${reason} Request: ${endpoint}. Please refresh and try again; if this persists, contact marketplace support.`);
  };
}
