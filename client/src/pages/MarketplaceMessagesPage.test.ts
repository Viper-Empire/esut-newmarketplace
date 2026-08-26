import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIVE_THREAD_REFRESH_MS, conversationInitials, filterMessageConversations } from "./MarketplaceMessagesPage";

const source = readFileSync(new URL("./MarketplaceMessagesPage.tsx", import.meta.url), "utf8");

const rows = [{ conversation: { id: 1 }, listing: { title: "Campus Laptop", slug: "campus-laptop" }, store: { name: "Tech Hub", slug: "tech-hub" }, counterparty: { name: "Ada Okafor", avatarUrl: null }, latestMessage: { body: "Is it available?", createdAt: new Date(), isMine: false } }];

describe("marketplace message workspace helpers", () => {
  it("creates safe initial avatars and filters only supplied authorized conversation rows", () => {
    expect(conversationInitials("Ada Okafor")).toBe("AO");
    expect(filterMessageConversations(rows, "tech")).toHaveLength(1);
    expect(filterMessageConversations(rows, "unrelated")).toHaveLength(0);
  });

  it("preserves a private, modern thread hierarchy and accessible composer contract", () => {
    expect(source).toContain("marketplace-chat-kicker");
    expect(source).toContain("marketplace-chat-privacy-pill");
    expect(source).toContain("Private marketplace thread");
    expect(source).toContain("marketplace-message-help");
    expect(source).toContain("aria-describedby=\"marketplace-message-help\"");
    expect(source).toContain("Conversation active");
    expect(source).toContain("Awaiting first message");
  });

  it("uses a modest active-thread refresh interval", () => {
    expect(ACTIVE_THREAD_REFRESH_MS).toBe(5_000);
  });
});
