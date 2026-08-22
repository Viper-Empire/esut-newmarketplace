# ESUT Marketplace Authentication Redesign Report

**Date:** 22 August 2026  
**Scope:** Production presentation redesign for login, registration, password recovery, password reset, and email-verification routes. The supplied Figma/Vite ZIP was treated as a visual reference only. Its prototype code, local state, social-provider controls, and sample states were not imported or executed.

## 1. Components reused from the design system

The redesign adopts only transferable visual patterns from the supplied reference: a two-panel desktop composition, a focused single-column mobile layout, restrained brand geometry, strong form hierarchy, high-contrast primary actions, password visibility controls, status panels, intent-card selection, and clear recovery states. The blue reference identity was not retained; all primary interaction colour, support copy, and brand treatment are ESUT Marketplace–specific.

## 2. Components created

The implementation adds `client/src/components/auth/AuthDesign.tsx` and its scoped stylesheet, `client/src/components/auth/auth.css`. The reusable presentation layer includes `AuthLayout`, `AuthBrandPanel`, `AuthHeader`, `AuthInput`, `AuthPasswordInput`, `PasswordStrength`, `AuthStatus`, `AuthSubmitButton`, `RegistrationIntentGroup`, and `AuthFooter`.

| Screen group | Production presentation outcome |
| --- | --- |
| Login and registration | Branded responsive layout, input/error states, password visibility, lockout feedback, and accessible registration intent radios. |
| Recovery | Availability loading/failure states and a truthful paused-delivery boundary. |
| Reset | Password requirements, strength indicator, confirmation validation, invalid/missing-token state, and server-confirmed completion state. |
| Verification | Validating, verified, invalid/expired, and missing-token presentation without unsupported resend claims. |

## 3. Existing authentication preserved

No authentication procedure, password hashing rule, login-throttle rule, cookie implementation, server-issued session behavior, route guard, role permission, or backend input shape was replaced. Login remains connected to `trpc.auth.login`; registration remains connected to `trpc.auth.register`; recovery, reset, and verification remain connected to their existing tRPC procedures.

Authentication success is only presented after the server confirms the mutation. The reset flow now refreshes the real issued session before rendering its success action, rather than displaying a client-only confirmation or relying on a blind redirect.

## 4. Database integration

The current production database remains the existing **MySQL/TiDB-compatible relational database**. No schema, migration, database provider, user-record layout, profile classification field, token table, session store, seller record, or marketplace record was changed for this UI release.

The views continue to operate on the established `users`, `profiles`, password-reset token, email-verification token, active-session, seller application, and store state that is returned or checked by the existing server contracts.

## 5. Security controls preserved

The redesign retains the current server-authoritative security controls. These include strict server validation, password hashing, opaque/expiring reset and verification tokens, generic invalid-credential responses, login throttling, Redis-backed temporary lockout/rate-limit state with durable fallback, server-side session issuance, protected route checks, and isolated administrator authorization.

The UI does not reveal whether a recovery email belongs to an account. It has no fake Google or Apple provider actions, no administrator registration option, no client-granted seller permission, and no new token, credential, storage, or session handling code.

## 6. Seller onboarding integration

Registration now presents **A Buyer**, **An Individual Seller**, and **A Business Vendor** as explicit, native radio-card intents. The surrounding copy states that every account can shop and that choosing a seller-oriented intent does not grant seller access.

Existing seller discovery and onboarding remain unchanged: users must still authenticate, complete the relevant verification and seller/store application stages, receive administrator approval, and have an active store before server-side seller authority is available. The existing `/sell` journey remains the application/status destination.

## 7. Buyer/seller dual-role behavior

The release preserves the one-account model. A verified seller continues to use the buyer-facing cart, saved items, orders, messages, notifications, and account controls from the same authenticated session while accessing the seller workspace only through the existing approval and store gates. No separate seller login, duplicate account type, or new role was created.

## 8. Mobile improvements

At 620px and below, the decorative desktop brand panel is intentionally removed and the current managed ESUT brand identity appears above a single-column form. Registration intent cards become full-width, touch-friendly options; two-column name fields stack; action buttons keep a 54px minimum height; recovery and token-boundary actions remain centred and usable without horizontal overflow.

Final 375px captures reviewed `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/verify-email`. The review found no clipped controls, no blue reference branding, no fake social buttons, and clear password-recovery availability messaging.

## 9. Accessibility improvements

All presented form controls use labels, password inputs expose individual labelled show/hide controls, form feedback is rendered as structured status content, and the registration choices are native radio inputs grouped under the accessible `I am registering as` legend. Focus-visible styling is retained for inputs and radio cards. Primary actions and touch targets meet the 54px target height, contrast remains high against white/green surfaces, and non-essential motion is reduced for users with `prefers-reduced-motion`.

## 10. Tests executed

| Command or check | Coverage purpose |
| --- | --- |
| `pnpm check` | TypeScript contract and unused-code validation. |
| `pnpm test` | Full unit/procedure suite, including the new auth redesign contract, paused-email contracts, session, token, Redis, authorization, seller, and marketplace regressions. |
| `pnpm run build:frontend` | Production Vite frontend compilation. |
| `pnpm test:e2e` | Browser smoke coverage for branded authentication route reachability, accessible radio controls, recovery boundary, protected access, hostile routes, guarded transport, and responsive checks. |
| Visual review | Full-page desktop (1280×900) and mobile (375×812) captures for all five redesigned authentication routes. |

## 11. Test results

The final release-validation run completed successfully on 22 August 2026. `pnpm check` passed. The complete Vitest run passed **54 test files / 155 tests**, with **1 intentional skip**. The production frontend build passed, transforming 1,806 modules. The browser smoke suite passed **20 of 20** scenarios. The focused authentication/security run also passed **3 test files / 18 tests**.

During validation, two browser assertions still expected the retired headings and button semantics. They were updated to assert the approved headings and native radio controls; the full browser suite then passed. No production data, user role, seller application, listing, order, message, or email delivery was modified during this validation.

## 12. Remaining issues

Ordinary-recipient password-reset and email-verification delivery remain deliberately unavailable because an authorized sender domain has not yet been configured. The redesigned recovery screen states this plainly and does not promise a reset email, resend action, or verification email. The underlying token procedures remain intact for a future approved sender-domain rollout.

Managed-site publication and read-only public-route verification are still required for this release checkpoint. Cloudflare staging, Pages proxy, caching, and provider-migration work remain paused by the project owner and are outside this release.

