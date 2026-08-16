# ESUT Marketplace Seller and Buyer Dashboard Redesign Plan

## Goal

Redesign the **seller and buyer workspaces** into structured, campus-native operational dashboards inspired by the supplied ecommerce references. The redesign will retain the current real-data marketplace workflows, role guards, server-side ownership checks, campus-pickup-only fulfilment model, and cash-on-pickup policy. It will not introduce fabricated sales, orders, reviews, customers, payouts, or charts.

> **Design intent:** make each dashboard feel like a focused workbench rather than a collection of unrelated account pages. Sellers should see what needs action to keep their store operating; buyers should see what needs action to complete or manage their campus purchases.

## Reference Analysis

The three supplied references consistently use a high-clarity dashboard pattern: a persistent left navigation rail, a calm top utility bar, a page-level heading, a short row of KPI cards, and two or three prioritized operational panels beneath. The design is effective because it prevents the user from scanning a large, unstructured page for the next task.

| Reference pattern | Why it works | ESUT Marketplace adaptation |
|---|---|---|
| **Persistent side navigation** | Keeps product areas visible and establishes a stable hierarchy. | A desktop sidebar with role-specific navigation; a compact mobile drawer/bottom action bar for essential destinations. |
| **One strong workspace heading** | Orients the user immediately and gives the page a clear purpose. | Use a contextual greeting and store/account name, such as “Good morning, ESUT Tech Hub” or “Your campus shopping”. |
| **Four concise KPI cards** | Surfaces health signals before deep detail. | Display only real metrics: sales, orders requiring action, active listings, stock warnings, saved items, pickup orders, unread messages, or offers. |
| **Recent activity list** | Lets users understand the latest operational changes quickly. | Seller: orders, offers, low-stock changes, reviews, messages. Buyer: pickup status, offers, order updates, saved-item price/stock notices. |
| **Quick actions panel** | Converts insight into an immediate next action. | Seller: Add listing, process ready pickups, update stock, manage offers. Buyer: Continue checkout, view pickup instructions, message seller, browse saved listings. |
| **Charts and top-product modules** | Provide an at-a-glance performance view without replacing operational tasks. | Use server-derived seven-day activity and top-listing data. Render an honest no-activity state rather than invented trends. |
| **Clean cards and generous spacing** | Improves scanability and reduces cognitive load. | Use soft off-white canvas, white cards, restrained shadows, clear borders, and an ESUT-specific color hierarchy. |

## Design System Decisions

The visual direction will preserve ESUT’s existing identity while applying the reference information architecture.

| Element | Decision |
|---|---|
| **Primary identity** | ESUT green for safe/verified/positive states and navigation emphasis. |
| **Structural contrast** | Deep campus-navy sidebar, inspired by the strongest supplied seller reference, to separate workspace navigation from content. |
| **Commerce urgency** | ESUT red for destructive actions, urgent action counts, and buyer-facing price/action emphasis—not as a general dashboard color. |
| **Premium/attention accent** | Gold only for review quality, select deal emphasis, and carefully limited notice states. |
| **Typography** | Strong, compact page headings; restrained uppercase section labels; readable compact operational text. |
| **Motion and feedback** | Short opacity/transform transitions for cards, drawers, charts, and action confirmations; reduced-motion support throughout. |
| **Accessibility** | Keyboard-visible focus, semantic navigation, named icon buttons, responsive touch targets, contrast-safe status tokens, and screen-reader labels for metrics/charts. |

## Seller Workspace Plan

### 1. Establish a Unified Seller Shell

Replace disconnected seller page headers with a single role-aware layout containing the store identity, verification state, route-aware navigation, notifications, account menu, and mobile navigation. The desktop sidebar will include **Overview, Products, Orders, Inventory, Offers, Messages, Reviews, Analytics, Store settings**, with only routes that already exist or are implemented in the same approved phase.

The shell will display the verified seller state accurately. Unverified or pending sellers will keep the existing secure onboarding gate and will not receive misleading operational metric cards.

### 2. Rebuild the Seller Overview as an Operations Cockpit

The seller overview will begin with a greeting/store identity and a four-card summary using server-authoritative values:

| Seller KPI | Real data source / rule |
|---|---|
| **Completed sales** | Completed seller-owned order totals for the selected seven-day or current-period window. |
| **Orders to action** | Seller-owned pending/confirmed/ready-for-pickup orders, labelled by the actual next transition. |
| **Active listings** | Published listings owned by the current seller’s store. |
| **Stock attention** | Listings with real low or out-of-stock inventory; a zero state will be shown honestly. |

Below the KPI row, the dashboard will pair **Recent store activity** with **Quick actions**. Recent activity will use real order status changes, offers, buyer messages, reviews, and stock conditions. Quick actions will route to existing authenticated workflows rather than simulate payout, fulfilment, or customer actions.

### 3. Organize Seller Analytics and Performance

Use the existing server-authoritative seller analytics as the data contract, then present it in a clearer hierarchy:

1. A seven-day sales/order activity chart with an explicit date range and accessible text summary.
2. A top-performing listings panel driven by completed sales, views, favorites, offers, and inventory—only metrics already returned by the server.
3. Fulfilment and stock panels distinguishing orders ready for pickup, low stock, and out-of-stock items.
4. A transparent no-activity state when the seller has no completed orders or engagement data.

No payout metric will be presented unless the marketplace has a genuine payout process and server-owned payout data. The current cash-on-pickup model will remain clearly communicated.

### 4. Standardize Seller Operational Pages

Products, orders, inventory, offers, messages, reviews, analytics, and store settings will use consistent page headers, filters, tables/cards, status badges, empty states, retry controls, and route escape paths. Existing ownership checks and mutations will remain unchanged. The redesign will make operational priority visible without widening seller authority.

## Buyer Workspace Plan

### 1. Establish a Buyer Account Shell

Create a companion buyer shell with the same structural quality but buyer-specific information architecture. The desktop sidebar will use **Overview, My orders, Saved listings, Offers, Messages, Notifications, Profile & security**. On mobile, the account overview will prioritize Orders, Cart, Messages, and Account through an accessible compact navigation pattern.

### 2. Rebuild Buyer Overview Around Purchase Progress

The buyer overview will not resemble a seller sales dashboard. It will be a purchase-management cockpit with real, useful status cards:

| Buyer KPI | Real data source / rule |
|---|---|
| **Orders to collect** | Buyer-owned orders genuinely in ready-for-pickup status. |
| **Active orders** | Buyer-owned orders still progressing through the approved lifecycle. |
| **Saved listings** | Current buyer-owned favorites count. |
| **Unread updates** | Current buyer-owned unread notifications and/or message count, without exposing other participants’ data. |

The body will show a pickup-focused recent activity timeline, active order cards with status and safe collection guidance, a small saved-items section, and quick actions such as **Review pickup details**, **Message seller**, **Browse saved listings**, and **Continue checkout** only when the underlying data permits them.

### 3. Improve Buyer Operational Pages

Orders, favorites, offers, messages, notifications, profile, and security settings will adopt consistent visual hierarchy and recoverable states. Order pages will prioritize pickup status and the correct next step; saved listings will emphasize real price/availability; messages will retain participant-only data access; profile/security pages will preserve existing password safeguards.

## Data and Authorization Requirements

All dashboard cards, tables, timelines, charts, and action counts will come from existing or new **server-authorized procedures**. The implementation will extend current analytics procedures only where necessary, enforce seller/store ownership for seller data and buyer ownership for buyer data, and return minimized projections.

| Requirement | Implementation rule |
|---|---|
| No fabricated performance | Empty metrics render as zero, no activity, or a scoped empty state. |
| Ownership | Seller metrics are limited to the authenticated seller’s current store; buyer metrics are limited to the authenticated buyer. |
| Role boundaries | Seller, buyer, moderator, and administrator routes remain guarded on the server. |
| Fulfilment accuracy | Display campus pickup and cash-on-pickup states exactly as supported by the existing order lifecycle. |
| Privacy | Never surface buyer names, contact fields, private addresses, or other non-essential account information in aggregated dashboard data. |
| Accessibility | Charts need text alternatives; status and trends cannot rely on color alone. |

## Delivery Phases

### Phase 1 — Audit and Information Architecture

Inspect the current seller dashboard, seller analytics, buyer account pages, shared dashboard shell, routes, and tRPC contracts. Inventory which metrics already exist, which must be added server-side, and which reference-inspired elements should be excluded because the marketplace has no real data for them.

### Phase 2 — Shared Workspace Foundation

Create or extend a role-aware dashboard shell, desktop sidebar, utility header, responsive mobile navigation, standardized KPI card component, operational panel component, and accessible empty/loading/retry states. Apply ESUT navy/green/red/gold design tokens without changing marketplace workflows.

### Phase 3 — Seller Operations Redesign

Implement the seller overview cockpit, real KPI cards, recent activity, quick actions, chart/summary panels, and consistent seller operational-page headers. Add narrowly scoped server metrics only where the current contract lacks a real, authorized value.

### Phase 4 — Buyer Operations Redesign

Implement the buyer overview cockpit and align buyer order, saved listing, offer, message, notification, and profile pages with the shared dashboard system. Preserve all existing buyer ownership checks, secure password-change flow, and cart/checkout rules.

### Phase 5 — Validation and Hardening

Add or update unit/procedure tests for data ownership and metric calculations; add browser tests for seller and buyer navigation, empty states, responsive behavior, and route boundaries; visually inspect desktop and 375px mobile layouts. Validate type checking and full regression suites before checkpointing.

## Acceptance Criteria

The redesign is complete when sellers and buyers can immediately identify their next relevant actions, all metrics are derived from real authorized data, the workspace hierarchy is stable across desktop and mobile, the dashboard feels distinctly ESUT rather than generic ecommerce, and no existing server-side ownership, verification, order, pickup, or cash-on-pickup safeguards regress.

## Assumptions and Risks

This plan assumes the current analytics and order data remain the source of truth. The seller reference’s payout and customer modules will not be copied as functional features because the current marketplace uses cash on pickup and does not have a payout ledger. Where activity is absent, intentional empty states will be used. Any brand imagery or promotional artwork beyond layout and UI tokens will require separate approval and asset selection.
