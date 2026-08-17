# Audit Evidence Notes

## Public storefront

The live preview exposes a branded ESUT Marketplace storefront with search, category navigation, product discovery, verified-seller cards, campus-pickup messaging, seller onboarding CTA, and active listing data. Categories include Electronics, Fashion, Phones & Accessories, Books, Hostel & Lodge, Food & Groceries, Services, and Computing. The homepage states that the marketplace uses campus pickup, verified sellers, protected checkout, and cash on pickup. Active seed/live records were visible for ESUT Tech Hub, Campus Living, Study Corner, Sprinkled Fantasy, esut Myshop, and Aluta Shop Tech.

## Buyer account preview

The connected browser opened `/account` with an authenticated buyer workspace. The page shows real projections: 0 orders to collect, 0 active orders, 1 saved listing, and 1 unread update. It includes recent orders, cart/pickup-details/saved-listings/message-sellers quick actions, recent notifications, buyer pickup rules, profile/security access, and a seller-workspace link. The observed notification was “Seller application approved,” indicating the signed-in account also has an approved seller relationship. No active purchase or ready-for-pickup order was available for this account, so the buyer pickup-code handoff could not be exercised through a real order in this session.

## Seller workspace preview

The connected browser opened `/seller` as an authenticated verified seller. The persistent navy workspace navigation exposes Overview, Products, Orders, Inventory, Offers, Messages, Reviews, Analytics, and Store settings. The cockpit clearly scopes metrics to the seller’s store and showed honest zero states: ₦0 completed sales, 0 orders to action, 0 active listings, 0 stock attention, 0 orders in the last seven days, 0% completion, and 0 buyer interest. Quick actions cover products, order processing, stock, and offers. This account did not have an active listing or order, so real seller order transitions and pickup confirmation could not be executed in the session.

## Administrator workspace preview

The connected browser opened `/admin` as an authenticated administrator. The dashboard exposed Logout, pending verification and store-application counts, safety reports, active disputes, active listings, seven-day orders and sales, new members, active sellers, low-stock listings, a seven-day activity chart, safety reports, disputes, audit trail, seller verification review, and store application review. Observed live values included 6 active listings, 2 orders in the last 7 days, 8 new members in the last 7 days, 6 active sellers, and zero pending verifications, applications, safety reports, disputes, completed sales, ready-for-pickup orders, and low-stock listings. Evidence links and approval states were visible for approved individual and business seller records. The admin preview did not exercise destructive approvals, order transitions, evidence uploads, or settlement actions.
