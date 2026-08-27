import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appSource = fs.readFileSync(path.join(process.cwd(), "client/src/App.tsx"), "utf8");
const adminPageSource = fs.readFileSync(path.join(process.cwd(), "client/src/pages/AdminPage.tsx"), "utf8");
const routerSource = fs.readFileSync(path.join(process.cwd(), "server/routers.ts"), "utf8");

describe("Phase 1 administrator control-center contracts", () => {
  it("keeps public navigation out of admin routes and reserves the shared shell for administrators", () => {
    expect(appSource).toContain('const isAdminRoute = pathname.startsWith("/admin")');
    expect(appSource).toContain("{!isAdminRoute && <><PublicAccountActions/><ContextualNavigation/></>}");
    expect(appSource).toContain("<AdminControlCenterNav/>");
    expect(appSource).toContain('const isAdminWorkspace = isAdminRoute && !authLoading');
  });

  it("keeps verification on its dedicated route and mounts the real attention queue", () => {
    expect(appSource).toContain('<Route path="/admin/verifications" component={AdminVerificationsPage}/>');
    expect(adminPageSource).toContain("<AdminAttentionQueue/>");
    expect(adminPageSource).toContain('id="seller-applications"');
    expect(routerSource).toContain("attentionQueue: adminProcedure.query");
    expect(routerSource).toContain('href: "/admin/verifications"');
  });

  it("preserves verification audit attribution and avoids exposing private evidence in the queue contract", () => {
    expect(routerSource).toContain('action: input.approve ? "SELLER_VERIFICATION_APPROVED" : "SELLER_VERIFICATION_REJECTED"');
    expect(routerSource).toContain('targetType: "VERIFICATION_REQUEST"');
    expect(routerSource).toContain('href: "/admin#seller-applications"');
    expect(routerSource).not.toContain('href: "/admin/applications?status=PENDING"');
  });
});
