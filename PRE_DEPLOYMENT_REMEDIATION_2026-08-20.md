# ESUT Marketplace — Pre-Deployment Remediation Record

**Prepared:** 20 August 2026  
**Scope:** High-priority code-level findings from `PRE_DEPLOYMENT_AUDIT_2026-08-20.md`. This record does not claim completion of external infrastructure, email-domain, or operational-monitoring work that requires separate credentials and ownership decisions.

## Summary

The remediation release resolves the audit’s immediate code-level performance, asset, catalogue presentation, product-detail scanability, and administrator-action UX issues. It deliberately preserves marketplace records, seller-authored product content, completed-order review rules, and existing server-side authorization boundaries.

| Remediation area | Result | Evidence |
|---|---|---|
| Legacy branding assets | **Resolved** | Login, registration, recovery, header, and footer consume the shared managed 24 KB WebP logo path rather than the legacy 6.1 MB PNG. |
| Initial application load | **Resolved** | Public startup code is now route-split: the entry application chunk is **120.72 KB / 18.18 KB gzip**, with React, data, interface, seller, order, and administration code loaded in separate chunks. |
| Missing listing media | **Resolved at presentation and publication-gate level** | The existing server publication assessment already requires at least one valid image. Seller guidance now explains the primary-photo requirement and public cards use truthful category-aware placeholders when legacy records lack an image. |
| Product detail scanability | **Resolved** | Recognised labelled seller details such as condition, storage, battery health, colour, and connectivity render as readable specification cards; unrecognised description text remains unchanged. |
| Privileged action UX | **Resolved** | Administrator user, store, listing/evidence, report, dispute, and review actions use accessible, required-audit-note dialogs. No browser-native `window.prompt` call remains in the client or server source. |

## Validation Evidence

The complete automated suite passed with **44 test files, 135 tests passed, and 1 intentionally skipped test**. The skipped test remains the opt-in live Redis mutation test and is not a product regression. The TypeScript check passed. The production build passed without a chunk-size warning: the largest shared runtime chunk is **401.21 KB / 118.93 KB gzip**, below the configured 500 KB warning threshold.

Desktop visual review confirmed that product cards now distinguish missing images using available factual category metadata, for example `Campus tech` and `Campus living`, while preserving the explicit `Seller photo unavailable` statement. A real product-detail capture confirmed that seller-entered labels now display as structured scan-friendly attributes rather than a dense text block.

## Remaining Launch Gates

The following work remains deliberately open and should be completed before treating an external Vercel deployment as a high-volume public launch.

| Priority | Gate | Why it remains open |
|---:|---|---|
| P0 | Verify an ESUT-controlled email-sending domain | Normal-recipient account recovery, verification, order, and security email delivery require domain ownership and sender verification outside the codebase. |
| P1 | Production monitoring | Runtime-error, core-web-vital, upload-failure, asset-failure, and operational-alert monitoring require a selected service and operational owner. |
| P2 | Mobile brand wordmark and differentiated discovery shelves | These are design enhancements, not functional blockers; they should be completed after the operational P0/P1 gates. |
| P1 | Private evidence operations and media safety | The platform has protected evidence storage and access controls, but staff case-management views and malware/content-safety scanning remain next-phase operational controls. |

## Deployment Position

The codebase has a materially stronger pre-deployment baseline than the preceding audit. The recommended next step is **not** external traffic cutover. It is to complete the verified ESUT email sender and production monitoring decision, then re-run launch validation before creating the staged Vercel technical preview described in the approved migration plan.
