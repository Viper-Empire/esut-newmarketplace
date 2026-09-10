import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "dist/index.js",
  "dist/public/index.html",
];

const missing = requiredFiles.filter((relativePath) => !existsSync(resolve(root, relativePath)));
if (missing.length > 0) {
  console.error(`Deployment verification failed. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

const empty = requiredFiles.filter((relativePath) => statSync(resolve(root, relativePath)).size === 0);
if (empty.length > 0) {
  console.error(`Deployment verification failed. Empty files: ${empty.join(", ")}`);
  process.exit(1);
}

console.log("Deployment verification passed.");
console.log("- Production server bundle: dist/index.js");
console.log("- Frontend shell: dist/public/index.html");
console.log("- Dependency lockfile: pnpm-lock.yaml");
