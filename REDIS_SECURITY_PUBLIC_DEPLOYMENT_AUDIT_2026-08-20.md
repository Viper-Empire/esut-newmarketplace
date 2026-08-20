# ESUT Marketplace Redis Security and Public Deployment Audit

**Prepared:** 20 August 2026  
**Scope:** Redis temporary security state, contact-information validation, authentication, password management, seller onboarding, messaging abuse protection, and public deployment readiness.

## Executive Assessment

The marketplace now uses Redis only as a **server-side, temporary security-state component**. MySQL/TiDB remains the source of truth for all permanent marketplace information. Redis does not receive marketplace records, passwords, payment information, identity evidence, products, orders, profiles, seller records, reset tokens, or raw personal identifiers.

The configured `REDIS_URL` was validated using a server-only authenticated TLS PING test. The runtime adapter then independently completed an atomic counter/lockout test against the configured service. The public test suite does not mutate the configured Redis service; its one live Redis mutation test runs only when explicitly invoked with `REDIS_SECURITY_TEST=1`.

| Control area | Production status | Evidence |
|---|---|---|
| Shared lockout state | Implemented | HMAC-derived Redis keys, atomic Lua counter/lock operation, explicit TTLs. |
| Browser authority | Prohibited | Browser receives only safe `retryAt` metadata from an established 429 decision. |
| Permanent marketplace data | Excluded | No product, order, profile, payment, document, session, or audit-log record is stored in Redis. |
| Redis connectivity | Verified | Server-only TLS PING and opt-in atomic limit test pass. |
| Redis interruption | Conservatively degraded | Existing durable database throttles remain active; users see no provider error. |
| Contact validation | Strengthened | Shared normalized email and canonical Nigerian mobile validation are server-authoritative. |
| Regression assurance | Verified | 37 ordinary test files: 119 passed, 1 explicitly skipped live-state test; dedicated opt-in Redis checks: 4 passed. |

## Redis Data Boundary

Redis keys are built from the namespace `esut-marketplace:v1:security`, a scope, and an HMAC-derived identifier. No raw email address, IP address, user ID, password, token, phone number, document key, or payment value appears in a key or value.

| Permitted temporary state | Value shape | Expiry |
|---|---|---|
| Login failure count | Integer | Fifteen minutes |
| Login lock marker | Constant marker | Fifteen minutes |
| Public endpoint request count | Integer | Endpoint-specific; currently fifteen minutes |
| Password-reset request count | Integer | One hour |
| Seller onboarding request count | Integer | One hour |
| Message-send request count | Integer | One minute counter / ten-minute lockout |

All limit decisions are made by the server. Redis performs the counter increment, initial key expiry, lock creation, and retry lifetime in one Lua operation, avoiding a race where concurrent requests can pass the threshold independently.

## Contact Information Policy

| Persisted field | New-submission policy | Stored representation | Existing-record handling |
|---|---|---|---|
| `users.email` | Trim, NFKC-normalize, lowercase, reject control characters/whitespace, enforce bounded mailbox/domain syntax. | Lowercase normalized mailbox. | Existing records are preserved and are not destructively transformed. |
| Seller verification email | Same shared email policy. | Normalized email in verification request. | Existing evidence and requests are preserved. |
| `profiles.phone` | Accept Nigerian presentation formats only when they normalize to a valid mobile number. | Canonical `+234...` number. | Existing records remain unchanged until edited or resubmitted. |
| Seller application and store contact phone | Same shared Nigerian mobile policy. | Canonical `+234...` number. | Existing records remain intact. |

Client checks mirror these rules to provide immediate feedback, but the server validators are the security boundary.

## Authentication and Onboarding Endpoint Review

| Endpoint / workflow | Authorization and validation | Abuse and non-disclosure control |
|---|---|---|
| Account registration | Public; strict name, email, phone, registration-intent, and password validation. | Endpoint/IP-derived temporary limit; no administrative role can be self-registered. |
| Password login | Public; strict normalized email and bounded password input. | Endpoint/IP limit plus account-derived atomic Redis failure/lock state; 429 retry time after threshold; generic invalid-credential response. |
| Password-reset request | Public; strict normalized email. | Endpoint/IP limit plus temporary HMAC email limit; same generic success response whether an account exists or not. |
| Password reset completion | Opaque token must be hashed, unconsumed, and within its expiry. | Token consumed in the same transaction as password replacement and durable lock reset. |
| Password change | Authenticated user required; current password and new-password confirmation verified. | Existing authenticated throttle and audit record preserved. |
| Email verification completion | Opaque hashed, unconsumed, unexpired token required. | Registration is already endpoint-limited. There is currently no public verification-resend procedure; a future resend action must use the same temporary limit policy. |
| Seller verification | Authenticated user required; strict evidence schema and email/business contracts. | Account-scoped onboarding limit; storage remains private server-side; status review remains administrator-controlled. |
| Store application | Authenticated user and corresponding approved seller verification required. | Account-scoped onboarding limit; owner-only application history and existing review workflow preserved. |
| Marketplace messaging | Authenticated conversation participant/owner checks remain required. | Account-scoped message-send limit; recipient and conversation access checks remain intact. |

## Failure and Observability Policy

If Redis cannot be reached or rejects a command, the user does not receive its endpoint, credential, error message, or provider details. The server sets a short degraded period, uses the pre-existing database throttle for critical decision paths, and logs only a rate-limited generic server warning. Meaningful durable events remain in the existing audit ledger: account login failure, account lockout, and protected-procedure rate-limit violation. Audit metadata carries the narrow scope and whether the decision came from Redis or the database fallback; it excludes raw credentials, reset tokens, raw addresses, and Redis keys.

> Redis Cloud Free is accepted only for the present security-only launch boundary. Its lack of high availability means Redis is not the sole control and must be upgraded before it becomes a material public-availability dependency or capacity/connection pressure appears.

## Files Changed

| File | Security responsibility |
|---|---|
| `server/securityState.ts` | Pooled server-only RESP connection, HMAC-derived namespaced keys, atomic Lua limits, TTLs, retry times, and safe degraded state. |
| `server/localAuth.ts` | Shared normalized strict marketplace email validation alongside canonical Nigerian phone handling. |
| `server/routers.ts` | Redis-backed public auth throttle, account lockout, reset protection, seller onboarding/message limits, and database fallback. |
| `server/sellerVerification.ts` | Shared strict verification-email input contract. |
| `client/src/pages/AuthPage.tsx` | Client email usability check aligned with the server policy. |
| `server/redis.secret.test.ts` | Server-only Redis secret connection check. |
| `server/securityState.test.ts` | Key-privacy, atomic lockout, and fallback coverage. |
| `server/localAuth.test.ts` | Strict normalized email regression coverage. |

## Operational Follow-up

The administrator team should periodically review protected audit alerts for `AUTH_LOGIN_LOCKED` and `SECURITY_RATE_LIMITED` actions, confirm Redis capacity and connection usage remain within the chosen provider tier, and upgrade the Redis offering before high-availability requirements, sustained public traffic, or new session/queue use cases emerge. Redis must remain absent from marketplace business transactions unless a separately approved design changes that boundary.
