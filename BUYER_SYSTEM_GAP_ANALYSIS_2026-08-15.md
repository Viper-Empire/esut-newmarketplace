# ESUT Marketplace Buyer-System Gap Analysis

**Review status:** Initial comparison completed before changing buyer functionality.  
**Sources compared:** The supplied buyer-system brief, the current Buyer Operations Report, and the existing buyer-facing code.

> **Conclusion.** The core buyer commerce loop is already implemented with real database data and server-side safeguards. It should not be rebuilt. The worthwhile work is a narrow set of product-polish and experience-completeness improvements, plus the already-tracked continuous end-to-end assurance work. [1] [2] [3]

| Requirement area | Current implementation | Verified gap or constraint | Targeted response |
| --- | --- | --- | --- |
| Discovery | Real homepage, catalogue, filtering, pagination, product and store pages are present. | No evidence yet of search autocomplete, recent/popular search history, or store/category suggestions from the global search surface. | Inspect the search contract; add only capabilities supported by efficient real queries. |
| Product page | Gallery, quantity, stock-aware cart, favorites, offers, messaging, reports, seller context, and pickup policy are present. | Product specifications, review summary, share action, and an explicit Buy Now action are not currently shown. | Verify data availability; add only data-backed/product-safe elements. |
| Cart and checkout | Guest/account carts, safe merge, saved items, seller grouping, server totals, idempotent checkout, reservations, and cash-on-pickup are present. | The buyer-facing cart has no clear-cart action or direct quantity entry; checkout is compact rather than a multi-step review. | Preserve safe transaction flow; evaluate small usability additions without duplicating checkout. |
| Orders | Private order list/detail, state history, cancellation while pending, and dispute opening are present. | Order list/detail can expose richer buyer action context such as payment state, seller contact, and review eligibility. | Inspect the existing order/account contracts before adding only missing contextual links. |
| Buyer communications | Participant-only messaging, offers, reviews, notifications, reports, and disputes are implemented. | Unread messaging/notification affordances and offer counteroffer actions require contract-level verification. | Audit the existing client/server procedures before deciding whether a targeted addition is necessary. |
| Account and navigation | Protected buyer account dashboard, profile, favorites, offers, messages, notifications, reviews, support, security settings, and logout are present. | Global buyer navigation and loading/error feedback need a focused audit for missing shortcuts and recovery states. | Inspect shared storefront components and buyer pages; improve only verified omissions. |
| Authentication and email | Registration, login, logout, account lockout, secure password change, and guarded recovery flows exist. | Ordinary-recipient reset and verification email delivery remains intentionally deferred pending an approved sender domain/provider. | Keep the safe paused configuration; do not re-enable or fake delivery. |
| Security and quality | Server-side ownership checks, validation, reservations, state transitions, private evidence, transport guard, and 50 automated tests exist. | Broader continuous browser-level authorization, tampering, upload, concurrency, responsive, and accessibility coverage remains an explicit open checklist item. | Add focused regression coverage for any new buyer changes and retain the larger assurance item. |

## Confirmed Non-Gaps

The following requested buyer capabilities already exist and will not be rebuilt: real-data browsing; guest browsing; protected buyer accounts; favorites; cart persistence; multi-seller grouping; server-calculated cash-on-pickup checkout; idempotent order creation; inventory reservation; private orders; seller messaging; offers; safety reports; disputes; completed-order reviews; administrator integration; and server-side authorization. [1] [2] [3]

## Implementation Rule

No buyer feature will be rebuilt merely to resemble another marketplace. Any follow-on work must pass three checks: it must use real data, preserve the cash-on-pickup policy, and enforce ownership and business rules on the server. [1] [2]

## References

[1]: ./ESUT_MARKETPLACE_BUYER_OPERATIONS_REPORT_2026-08-15.md "Current buyer journey and operational safeguards"
[2]: ./server/routers.ts "Buyer procedures, checkout validation, ownership rules, and order lifecycle"
[3]: ./client/src/pages/CartPage.tsx "Buyer cart and guest-cart behavior"
