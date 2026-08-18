# ESUT Marketplace Administrator Endpoint Security Verification Report

## Executive result

The recheck confirms that administrator procedures are protected server-side. Signed-out live requests to `admin.dashboard` and `admin.auditLogs` returned HTTP 403 with a safe `FORBIDDEN` response. A signed-out request to the private verification-evidence storage boundary returned HTTP 401. The endpoint regression suite now covers signed-out callers, ordinary customers, sellers, moderators, role-like input tampering, and administrator-role allowlisting.

One important discrepancy was found in the manual role observation: the live database currently contains five active `CUSTOMER` accounts, five active `SELLER` accounts, and one active `SUPER_ADMIN` account. There is no `ADMIN` account, but there is an elevated `SUPER_ADMIN` account. No role was created, changed, or promoted during this audit. Credential values were not inspected or included in this report.

## Access-control findings

The production router uses `adminProcedure`, which allows only `ADMIN` and `SUPER_ADMIN` roles. Signed-out callers are denied before administrator queries execute. Customer, seller, and moderator callers are denied from administrator dashboard, audit-log, and user-activation procedures. Client-supplied actor or role-like values do not influence authorization because the role is taken from the server-side authenticated user context.

The request authenticator verifies the signed session, reloads the user from the database on every request, rejects missing users, and rejects inactive accounts. This means role and active-state changes are re-evaluated against current database state rather than trusted from the browser or an old client projection. Private verification-evidence storage keys require an active administrator or super administrator before a signed storage redirect can be generated.

## Live checks performed

| Surface | No-cookie result | Sensitive data observed |
|---|---:|---|
| `/api/trpc/admin.dashboard` | HTTP 403 | None |
| `/api/trpc/admin.auditLogs` | HTTP 403 | None |
| `/manus-storage/verification-evidence/...` | HTTP 401 | No evidence URL or document |
| `/admin` in the connected browser | Existing authenticated administrator session | Administrator data rendered because the browser session is already authorized |

The connected browser session was not treated as an unauthorized test subject because it was already authenticated. The no-cookie command-line checks were used for the signed-out boundary.

## Automated coverage

The new `server/adminEndpointSecurity.test.ts` invokes the production `appRouter` and verifies that signed-out callers and `CUSTOMER`, `SELLER`, and `MODERATOR` callers cannot invoke administrator dashboard, audit-log, or user-activation procedures. It also verifies that actor-like input does not grant permission and that the production router exposes administrator procedures only through the expected role guard. The full suite passes: 30 Vitest files and 87 tests.

## Confirmed and fixed issue

The first live unauthenticated administrator request returned a 403 but included a server stack trace and filesystem/module paths in the JSON error shape. This was an information-disclosure weakness, not an authorization bypass. The tRPC error formatter now removes the stack field from client responses while preserving the safe error code and message. A repeat live check confirmed the response contains `FORBIDDEN` and no `stack`, `/home/ubuntu`, `server/routers.ts`, or `server/_core` path markers.

## Residual risks and next controls

Application-level administrator authorization is verified, but the audit does not prove infrastructure controls such as database encryption at rest, cloud IAM, WAF policy, deployment-secret rotation, or provider-side access logs. The project still has one active `SUPER_ADMIN`; the owner should confirm that account’s ownership and rotate credentials if it is not intentional. MFA or step-up authentication for administrator actions remains the highest-priority next control. Additional production hardening should include alerting on repeated failed admin mutations, periodic role review, and an independent external penetration test before broad launch.
