# ESUT Marketplace Administrator Endpoint Security Test Plan

## Goal

Recheck and verify that no unauthorized marketplace member can access administrator procedures, administrator data, private verification evidence, or administrator mutations. Confirm the user’s manual observation that no currently visible account has an administrator role, and produce an evidence-based security result without granting roles, changing marketplace records, or weakening existing controls.

## Scope

The review will cover the complete administrator access surface rather than only the `/admin` page. It will include frontend administrator routes, tRPC administrator procedures, moderator boundaries where they overlap with sensitive operations, session construction and revalidation, role and account-active checks, storage/evidence access, direct procedure invocation, IDOR/tampering attempts, and error responses.

The review will distinguish these states: signed-out visitor, authenticated ordinary buyer, authenticated seller, inactive member, moderator, administrator, and super administrator. If no authorized administrator account is available, administrator-positive behavior will be verified through existing procedure-level fixtures or controlled test doubles only; no production account will be promoted during the audit.

## Phase 1: Evidence inventory

1. Enumerate all frontend `/admin` routes and administrator navigation links.
2. Enumerate every `adminProcedure`, `moderatorProcedure`, `protectedProcedure`, and public procedure in `server/routers.ts` and related server modules.
3. Map each procedure to its intended role, mutation/query behavior, target ownership boundary, and sensitive response fields.
4. Inspect the authentication context, session token validation, cookie attributes, account-active enforcement, and role checks on every request.
5. Inspect storage-proxy routes and signed-evidence URL procedures to verify that private verification evidence cannot be accessed with a guessed key, public URL, or ordinary member session.
6. Read the live database role projection in a non-mutating way and report counts and identifiers only as necessary; never expose passwords, tokens, evidence keys, or private documents in the audit output.

## Phase 2: Unauthorized-access tests

1. Call representative administrator queries and mutations without a session and assert `UNAUTHORIZED` or the application’s equivalent protected response.
2. Call the same procedures as a normal authenticated buyer/seller fixture and assert `FORBIDDEN` or equivalent denial.
3. Attempt to access `/admin`, administrator subroutes, and audit-log routes as a signed-out visitor and ordinary member; verify that the UI does not reveal protected data or mutation controls.
4. Attempt role tampering through request inputs, client state, query parameters, and fabricated role values; verify that authorization is based on the server-side database role.
5. Attempt IDOR access by changing administrator resource identifiers for users, stores, orders, reports, applications, verifications, evidence, audit logs, and review records; verify that administrator-only procedures remain denied and that non-administrator ownership checks cannot be bypassed.
6. Attempt to reuse a session after deactivation or role downgrade; verify that request-time validation rejects the session where applicable.
7. Attempt direct access to private evidence storage keys and signed evidence URL procedures as signed-out and ordinary users; verify denial and absence of evidence content or URLs in responses.

## Phase 3: Authorized-control tests

1. Use existing administrator fixtures or a controlled test context to verify that legitimate administrator queries work.
2. Verify that administrator mutations write immutable audit records containing safe actor, action, target, and timestamp data.
3. Verify that audit-log filters cannot broaden access beyond administrator scope and that metadata redaction remains active under every filter combination.
4. Verify that moderators receive only their intended moderation capabilities and cannot invoke administrator-only user, role, settings, audit, or evidence operations unless the product explicitly assigns that capability.
5. Verify that `SUPER_ADMIN` and `ADMIN` behavior matches the documented policy and that self-deactivation protections remain intact.

## Phase 4: Regression and browser coverage

1. Add or extend Vitest procedure tests for signed-out denial, ordinary-member denial, moderator boundary, role tampering, inactive-session rejection, evidence protection, and IDOR cases.
2. Add browser scenarios for `/admin`, `/admin/audit-logs`, one administrator data route, and one administrator mutation route from signed-out and ordinary-member states.
3. Capture safe response assertions: status/error code, absence of sensitive fields, no raw stack traces, no HTML-as-JSON failure text, and no evidence URL leakage.
4. Run TypeScript validation, the full Vitest suite, and targeted Chromium coverage at desktop and mobile breakpoints.
5. Review logs for the test window and confirm no administrator role was created, no marketplace data was changed, and no real evidence was downloaded.

## Reporting and acceptance criteria

The final handoff will classify each endpoint as public, authenticated-member, moderator, administrator, or super-administrator; identify any confirmed exposure; list all applied fixes separately from recommendations; and record residual risks. The audit passes only if every administrator procedure denies signed-out and ordinary-member access, role values cannot be client-forged, private evidence remains protected, sensitive responses are allowlisted/redacted, and the tests pass without granting an admin role or mutating production marketplace records.

## Assumptions and risks

The audit assumes the existing project database and test fixtures are available. If there is no authorized administrator session, positive administrator behavior will be tested through isolated fixtures rather than live role promotion. A browser-level test can verify route boundaries but cannot prove infrastructure-level WAF, database encryption-at-rest, cloud IAM, or deployment-secret configuration; those will be listed as residual operational checks rather than inferred from application code. No destructive, state-changing, or external posting action is included in this plan.
