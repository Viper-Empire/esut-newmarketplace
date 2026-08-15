import { describe, expect, it } from "vitest";
import { MARKETPLACE_PAGE_SIZE } from "./marketplace";

describe("marketplace pagination contract", () => {
  it("uses the server-supported maximum page size", () => {
    expect(MARKETPLACE_PAGE_SIZE).toBe(24);
  });
});
