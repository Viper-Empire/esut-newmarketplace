# ESUT Marketplace — Cloudflare Pages Pipeline and Frontend Environment Guide

**Status:** Deployment guidance only.  
**Change status:** No Cloudflare Pages project, DNS record, GitHub connection, environment variable, secret, code, build setting, or deployment was created or changed.

## Purpose and Boundary

Cloudflare Pages should initially host only the **static React/Vite frontend**. It is not a replacement for the current Node/Express/tRPC API, MySQL/TiDB-compatible database, Redis service, or server-side storage/email integrations.

```text
Cloudflare Pages
  └── React/Vite static frontend, route assets, public UI
          ↓
Node/Express/tRPC API origin
  ├── MySQL/TiDB-compatible authoritative database
  ├── Redis temporary security state
  ├── object storage
  └── transactional email and operational services
```

> **Critical rule:** A Vite variable beginning with `VITE_` is bundled into the browser application at build time. It is public configuration, not a secret. Never place database, Redis, JWT, R2, Cloudflare API, Resend, email, signing, or private backend credentials in a `VITE_*` variable.

## Current Application Facts

| Area | Current state | Cloudflare Pages implication |
|---|---|---|
| Frontend framework | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, TanStack Query. | Compatible with a static Pages deployment. |
| Vite project root | `client/`, defined in `vite.config.ts`. | Pages should build from the repository root so it uses the project Vite configuration. |
| Vite output directory | Absolute project path resolving to `dist/public`. | The Pages build output directory must be **`dist/public`**, not the Vite preset’s typical `dist`. |
| Current full build script | `pnpm run build` runs `vite build` and then bundles the Node server. | Do not use this as the initial Pages build command; Pages only needs the static frontend output. |
| Current tRPC transport | `httpBatchLink` calls relative path `/api/trpc`. | A standalone Pages frontend cannot reach the current Node API at a different hostname unless a same-origin proxy or a deliberate API-base-URL/CORS/cookie change is implemented and tested. |
| Current frontend Vite variables referenced in source | `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` appear only in the legacy `startLogin` helper, which has no active caller. | Do not assume the legacy OAuth helper is a deployed authentication path; the current first-party account flow must remain functional in staging. |
| SPA routing | Wouter client-side routes and no top-level `404.html` in `client/public`. | Pages identifies this shape as a SPA and uses its default SPA fallback behavior for unknown client routes.[1] |

## Recommended Git-Based Deployment Pipeline

Cloudflare Pages creates production deployments from the configured production branch and creates unique preview URLs for eligible pull requests/branches. Preview URLs are public by default, but can be protected with Cloudflare Access.[2]

| Git branch/use | Pages environment | Recommended URL exposure | Required gate |
|---|---|---|---|
| `main` | Production Pages deployment | Keep on the default `*.pages.dev` address initially; attach the public domain only after end-to-end acceptance testing. | Protected branch, review, tests, and explicit owner release decision. |
| `cloudflare-staging` | Branch preview / staging alias | Protect with Cloudflare Access and use only synthetic/test accounts. | Test frontend/API origin, sessions, buyer/seller/admin routes, and rollback. |
| Feature pull requests | Unique preview URL | Cloudflare Access protection required because the marketplace is not a public demo. | UI and non-sensitive API-flow verification only. |
| Emergency rollback | Re-deploy a known prior Pages deployment or revert the source commit. | Keep production domain unchanged until a validated release exists. | Confirm frontend asset version and API compatibility after rollback. |

## Cloudflare Pages Project Configuration

Create this only after explicit implementation authorization.

| Pages setting | Recommended value for current repository | Reason |
|---|---|---|
| Git integration | Connect the existing private GitHub repository to an ESUT Marketplace organization-owned Cloudflare account. | Provides traceable commits, previews, and controlled ownership. |
| Production branch | `main` | Matches the existing protected project branch. |
| Root directory | Repository root: leave blank / `/` depending on the Pages UI. | `vite.config.ts` and `package.json` are at project root, even though Vite’s client root is `client/`. |
| Framework preset | React (Vite) as a starting preset. | Pages documents Vite/React support, but the output directory must be overridden for this project.[3] |
| Install command | Let Pages use the lockfile/package-manager workflow; confirm it uses pnpm from `packageManager`. | Preserves the locked dependency graph. |
| Build command | `pnpm exec vite build` | Builds only the static Vite frontend and avoids the current Node-server bundling step. |
| Build output directory | `dist/public` | Matches the explicit `outDir` in `vite.config.ts`. |
| Pages Functions | Do not add in the first frontend-only stage. | The existing API remains in the Node/Express runtime; adding a proxy/function changes the security boundary. |
| Custom production domain | Do not connect during initial staging. | Avoids a public traffic cutover before login, API, storage, and rollback validation. |

Cloudflare Pages marks a build successful from the build command’s exit code and uploads the configured build directory. The React/Vite preset normally uses `npm run build` and `dist`, but this application has an intentionally customized output directory, so `dist/public` is the correct project-specific target.[3]

## Pre-Deployment Build Verification

Run these checks in the existing development environment and in CI before the Pages build is allowed to represent a release:

```text
pnpm check
pnpm test
pnpm exec vite build
```

The Pages pipeline should initially build the static frontend only. The existing `pnpm run build` command remains appropriate for the current unified Node deployment but is not the right first Pages command because it additionally bundles `server/_core/index.ts`.

## API-Origin Decision: Required Before the Frontend Can Work Externally

The current frontend uses a relative tRPC URL:

```text
/api/trpc
```

When the frontend moves to `https://<project>.pages.dev`, that relative URL points to Pages—not to the present Node API. One of these two designs must be chosen and tested before any real Pages release:

| Design | How it works | Benefits | Risks/required work |
|---|---|---|---|
| **A. Same-origin API proxy** | A separate, controlled Cloudflare edge route proxies `/api/*` from the Pages hostname to the Node API origin. | Preserves relative URLs and avoids most browser CORS complexity. | This is not “Pages only”; it needs a separate edge/API configuration, authorization-aware forwarding, cookie validation, failure handling, and security review. |
| **B. Separate API hostname** | The frontend calls `https://api.<domain>` through a new public configuration value such as `VITE_API_BASE_URL`. | Clear API boundary; Node API remains separately deployable. | Requires frontend code change, narrow CORS allowlist, credentialed requests, cookie-domain/SameSite review, CSRF analysis, and staging tests for every authenticated role. |

No temporary workaround should hardcode a development API URL, expose the current managed backend URL publicly without review, disable authentication protections, or send credentials to an arbitrary origin.

## Frontend Environment-Variable Model

### Public Build Configuration — Permitted Only When Needed

Use build-time `VITE_*` variables only for values that are safe for every site visitor to view in the compiled JavaScript bundle.

| Variable | Purpose | Safe in browser bundle? | Current status |
|---|---|---:|---|
| `VITE_APP_TITLE` | Public website title. | Yes. | Optional public branding configuration. |
| `VITE_APP_LOGO` | Public logo URL/path. | Yes. | Optional public branding configuration. |
| `VITE_API_BASE_URL` | Future external Node API origin, e.g., `https://api.example.org`. | Yes; endpoint URL is public, but API must secure every request. | **Do not add until the API-host/cookie/CORS design is approved.** |
| `VITE_OAUTH_PORTAL_URL` | Legacy public OAuth portal URL. | Yes, but only if that flow is deliberately retained. | Currently referenced only by an unused helper. |
| `VITE_APP_ID` | Public OAuth application identifier, if applicable. | Usually public identifier, not a secret. | Currently referenced only by the unused helper. |
| `VITE_ANALYTICS_ENDPOINT` | Public browser telemetry ingestion endpoint. | Yes, if the endpoint is designed for untrusted browser input. | Must retain rate limiting and privacy protections. |
| `VITE_ANALYTICS_WEBSITE_ID` | Public analytics site identifier. | Yes. | Must not grant write/admin access. |

### Server-Only Secrets — Never in Pages Frontend Build Variables

| Sensitive value | Correct location | Why it must not enter Pages frontend configuration |
|---|---|---|
| `DATABASE_URL` | Node API host secret manager only. | Direct database access from browsers is unsafe. |
| `JWT_SECRET` | Node API host secret manager only. | Exposure breaks session integrity. |
| Redis URL/password | Node API host secret manager only. | Exposure permits tampering with security controls. |
| Resend API key | Node API host secret manager only. | Exposure permits unauthorized email sending. |
| R2/S3 access keys and secret keys | Node API/secure signing service only. | Exposure grants file read/write capabilities. |
| Cloudflare cache-purge API token | Node API/secure purge service only. | Exposure allows cache disruption or stale content control. |
| Malware-scanner credentials | Scanning worker/service secret manager only. | Exposure allows misuse of scanning service. |
| Seller verification/evidence access URLs | Never persist as frontend build variables. | Private evidence needs per-request authorization and short-lived access. |

> Adding a value through the Cloudflare dashboard’s “secret” interface does **not** make it safe for a Vite frontend if the build uses it to create `VITE_*` output. If a value is present in the generated JavaScript, every browser visitor can read it.

## Pages Environment Separation

Use distinct Pages environment values for preview/staging and production where the UI/account configuration supports scope separation. The production environment must never point at a test API, while previews should not be given production secrets or access to real customer accounts.

| Environment | Public frontend values | API/data access policy |
|---|---|---|
| Local development | Local/public development endpoints only. | Existing managed development runtime and test accounts; no copied production secret files. |
| Preview/branch | Preview title/logo if useful; staging-only API origin if separate API hosting is enabled. | Synthetic data/test accounts only; Cloudflare Access enabled; no production database connection from browser. |
| Production | Final public title, logo, and approved production API origin. | Only after API, CORS, cookies, storage, email, monitoring, and rollback checks pass. |

Cloudflare injects useful build metadata such as `CF_PAGES_BRANCH`, `CF_PAGES_COMMIT_SHA`, and `CF_PAGES_URL`. These may be used for non-sensitive build labeling or error-release metadata, not for access control.[3]

## Caching and Headers for Pages

Cloudflare Pages already provides CDN behavior for deployed static assets and identifies applications without a top-level `404.html` as SPAs. Cloudflare advises against broad custom caching because it can serve stale deployment assets or interfere with redirects/functions.[1]

For the first Pages deployment:

1. **Use the default Pages cache behavior** for static assets.
2. Do not add a catch-all cache rule for the custom domain.
3. Do not cache `/api/*`, any authenticated route, or any future same-origin API proxy.
4. Introduce custom immutable-asset or public-read cache rules only through the separately approved cache/R2 blueprint and staging test plan.
5. Keep private data policy at `Cache-Control: private, no-store` from the API response, independent of frontend hosting.

## Preview Security and Acceptance Gates

Cloudflare preview deployments are public by default. Cloudflare Access can restrict preview deployment access, while Pages itself supplies `X-Robots-Tag: noindex` to previews.[2]

Before merging a Pages configuration to the production branch, validate:

| Test | Required result |
|---|---|
| Build | `pnpm check`, current Vitest suite, and `pnpm exec vite build` pass. |
| Routing | Direct browser access to public product, login, registration, buyer, seller, and administrator frontend routes behaves as intended. |
| API connection | No request is accidentally sent to a Pages 404/static asset path; API origin and failure behavior are explicit. |
| Authentication | Login, registration, logout, session expiry, lockout countdown, and secure cookie behavior work on the actual preview origin. |
| Authorization | Buyer, seller, moderator/admin, and super-admin views cannot access one another’s protected data. |
| File/media | Public media is public only where intended; private evidence cannot be recovered from frontend assets or cache. |
| Operational safety | Error monitoring, API failure telemetry, rollback route, and noindex/Access preview protections are confirmed. |
| DNS | The existing live domain is unchanged until every above acceptance check has passed. |

## Controlled Rollback Model

| Failure type | Immediate action | Protects |
|---|---|---|
| Static asset/build failure | Keep existing live frontend; inspect Pages preview build log; fix through a new reviewed commit. | Prevents broken public frontend release. |
| API-origin/CORS/cookie failure | Stop at preview; do not attach production domain; retain current unified runtime. | Prevents login/dashboard/checkout failure. |
| Unexpected stale content | Disable the newly introduced narrow cache rule or roll back to prior deployment; do not purge everything as the first response. | Prevents origin/database surge and preserves diagnosis. |
| Credential exposure concern | Revoke/rotate the affected secret at the server/provider immediately; rebuild static frontend without the value; inspect source history and build logs. | Limits compromise impact. |
| Domain/cutover error | Revert DNS/domain routing to the known managed deployment. | Restores the current controlled-launch baseline. |

## Implementation Authorization Gates

Before any actual Pages project or code/configuration work begins, the owner must explicitly authorize:

1. Cloudflare organization/account ownership, least-privilege team roles, and billing owner.
2. GitHub repository connection and production-branch policy.
3. Preview protection through Cloudflare Access and the allowed test-user policy.
4. The separate API origin design—same-origin proxy or external `api` subdomain—before a Pages frontend can call real services.
5. Any public `VITE_*` variables, each reviewed as browser-visible.
6. A staging-only Pages project and temporary domain before production DNS is considered.
7. Explicit `READY` authorization before any source code, Pages project, Git integration, environment variable, Cloudflare Access rule, cache configuration, domain, or DNS change.

## References

[1]: [Cloudflare Pages: serving Pages sites and SPA behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)

[2]: [Cloudflare Pages: preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)

[3]: [Cloudflare Pages: build configuration and build environment variables](https://developers.cloudflare.com/pages/configuration/build-configuration/)

[4]: [Cloudflare Workers: environment variables and secrets](https://developers.cloudflare.com/workers/configuration/environment-variables/)

[5]: [Current Vite build configuration](vite.config.ts)

[6]: [Current project scripts and dependencies](package.json)

[7]: [Current frontend tRPC client configuration](client/src/main.tsx)
