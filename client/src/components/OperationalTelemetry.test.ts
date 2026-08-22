import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(process.cwd(), "client/src/components/OperationalTelemetry.tsx"), "utf8");
const dashboardSource = fs.readFileSync(path.join(process.cwd(), "client/src/pages/AdminPage.tsx"), "utf8");
const mainSource = fs.readFileSync(path.join(process.cwd(), "client/src/main.tsx"), "utf8");

describe("operational telemetry privacy boundary", () => {
  it("records bounded categories and metrics without capturing error messages or client identifiers", () => {
    expect(source).toContain("CLIENT_ERROR");
    expect(source).toContain("ASSET_FAILURE");
    expect(source).toContain("WEB_VITAL");
    expect(source).toContain("window.location.pathname");
    expect(source).not.toContain("event.message");
    expect(source).not.toContain("event.reason");
    expect(source).not.toContain("navigator.userAgent");
  });

  it("surfaces aggregate operational health only in the protected administrator dashboard", () => {
    expect(dashboardSource).toContain("trpc.admin.operationalHealth.useQuery");
    expect(dashboardSource).toContain("Runtime and asset health");
    expect(dashboardSource).toContain("Error bodies, client identifiers, and query data are never stored.");
  });

  it("does not report a failed observability mutation as another API telemetry event", () => {
    expect(mainSource).toContain("isTelemetryRequestFailure");
    expect(mainSource).toContain("if (isTelemetryRequestFailure(error)) return;");
    expect(source).toContain("isCloudflareStagingPreview");
  });
});
