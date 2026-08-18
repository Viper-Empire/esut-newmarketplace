import { describe, expect, it } from "vitest";
import { resolveTheme } from "./ThemeContext";

describe("theme preference resolution", () => {
  it("keeps explicit light and dark preferences stable", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the operating-system preference when System is selected", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});
