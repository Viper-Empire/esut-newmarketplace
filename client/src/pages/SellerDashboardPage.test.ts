import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SellerDashboardPage.tsx", import.meta.url), "utf8");

describe("seller workspace messaging continuity", () => {
  it("exposes a direct protected messages entry point without fabricated counts", () => {
    expect(source).toContain('{ label: "Messages", href: "/seller/messages", icon: MessageCircle }');
    expect(source).toContain('title="Open messages"');
    expect(source).toContain('detail="Reply to buyer questions"');
  });
});
