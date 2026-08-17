# Plan: Apply the Pickup Safety Recommendations to ESUT Marketplace

## Goal

Assess and, after approval, implement the useful recommendations in `pasted_content_3.txt` so ESUT Marketplace can support faster but secure campus handoffs, controlled recovery when normal pickup-code verification fails, and a carefully scoped post-pickup dispute and settlement process.

This plan is analysis-first. No application code, database schema, external state, or user-facing workflow will be changed until the plan is approved and execution begins.

## Current baseline

The marketplace already has a two-party pickup confirmation foundation. Orders receive encrypted six-digit codes; buyers can view the active code on their own ready-for-pickup order; sellers verify the code through a protected mutation; failed attempts are bounded; direct seller completion without code verification is rejected; successful completion records lifecycle, inventory, payment, history, audit, and notification effects atomically. The project also has buyer/seller order pages, administrator order oversight, disputes, audit logs, and operational flow reports.

The attachment proposes three extensions:

1. A QR representation of the existing six-digit code.
2. A controlled administrator exception workflow for unavailable or failed codes.
3. A configurable post-completion dispute and settlement window.

## Key architectural decisions

### 1. QR pickup option

The QR feature should be an **optional convenience layer**, not a second verification system. The QR must carry a short-lived, signed, order-bound handoff token or an opaque one-time exchange token. It must not expose encrypted database values, reusable secrets, buyer identity, or a permanent URL containing the raw six-digit code.

The seller’s scan flow should resolve to the existing server-side pickup verification contract. The seller must still be authenticated, verified for the owning store, and viewing the correct order. The numeric code remains visible below the QR as a fallback. The QR expires with the order’s active handoff eligibility, becomes unusable after successful completion, and is invalidated after excessive failed attempts.

### 2. Administrator exception review

An administrator override should not be implemented as an unrestricted “force complete” button. It should be a **request-and-review workflow** with explicit reason, participant identity, supporting evidence, and immutable audit records. The default resolution should preserve the same lifecycle and inventory/payment effects as normal completion, but only after the administrator confirms that the evidence and policy requirements are met.

The plan will distinguish what is currently possible from what is not. The current marketplace uses cash on pickup rather than an implemented escrow/payout rail, so “release funds,” automated refunds, GPS capture, and payment-provider settlement must not be presented as existing capabilities. They should be scoped as future integrations or represented as manual administrative outcomes until a real payment/escrow system exists.

### 3. Post-completion dispute window

The attachment’s `COMPLETED_PENDING_SETTLEMENT` and `SETTLED` states are useful only if the marketplace introduces a real settlement or seller payout ledger. Because the current product uses cash on pickup, the first implementation should use a **configurable buyer post-pickup dispute window without fabricating escrow**. A possible first phase is:

- code verification moves the order to `COMPLETED` and records `completedAt`;
- the buyer may open only narrowly defined hidden-defect or fraud disputes until `completedAt + configured window`;
- after the window, new disputes are rejected or require administrator escalation;
- administrators retain an auditable override path;
- a future escrow phase may add `COMPLETED_PENDING_SETTLEMENT` and `SETTLED` once a real payout provider and ledger are approved.

## Implementation phases after approval

### Phase 1: Gap analysis and policy contract

Compare the attachment line by line with the current schema, router procedures, lifecycle helper, order pages, admin pages, dispute logic, audit model, payment policy, and existing reports. Produce a short gap matrix showing: already implemented, safe incremental addition, dependent on a future payment/escrow capability, and rejected as unsafe or unsupported.

Define explicit policy constants and transitions for QR expiry, failed attempts, exception eligibility, dispute categories, dispute-window duration, and administrator permissions. Confirm that all new actions are ownership-safe and that no fabricated location, identity, payment, or settlement records are introduced.

### Phase 2: Optional QR handoff layer

Add a server-side signed short-lived token or one-time QR exchange contract tied to the order and buyer/seller handoff context. Add buyer QR display with strong contrast, visible numeric fallback, expiry/status messaging, and accessible text. Add seller scan or paste handling that submits through the existing confirmation endpoint rather than bypassing it.

Test token expiry, tampering, wrong order, wrong seller, already-completed order, repeated scans, invalid code limits, mobile layout, and manual fallback. If browser camera permissions are not reliable in the current web environment, implement a secure QR payload display plus seller scan/paste entry first and document native camera scanning as a later enhancement.

### Phase 3: Administrator exception workflow

Add a buyer/seller request procedure that records a reason and optional evidence reference, prevents duplicate open requests, and exposes only the relevant order to authorized participants. Add an administrator review queue with order history, participant references, request reason, evidence metadata, and current lifecycle state.

Implement two policy-controlled outcomes:

- **Approve handoff completion:** use the same shared completion effects as verified pickup, with an administrator-specific audit action and a required reason.
- **Reject or cancel under policy:** use the existing cancellation/dispute rules; do not promise an automatic monetary refund while the product remains cash-on-pickup.

Add explicit safeguards against administrator IDOR, self-approval by unauthorized roles, duplicate resolution, completion of cancelled orders, and resolution without a reason. If photo upload is included, store only a secure object reference and metadata, never raw file bytes in the database.

### Phase 4: Configurable post-pickup dispute window

Start with a database-backed or validated server configuration value for the dispute window, with a conservative ESUT launch default documented in the plan and exposed to administrators only if the existing settings model supports it. Add completion timestamps and server-side eligibility checks.

Restrict post-completion disputes to categories such as hidden defect, counterfeit/fraud concern, or material mismatch. Do not allow a post-pickup dispute to claim non-delivery when the two-party handoff has been confirmed. Add clear buyer messaging explaining the deadline and the evidence expected.

Use deterministic server-time checks for expiry. A background job is not required for the first cash-on-pickup phase if eligibility is calculated at request time. If later settlement automation is approved, add a durable scheduled worker using the managed application’s background-job capability, with idempotency, retry safety, dispute cancellation, and audit records. Do not use a browser timer as the source of truth.

### Phase 5: Reports and operational documentation

Update the buyer-seller flow report to explain the optional QR path, numeric fallback, exception request, post-pickup dispute categories, deadlines, and participant responsibilities. Update the seller-administrator report to explain QR verification evidence, exception review, administrator decisions, audit requirements, and the current limitation that cash-on-pickup does not provide automated escrow or payout release.

Add an administrator policy note describing what the system records and what it intentionally does not collect, especially GPS metadata, identity evidence, photo proof, and payment settlement data.

### Phase 6: Validation and checkpoint

Add unit and procedure tests for signing, expiry, tampering, ownership, replay, concurrent completion, failed-attempt limits, exception review, duplicate resolution, dispute-window boundaries, administrator authorization, and cash-on-pickup limitations. Add Chromium coverage for buyer QR visibility, seller verification, protected admin review, mobile fallback, and raw HTML/route safety.

Run:

- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`

Review desktop and 375px mobile states, reconcile `todo.md`, document any bounded evidence gaps, and save a resumable checkpoint only after the complete validation suite passes.

## Architecture options

| Approach | Tradeoffs | Cost | Setup Complexity |
| --- | --- | --- | --- |
| **Incremental web-first safety layer**: QR as a signed convenience token, admin exception queue, and configurable cash-on-pickup dispute window | Fastest path, preserves current architecture, avoids pretending escrow exists; camera scanning and automated settlement remain future work | Lowest; uses current database, server, and audit infrastructure | Moderate |
| **Full settlement workflow**: QR, exception evidence, `COMPLETED_PENDING_SETTLEMENT`, escrow ledger, scheduled settlement worker, automated refunds/payouts | Strongest long-term marketplace controls, but requires a real payment/escrow provider, payout compliance, reconciliation, and background processing | Higher provider and operational cost; payment integration not currently present | High |
| **Minimal QR-only enhancement**: display a QR encoding the existing code and retain manual seller entry | Improves speed with little risk, but does not solve dead phones, failed-code exceptions, or post-pickup dispute policy | Low | Low |

The recommended implementation sequence is to begin with the **incremental web-first safety layer**, then add full settlement only after the business confirms the payment provider, escrow responsibility, refund policy, and regulatory requirements.

## Assumptions and open risks

- ESUT Marketplace continues to support only campus pickup and cash on pickup in the near term.
- No GPS, identity, or handoff photo data will be collected unless the product owner explicitly approves the privacy, storage, retention, and access policy.
- Administrator override is exceptional and auditable, not a normal seller shortcut.
- QR must never weaken the existing seller ownership, code verification, rate limiting, or one-time-consumption guarantees.
- A real `SETTLED` state depends on a future payout/escrow ledger; until then, the product will use a post-completion dispute eligibility window without fabricated fund movement.
- If the user wants immediate implementation, the only material product decision still needed is whether to start with the incremental web-first layer or commit to the full settlement architecture.
