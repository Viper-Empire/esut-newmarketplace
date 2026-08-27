import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(process.cwd(), "client/src/pages/AdminSuitePages.tsx"), "utf8");

describe("administrator audit-note controls", () => {
  it("uses the structured audit-note dialog rather than browser-native prompts", () => {
    expect(source).toContain('import { ActionReasonButton } from "@/components/ActionReasonButton"');
    expect(source).toContain("<ActionReasonButton");
    expect(source).not.toContain("window.prompt");
  });

  it("keeps the requested admin control-center surfaces wired to audited procedures", () => {
    expect(source).toContain("trpc.admin.deleteUser.useMutation");
    expect(source).toContain("Delete marketplace account");
    expect(source).toContain("PENDING_VALIDATION");
    expect(source).toContain("trpc.admin.reviewNewListing.useMutation");
    expect(source).toContain("Approve new seller listing");
    expect(source).toContain("Reject new seller listing");
    expect(source).toContain('"Active users"');
    expect(source).toContain('"New listings"');
    expect(source).toContain("activeUserCount");
    expect(source).toContain("newListingCount");
  });
});


describe("administrator workspace data rendering", () => {
  it("does not wrap query feedback in an always-truthy JSX element", () => {
    expect(source).toContain("const feedback = AdminQueryFeedback({ loading: users.isLoading");
    expect(source).toContain("const feedback = AdminQueryFeedback({ loading: listings.isLoading");
    expect(source).not.toContain("const feedback = <AdminQueryFeedback");
  });

  it("provides a shared workspace header and escape route", () => {
    expect(source).toContain("admin-workspace-header");
    expect(source).toContain('href=\"/admin\" className=\"admin-back-link\"');
  });
});
