# Resumed validation notes

## Public flows checked

The live public homepage rendered normally with the ESUT Marketplace header, search entry point, category navigation, real listing sections, verified stores, campus-pickup messaging, and seller entry points. No HTML-as-JSON parsing error was observed.

The live `/explore` catalogue rendered normally with real listing results, search, sort, condition, price, verified-seller filtering, and pagination controls. No HTML-as-JSON parsing error was observed.

These checks cover representative public discovery and catalogue flows only. Authenticated-flow checks remain to be performed where the connected session permits them.

## Authenticated flows checked

The connected authenticated session rendered `/account` normally as a CUSTOMER account with protected buyer navigation, including cart, orders, favorites, offers, messages, notifications, reviews, seller application, and logout. No HTML-as-JSON parsing error was observed.

The same session rendered `/account/messages` normally with an explicit empty conversation state and no response-parsing error. The new contextual conversation projection remains ready for accounts with actual participant-authorized conversations; this test account currently has no conversations.

## Responsive authenticated check

The authenticated account dashboard was captured at a 375×812 mobile viewport. The account header, role indicator, logout control, and stacked cart, orders, and favorites navigation cards remain legible and accessible in the mobile layout. No runtime or response-parsing error was observed during the check.

## Guarded transport source audit

A source audit found no direct `fetch`, `httpBatchLink`, or alternate tRPC client construction in client page or component sources. Marketplace data flows use the shared tRPC client path configured through `createMarketplaceApiFetch`; the remaining fetch references are in the transport wrapper and its regression tests. The broad response-safety checklist remains open because the original development-server disconnect failure has not been reproduced end to end.

## Protected route checks

The guessed `/seller/dashboard` path correctly returned the application’s normal 404 route because it is not a registered route; no JSON parser was invoked and no HTML-as-JSON error occurred.

The registered `/seller` route rendered the authenticated customer’s server-backed seller approval gate with a link to the seller application. This confirms a protected seller path returns a clear application state rather than a response-parsing failure.

## Additional protected-route and log checks

The registered `/seller` path returned a clear seller-approval gate for the authenticated CUSTOMER session. The `/moderator` path returned a clear moderator-access boundary stating that safety controls are limited to assigned moderator and administrator roles. Neither route produced an HTML-as-JSON parsing error.

The recent browser console `BadRequestError: request aborted` appeared alongside normal Vite reconnect/debug messages and did not correspond to a server TypeScript error or a rendered response-parsing failure. It is recorded as a benign request/navigation abort pending reproduction of the original development-server disconnect.

## Critical protected-route checks

The connected CUSTOMER session received clear, role-specific boundaries from both `/moderator` and `/admin`: moderator safety controls are limited to assigned moderator and administrator roles, and administrator oversight is protected by server-side role checks. Neither route produced an HTML-as-JSON parsing failure.

The representative route set now covers public homepage and catalogue, authenticated account and messages, seller approval gate, moderator boundary, administrator boundary, and responsive mobile account rendering. The original development-server disconnect has not been intentionally reproduced.

