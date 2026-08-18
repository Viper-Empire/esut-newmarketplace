# ESUT Marketplace Endpoint Exposure and Administrator Security Audit

**Author:** Manus AI  
**Audit scope:** Public routes, authenticated account access, seller and moderator procedures, administrator procedures, session handling, storage access, sensitive response fields, and regression validation.  
**Audit status:** Remediated high-priority findings; residual controls documented below.

## Executive assessment

The application has a strong server-side authorization foundation. Administrator procedures use `adminProcedure`, seller-sensitive operations use `verifiedSellerProcedure`, buyer and participant records are scoped to the authenticated user, and the public storefront is separated from protected workspaces at both the route and procedure layers. The administrator panel is not protected merely by hiding a link; direct requests to administrator tRPC procedures are rejected unless the current database-backed role is `ADMIN` or `SUPER_ADMIN`.

The audit found and remediated three meaningful boundary issues. Deactivated accounts were able to remain authenticated at the session middleware layer until an individual procedure checked activity; request authentication now rejects inactive users on every request. The client user projection excluded a known set of secrets but was not an allowlist; it now returns only explicitly approved identity and role fields. Finally, the public storage proxy accepted arbitrary storage keys; private `verification-evidence/` keys now require an active administrator session, while public listing media remains accessible through the same public-media route.

No claim is made that the system has encryption in every layer. Passwords are represented by password hashes, pickup confirmation codes are encrypted before storage, HTTPS is required for secure production cookies, and private evidence is accessed through managed signed storage URLs. Database and object-storage encryption-at-rest, key rotation, Web Application Firewall policy, administrator MFA, and centralized security monitoring remain infrastructure or roadmap controls that must be confirmed in the hosting environment.

## Access-point inventory

| Surface | Intended access | Server control | Security conclusion |
|---|---|---|---|
| `/`, `/explore`, `/category/:slug`, `/product/:slug`, `/store/:slug` | Public marketplace discovery | Public procedures and public route components | Intentionally public; listing data should not contain private evidence keys. |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Public authentication and recovery | Throttled authentication procedures, opaque hashed tokens, session issuance | Public by design; abuse controls and token expiry are present. |
| `/cart`, `/checkout` | Guest or authenticated shopping depending on operation | Cart ownership and server-calculated checkout policy | Public entry is acceptable; checkout mutation remains protected and transactional. |
| `/account/*` | Authenticated buyer/member tools | `protectedProcedure`, user ownership predicates | Protected; direct route visibility is not treated as authorization. |
| `/sell` | Public onboarding explanation plus authenticated submission | Verification and application mutations are protected | Mixed route is intentional; sensitive submission remains authenticated and validated. |
| `/seller/*` | Verified seller operations | `sellerProcedure` and `verifiedSellerProcedure` plus store ownership | Protected; administrator roles receive operational bypass where intended. |
| `/moderator` and moderation procedures | Moderator, administrator, or super administrator | `moderatorProcedure` | Protected by role allowlist. |
| `/admin/*` | Administrator workspace | UI gate plus `adminProcedure` on server procedures | Direct access is denied without `ADMIN` or `SUPER_ADMIN`. |
| `/api/trpc/*` | API transport for all procedures | Procedure-level authorization and input schemas | The transport is reachable, but sensitive operations are not public. |
| `/manus-storage/*` | Public listing media and protected private evidence | Storage-key policy; evidence prefix requires active administrator authentication | Public media remains available; private evidence boundary is hardened. |
| `/api/oauth/callback` | OAuth callback | State nonce validation and one-time state cookie | Protected against callback CSRF through state validation. |
| `/api/health`-style system health procedure | Public health check | `system.health` uses a public procedure and returns only `{ ok: true }` | Low-risk intentional operational endpoint. |

## Administrator authorization findings

Administrator authorization is enforced in `server/_core/trpc.ts`. The `adminProcedure` checks the live request user role against `ADMIN` and `SUPER_ADMIN`; it is not based on a client-provided role, route parameter, or hidden navigation item. Administrator review mutations also write reviewer IDs, notes, timestamps, notifications, and immutable seller-attempt history.

The authentication context loads the user record from the database for each request. The audit identified that the context previously returned an inactive database user after session verification. This was corrected in `server/_core/sdk.ts`: an inactive account now fails request authentication before any protected or administrator procedure runs. Role changes and deactivation therefore take effect on the next request rather than waiting for cookie expiration.

The administrator UI contains a route-level access message, but that message is only a usability boundary. The real security boundary remains the server procedure middleware. This distinction is important because a user can manually navigate to `/admin` or call `/api/trpc` without receiving additional privilege.

## Sensitive-data review

The prior `toClientUser` projection removed selected sensitive fields but used an exclusion pattern. It now uses an explicit allowlist containing only `id`, `name`, `email`, `loginMethod`, `emailVerifiedAt`, `role`, `isActive`, `createdAt`, and `updatedAt`. Internal `openId`, password hashes, failed-login counters, lock timestamps, and last-sign-in metadata are no longer returned by `auth.me` or authentication mutation responses.

Seller evidence stores only an object-storage key in the database and does not copy evidence bytes into applicant history. The administrator evidence procedure checks administrator authorization before returning a short-lived signed URL. The storage proxy now separately protects keys beginning with `verification-evidence/` so a guessed or leaked private key cannot be fetched anonymously through `/manus-storage/*`.

Pickup confirmation codes are encrypted before persistence and are redacted from ordinary order projections. The buyer receives the readable code only for their own ready-for-pickup order, and the seller verifies it through a protected handoff procedure. Passwords are not returned to clients and are processed through the existing password hashing and verification helpers.

## Session and transport controls

Session cookies are `httpOnly`. For HTTPS requests, the cookie is `Secure` and uses `SameSite=None` to support the managed preview and cross-site browser conditions used by the application. For non-HTTPS local development, the cookie now uses `SameSite=Lax` and does not request `Secure`, avoiding an invalid local cookie configuration. The application also supports a bearer-session fallback for the managed preview environment; this is a deliberate framework compatibility path and should not be enabled as a general token-distribution pattern for third-party clients.

Authentication entrypoints are rate-limited using database-backed keys derived from the procedure path and client address. Login additionally enforces account lockout state. Password reset and verification tokens are stored as hashes, expire, and are consumed once. The current email-verification delivery mode is intentionally paused according to the project configuration and does not weaken password authentication.

## Applied hardening and validation

| Control | Change | Validation |
|---|---|---|
| Inactive-account enforcement | Reject inactive users during request authentication | TypeScript and full Vitest suite pass |
| Client user projection | Replace exclusion-based projection with explicit safe allowlist | Legacy password-claim regression updated to assert role preservation and no `openId`; full suite pass |
| Private evidence route | Require active administrator authentication for `verification-evidence/` keys | TypeScript pass; route policy is isolated by key prefix |
| Cookie policy | Use `SameSite=None` only for HTTPS and `Lax` locally, always `httpOnly` | Two focused security tests pass |
| Regression coverage | Added `server/securityHardening.test.ts` | 29 test files, 81 tests passed |

## Residual risks and recommended next controls

The largest remaining administrator risk is **single-factor administrator authentication**. The current system protects administrator procedures with role checks and session cookies, but it does not yet require MFA or step-up authentication for high-impact actions such as role promotion, account deactivation, evidence decisions, or bulk marketplace moderation. A future administrator security phase should add MFA or an equivalent step-up challenge without exposing recovery secrets to the client.

The storage proxy now protects the known private evidence prefix, but a future storage policy should centralize private/public object classification rather than relying on prefixes alone. Object-storage lifecycle expiry, signed-URL duration limits, key rotation, database encryption-at-rest confirmation, structured audit-log alerting, and a production WAF/rate-limit layer should also be confirmed before broad public launch.

The bearer fallback is appropriate for managed preview compatibility but should remain restricted to the trusted preview architecture. If external API clients are added later, they should use a separately scoped token model with audience, issuer, expiry, revocation, and audit controls rather than reusing browser session tokens.

## Conclusion

The administrator panel is protected by server-side role enforcement, not frontend visibility. The current audit remediated inactive-session persistence, broad user response projection, private evidence storage access, and local/production cookie-policy ambiguity. The application now has stronger least-privilege boundaries while preserving the existing buyer, seller, moderator, administrator, and public marketplace workflows. The next security priority should be administrator MFA or step-up authentication, followed by centralized storage policy and production infrastructure verification.
