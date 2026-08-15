import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pagesDir = join(process.cwd(), "client/src/pages");
const excluded = new Set(["ComponentShowcase.tsx"]);

function productionPages() {
  return readdirSync(pagesDir)
    .filter(file => file.endsWith(".tsx") && !excluded.has(file))
    .map(file => ({ file, source: readFileSync(join(pagesDir, file), "utf8") }))
    .filter(({ source }) => source.includes("useQuery") || source.includes("useMutation"));
}

describe("production UI state audit contract", () => {
  it("keeps every production data page covered by loading or pending and failure/success feedback markers", () => {
    const pages = productionPages();
    expect(pages.length).toBeGreaterThan(10);
    for (const { file, source } of pages) {
      const hasLoadingOrPending = /isLoading|isPending|AdminQueryFeedback|Loading/.test(source);
      const hasFailureFeedback = /isError|onError|AdminQueryFeedback|role=\"alert\"|toast\.error/.test(source);
      const hasSuccessOrRealDataPath = /onSuccess|toast\.success|\.data\?|\.map\(/.test(source);
      expect(hasLoadingOrPending, `${file} lacks loading/pending feedback`).toBe(true);
      expect(hasFailureFeedback, `${file} lacks failure feedback`).toBe(true);
      expect(hasSuccessOrRealDataPath, `${file} lacks success/real-data feedback`).toBe(true);
    }
  });
});
