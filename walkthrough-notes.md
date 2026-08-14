# Live Preview Walkthrough Notes

The ESUT Marketplace home route loaded in the connected browser with the ESUT red/green hero, announcement bar, search, category navigation, fresh-arrival cards, trust panel, seller recruitment banner, and footer visible.

The `/explore` route loaded successfully with database-backed listing cards, keyword search control, sorting control, and verified-seller filter visible. Seeded listings and their prices, conditions, and locations rendered from the marketplace database.

The product-detail route for Wireless Study Headphones loaded with price, legitimate compare-at price, stock state, quantity control, favorite action, add-to-cart action, offer entry point, and verified seller information. The current authenticated cart rendered its intentional empty state with a return-to-discovery action; no cart item or order was created during this walkthrough.

The authenticated seller workspace loaded with real zero-value metrics and a clear no-orders state. The authenticated administrator workspace loaded with database-backed seller-application metrics and an empty review queue. The administrator notification settings panel was verified separately with Resend provider controls, future provider stubs, event preferences, and a template preview.

During the authentication walkthrough, the signed-in account loaded the seller workspace with its protected operations metrics. The Login route correctly detected the active session and displayed an already-signed-in state rather than presenting a second login form. The unauthenticated Login and Create Account designs are implemented at `/login` and `/register`; a separate signed-out browser session is required to view their entry buttons directly.

The seller onboarding route presents the protected seller-application explanation and only renders a submit-ready form for an authenticated account. The live administrator review page shows the pending and approved application counts plus the review queue. It is currently empty, so no application was submitted, approved, or rejected during the walkthrough.

The home page navigation exposes marketplace search, category links, cart, account access, and the seller application route. The authenticated checkout route correctly shows its empty-cart state when no cart lines exist, rather than attempting to create an incomplete order.

The branded first-party Login and Create Account pages were verified in the live browser. They render ESUT Marketplace’s own forms rather than opening the external Manus account portal. Login presents email, password visibility, forgot-password, and account-creation routes. Registration presents first name, last name, email, phone number, password, terms notice, and an email-verification notice.

The preview remains in development preview mode and is not yet publicly published.
