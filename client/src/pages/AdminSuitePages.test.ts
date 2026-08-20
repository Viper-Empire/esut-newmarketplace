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
});
