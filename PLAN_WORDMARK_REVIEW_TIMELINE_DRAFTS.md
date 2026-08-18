# ESUT Marketplace Seller Experience Enhancements

## Goal

Improve the seller onboarding experience with three coordinated changes: a branded ESUT Marketplace wordmark in the seller hero, a visual review-status timeline for applicants, and safe draft persistence for seller verification and store-application forms. This plan is for review only; no application code, database, browser state, or external state will be changed until approval.

## Current context

The seller onboarding page already uses the ESUT red, green, gold, and deep-navy palette; it has a trust hero, a journey rail, verification and store-application forms, an FAQ, real seller onboarding queries, administrator review gates, in-app notifications, and one-account dual-role behavior. The implementation must preserve those contracts and must not create a second seller role, bypass administrator approval, or fabricate progress.

## 1. Branded ESUT Marketplace wordmark

The hero should gain a compact, recognizable brand lockup above or beside the seller-safety label. The preferred implementation is the existing managed ESUT Marketplace logo/mark plus a text wordmark rendered in application typography, rather than generating a new text-bearing image. This keeps the name crisp, accessible, responsive, and easy to update.

The lockup should use the supplied ESUT mark, the exact text “ESUT Marketplace,” and an optional short descriptor such as “Campus commerce, verified.” It should work on the deep-navy hero background, have sufficient contrast, include meaningful alt text, and avoid competing with the main “Open a verified campus store” headline. On mobile it should remain compact and should not force the hero into an unnecessarily tall block.

## 2. Visual review-status timeline

The current journey rail should be expanded from a simple completion checklist into a clear status timeline based only on real records. The timeline should represent the actual sequence:

| Stage | Source of truth | Possible visible states |
|---|---|---|
| Seller verification submitted | `seller.onboarding.verification` | Not started, pending review, action required/rejected, approved |
| Verification reviewed | Verification status and administrator note | Waiting, revision required, approved |
| Store application submitted | `seller.onboarding.application` | Locked, not started, pending review, action required/rejected, approved |
| Store activated | Existing store status / seller access | Locked, pending, active |

The server should expose a normalized, role-scoped timeline projection or extend the existing onboarding projection. The projection must be derived from the authenticated user’s profile, verification request, seller application, store, listing, and notification records. It should include stable keys, labels, state, optional review note, safe timestamps where already available, and a recommended next action. Review notes must be visible only to the owning applicant and authorized administrators.

The frontend should show a connected vertical timeline on desktop and a compact stacked timeline on mobile. Each step needs an icon, state badge, short explanation, and a direct action when available, such as “Submit verification,” “Review feedback,” “Complete store application,” or “Open store settings.” Pending states should clearly say that administrator review is required without promising a processing deadline. Approved states should feel complete but should not imply listing or selling access until the relevant store gate is active.

## 3. Draft persistence for seller forms

Draft persistence should be implemented client-side first because the forms already contain sensitive identity and business information, including evidence-file data. Plaintext identity documents should not be written to local storage. The draft system should persist only non-sensitive text fields and seller-type intent by default, with a clear “Saved locally” timestamp and a “Clear draft” control.

Recommended persisted fields:

| Form | Safe draft fields | Must not persist locally |
|---|---|---|
| Verification | Seller type, ESUT email, registration number, business name, business registration number | Evidence file bytes, data URLs, identity documents |
| Store application | Store name, phone, primary location, description | Server approval state, session data, uploaded files |

The draft key should be scoped to the current authenticated account, for example `esut:seller-onboarding-draft:<userId>`, and should not be used for guests unless an explicit anonymous-draft policy is approved. Draft hydration should happen after authentication state is known and should never overwrite fields the user has already edited in the current session. On successful submission, the relevant draft should be cleared. If the user signs out, changes account, or receives a server-side rejection, the UI should avoid showing another account’s draft and should offer an explicit discard action.

A small storage adapter or hook should handle JSON parsing failures, schema versioning, expiration, and storage quota errors gracefully. The feature should be treated as convenience recovery, not as a source of truth. Server records always win when a submission already exists.

## 4. Implementation phases

### Phase A — Audit and contracts

Inspect the existing logo asset path, seller onboarding query shape, verification/application statuses, review-note fields, store status, and current seller route actions. Confirm the existing form field names and identify the safest reusable projection shape. No schema migration should be introduced unless the current records lack a field required for an already-supported state.

### Phase B — Server projection

Extend or normalize the protected seller onboarding response with a timeline array. Enforce the authenticated seller’s ownership at the procedure boundary. Return only safe applicant-facing fields. Keep administrator-only details out of the applicant projection except for the existing applicant-facing review note. Add procedure tests for each state and for cross-user access rejection.

### Phase C — Hero identity and timeline UI

Add the existing ESUT logo/mark and application-rendered wordmark to the hero. Replace or enhance the current journey rail with the normalized review timeline. Use semantic status badges, visible text equivalents for color, keyboard-reachable action links, and mobile-first layout rules. Preserve the existing verification and store forms and their mutation behavior.

### Phase D — Draft persistence

Add a typed versioned local-draft hook. Hydrate only after the authenticated user is identified, debounce writes, expose saved/unsaved feedback, clear drafts after successful mutation, and provide a visible clear-draft action. Exclude file input state and evidence data URLs. Test reload recovery, account scoping, malformed data, successful-submit clearing, and storage failure handling.

### Phase E — Validation and rollout

Run TypeScript validation, all unit/procedure tests, and Chromium regression tests. Review the seller page at desktop and 375px mobile widths. Verify guest access, pending verification, rejected/action-required verification, approved verification, pending store application, approved store, and active seller states. Confirm that the wordmark has accessible alternative text, the timeline does not expose unauthorized notes, and no sensitive evidence bytes appear in browser storage. Save a checkpoint only after the full review passes.

## Acceptance criteria

The hero has a crisp ESUT Marketplace identity treatment that remains readable on desktop and mobile. An applicant can understand exactly where they are in the review process, why a step is pending or requires action, and what action is available next. Leaving and returning to the page restores safe text-form drafts for the same signed-in account without storing identity evidence. Successful submission clears the relevant draft. Existing server authorization, seller gates, dual-role buying, notifications, and administrator review behavior remain unchanged.

## Risks and decisions

The main security risk is accidental persistence of identity evidence; the design explicitly excludes files and data URLs. The main consistency risk is treating client draft state as authoritative; the design explicitly makes server state authoritative. The main UX risk is overloading the hero with identity and status content; the wordmark is therefore compact and the timeline remains the primary operational component. A QR pickup flow, administrator bypass, escrow, settlement automation, and other deferred roadmap ideas are outside this change.

## Open questions for approval

The implementation can proceed with the existing managed ESUT logo asset and application-rendered “ESUT Marketplace” text. If the user wants a new logo mark or a different exact descriptor, that should be decided before implementation; otherwise the existing brand asset and exact marketplace name will be used.
