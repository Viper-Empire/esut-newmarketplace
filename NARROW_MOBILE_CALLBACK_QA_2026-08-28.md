# ESUT Marketplace — OAuth Callback and Narrow-Mobile QA

## OAuth callback diagnosis

The server callback route is already registered at `/api/oauth/callback`. It validates the signed OAuth state and nonce, exchanges the authorization code through the Manus SDK, creates the session cookie, and redirects to `/`. The visible `/?code=...` URL was therefore a misrouted or stale callback landing on the SPA rather than a missing server route.

A defensive client startup cleanup now removes `code`, `state`, provider error parameters, and `iss` from non-callback SPA URLs using `history.replaceState`. This does not redeem codes, create sessions, bypass nonce/state validation, or alter the server callback contract. The current preview browser test opened `/?code=sample-oauth-code` and resolved to the clean preview root URL.

The public deployed URL was observed before checkpointing the new code, so it may continue to show the old behavior until this checkpoint is published. Auto-publish is enabled for the project.

## pasted_content_8 audit

The requirements were compared against the current code and the previous narrow-mobile remediation checkpoint. The shared public header, category navigation, product grid, dialogs, dashboard skeleton, workspace shells, admin drawer, route escape paths, product/store error states, review layout, messaging gates, and light-only styling were already covered by the inherited remediation and regression contracts. No new database, API, authorization, role, category, storage, email, hosting, domain, or business-logic change was justified.

The only verified limitation is that the managed browser session was anonymous during the narrow visual pass. Buyer, seller, messaging, and admin routes were checked in their correct gated/anonymous states at 320px; an authenticated narrow-phone visual capture was not claimed.

## Viewport verification

| Viewport | Checked | Result |
|---|---:|---|
| 320px | Yes | Homepage plus representative explore, product, unknown-store, login, buyer, seller, messaging, and admin states rendered without observed document overflow or clipped essential controls. |
| 360px | Yes | Homepage full-page capture passed visual review. |
| 375px | Yes | Homepage full-page capture passed visual review. |
| 390px | Yes | Homepage full-page capture passed visual review. |
| 768px | Yes | Homepage/tablet composition remained intact. |
| 1280px | Yes | Homepage/desktop composition remained intact. |

## Automated validation

The focused callback contract passed. The full suite passed with **79 test files, 252 tests passed, and 1 skipped**. TypeScript passed with no errors, and the production build completed successfully.

## Deferred scope

Password-recovery delivery/support, custom domain, Vercel migration, PostgreSQL migration, and other infrastructure tracks remain paused as explicitly required. No production records or provider settings were changed in this release.
