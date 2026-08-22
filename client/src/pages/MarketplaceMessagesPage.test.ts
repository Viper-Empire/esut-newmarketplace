import { describe, expect, it } from "vitest";
import { ACTIVE_THREAD_REFRESH_MS, conversationInitials, filterMessageConversations } from "./MarketplaceMessagesPage";

const rows = [{ conversation: { id: 1 }, listing: { title: "Campus Laptop", slug: "campus-laptop" }, store: { name: "Tech Hub", slug: "tech-hub" }, counterparty: { name: "Ada Okafor", avatarUrl: null }, latestMessage: { body: "Is it available?", createdAt: new Date(), isMine: false } }];

describe("marketplace message workspace helpers", () => {
  it("creates safe initial avatars and filters only supplied authorized conversation rows", () => {
    expect(conversationInitials("Ada Okafor")).toBe("AO");
    expect(filterMessageConversations(rows, "tech")).toHaveLength(1);
    expect(filterMessageConversations(rows, "unrelated")).toHaveLength(0);
  });

  it("uses a modest active-thread refresh interval", () => {
    expect(ACTIVE_THREAD_REFRESH_MS).toBe(5_000);
  });
});
