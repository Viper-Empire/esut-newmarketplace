# ESUT Marketplace Theme and Navigation Recovery Plan

## Goal

Add a consistent **Light / System / Dark** appearance preference across the public storefront, buyer workspace, seller workspace, administrator workspace, store/shop pages, authentication, checkout, and order flows. At the same time, audit and repair pages that can leave users stranded because of missing escape routes, loading loops, stale protected boundaries, unavailable back actions, or errors without recovery controls.

This work is planning-only until approved. It must preserve the ESUT visual identity, dual-role account model, server authorization, real-data behavior, and existing marketplace workflows.

## Current problem framing

The project already has a theme context and extensive workspace styling, but theme behavior should be verified across every route rather than assumed to be consistent. Dark mode must not make ESUT red, green, gold, cards, forms, badges, tables, or verification states unreadable. Workspace navigation must remain distinct from public storefront navigation, while both should offer a reliable way back to a safe destination.

The “stuck pages” audit will treat a page as incomplete when a user cannot understand its current state, cannot recover from a failed request, cannot return to a parent route, or is held in loading indefinitely. Protected pages must distinguish unauthenticated access, unauthorized role access, empty data, server failure, and successful content.

## Phase 1: Audit theme and route architecture

1. Inspect `ThemeContext`, `App.tsx`, `index.css`, shared navigation components, workspace shell, dashboard layouts, auth pages, checkout, order pages, seller/store pages, administrator pages, and error boundaries.
2. Build a route matrix covering public, buyer, seller, moderator, administrator, auth, checkout, order, store, and settings routes. For each route, record its shell, theme-sensitive surfaces, loading state, empty state, error recovery, back/escape route, and role boundary.
3. Identify hard-coded light-only colors, inherited text colors, icons without contrast, form controls with invisible borders, charts that assume a light background, and components that bypass semantic theme tokens.
4. Identify navigation dead ends, including nested route pages without parent links, redirects that can loop, failed protected queries without retry, loading states without timeout/recovery, and route-level errors without a safe destination.

## Phase 2: Define theme behavior and design tokens

1. Keep three explicit preferences: `light`, `system`, and `dark`. The stored preference is not the resolved theme; `system` follows the browser’s `prefers-color-scheme` media query.
2. Persist the preference locally for guests and, where the existing account-settings architecture supports it, synchronize it with the signed-in user’s settings without making theme selection depend on a database request.
3. Apply the theme before the first meaningful paint where possible to minimize flash-of-wrong-theme. If storage or media-query access fails, fall back safely to light mode.
4. Extend semantic CSS variables for page background, foreground, card, muted surface, border, input, popover, focus ring, primary action, destructive action, success, warning, and chart colors. Keep ESUT red, green, and gold as intentional accents with dark-mode-safe contrast variants.
5. Preserve the deep-navy workspace sidebar as a branded surface, but define readable light/dark content and hover states inside it rather than allowing global theme rules to create low contrast.
6. Define component rules for cards, tables, badges, buttons, inputs, selects, dialogs, drawers, tabs, progress bars, charts, empty states, and alert states. No page should rely on unpaired semantic backgrounds and inherited text.

## Phase 3: Add the theme selector

1. Place a reusable theme selector in the account/settings surface and authenticated workspace utility area. Public pages may expose it in the footer or mobile navigation if that matches the existing storefront structure.
2. Use an accessible select or segmented control with visible labels: **Light**, **System**, and **Dark**. Provide a clear current-value label and keyboard focus state.
3. Apply changes immediately without page reload, update the document theme attribute/class, and subscribe to system-theme changes while `System` is selected.
4. Ensure logout, route changes, and switching between buyer and seller tools do not reset the preference.
5. Add a reduced-motion-safe transition policy; theme changes should avoid distracting page-wide animations.

## Phase 4: Repair navigation and stuck-page states

1. Add consistent parent/back navigation to detail pages such as product, order, seller order, store, listing, settings subpages, verification, and administrator drill-down pages.
2. Give each protected route a clear recovery boundary: sign-in action for guests, dashboard/home action for wrong-role access, retry action for retrieval failure, and a meaningful empty state when no records exist.
3. Review every query-driven page for loading states that can remain indefinite. Use component-level skeletons or bounded loading feedback and make retry/refetch available for retrieval errors.
4. Ensure mutation failures preserve user-entered form state and provide a recovery action. Successful mutations should show a status message and a reliable route to the resulting record or workspace.
5. Audit Wouter route transitions and browser back behavior for accidental loops. Preserve intended query/search/filter state when returning from detail pages where practical.
6. Verify mobile navigation drawers and desktop sidebars close or remain usable after route changes. Ensure no fixed preview/debug banners obscure critical actions in intended production presentation.
7. Improve the global not-found and error boundary with safe links to marketplace home, buyer account, seller workspace, or administrator home according to the current role when available.

## Phase 5: Security and accessibility safeguards

1. Theme selection must be presentation-only and must not alter server authorization, roles, seller verification, order ownership, or checkout policy.
2. Never expose private route content as a fallback when a protected query fails. Recovery links must still respect authorization boundaries.
3. Test keyboard navigation for theme controls, sidebars, drawers, dialogs, forms, tables, retry buttons, and back links.
4. Test contrast for normal text, small text, disabled states, focus rings, status badges, error messages, red/green/gold accents, and dark workspace surfaces.
5. Add `aria-label`, `aria-current`, `aria-live`, and progress semantics where needed. Avoid relying on color alone to communicate status.
6. Verify theme preference does not store sensitive account data and that malformed local preference values safely fall back.

## Phase 6: Validation strategy

### Automated checks

Run `pnpm check`, `pnpm test`, and `pnpm test:e2e`. Add focused tests for theme preference resolution, system-theme changes, malformed preference recovery, persistence across route changes, and protected-route recovery. Add browser scenarios for theme switching, mobile navigation, back/escape routes, loading/error recovery, and public/protected route boundaries.

### Visual checks

Review the public storefront, product detail, catalogue, auth, checkout, buyer account, seller onboarding, seller cockpit, seller settings, order detail, administrator overview, analytics drill-down, and store/shop pages in all three theme modes at desktop and 375px mobile widths. Confirm no clipping, invisible text, unusable controls, or navigation dead ends.

### Regression checks

Confirm checkout remains campus-pickup/cash-on-pickup only, seller verification remains approval-gated, buyer/seller dual-role navigation remains intact, administrator routes remain protected, and existing order/pickup-code workflows remain unchanged.

## Deliverables

The implementation should produce a reusable theme preference control, coherent semantic theme tokens, route-level navigation/recovery improvements, automated and browser coverage, and a validation record documenting routes reviewed, theme modes tested, known limitations, and any intentionally deferred visual work.

## Assumptions and risks

The existing theme context is assumed to be the correct extension point unless inspection shows that a smaller shared provider change is safer. Theme preference persistence should remain client-side unless the existing settings contract already supports a non-sensitive user preference. Any database migration for theme settings should be avoided unless it is clearly required.

The most important risk is dark-mode contrast drift caused by page-specific hard-coded colors. The second risk is introducing generic back links that conflict with existing role-aware navigation. Both risks will be handled through route-by-route review and regression testing rather than a global CSS-only change.

The deferred applicant resubmission-history and administrator actor-attribution work remains separate and must not be mixed into this theme/navigation scope.
