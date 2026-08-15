# Response-Safety Validation Map

| Route group | Controlled browser regression | Expected safe behavior | Status |
| --- | --- | --- | --- |
| `/` marketplace home | `guarded transport presents a recovery boundary when the public query returns HTML` | Homepage shows the marketplace-collections recovery boundary and never exposes raw `Unexpected token` text | Pass |
| `/account` authenticated boundary | `guarded authentication transport keeps a protected route at its access boundary when HTML is returned` | Account remains at the sign-in/access boundary and never exposes raw parser text | Pass |
| `/explore`, `/product/nonexistent-safe-probe` | `high-traffic public catalog routes avoid raw parse errors when HTML is returned` | Public catalogue/detail shells avoid raw parser text under controlled HTML responses | Pass |
| `/cart`, `/checkout` | `high-traffic buyer routes avoid raw parse errors when HTML is returned` | Guest/protected buyer routes avoid raw parser text while preserving their access or recovery shell | Pass |
| `/sell`, `/seller`, `/moderator`, `/admin` | `seller, moderator, and administrator routes avoid raw parse errors when HTML is returned` | Protected role boundaries and seller onboarding shells avoid raw parser text under controlled HTML responses | Pass |
| Shared transport | `client/src/lib/trpcFetch.test.ts` and `server/_core/apiFallback.test.ts` | HTML or non-JSON responses are converted into guarded client/server errors rather than unsafe JSON parsing | Pass |

## Interpretation

These are controlled end-to-end browser regressions: Playwright intercepts the application’s `/api/trpc/**` requests and returns an HTML document. They verify the user-facing safety boundary across representative public, buyer, seller, moderator, and administrator routes. They do **not** claim that the historical development-server disconnect was reproduced. That infrastructure condition remains a separate open evidence item in `todo.md`.

The map is intentionally explicit about coverage boundaries. It records exact test titles and route groups rather than implying that one representative route proves every possible runtime failure mode.

Generated: 2026-08-16
