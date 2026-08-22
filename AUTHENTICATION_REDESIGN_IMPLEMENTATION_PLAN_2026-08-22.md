# ESUT Marketplace Authentication Redesign: Production Adaptation Plan

## Decision

The supplied Figma-exported design system is appropriate as a **visual foundation** for the ESUT Marketplace authentication experience. It should not be copied as an authentication implementation. Its local `useState` success flows, static third-party login buttons, blue brand theme, hard-coded statistics, and prototype-only screens conflict with the live marketplace contract and will be excluded.

The implementation will be a UI refactor over the current React/tRPC authentication system. It will **not** replace the existing Node/tRPC procedures, session cookie creation, database records, role model, Redis lockout controls, seller approval workflow, or protected-route checks.

## Design-system comparison

| Concern | Supplied reference | Current marketplace | Adaptation decision |
| --- | --- | --- | --- |
| Desktop layout | Responsive desktop split card with a decorative left brand panel and focused form surface | Single centred card | Adopt a responsive split layout for wider screens; use a single focused card on mobile. |
| Brand palette | Blue primary (`#648ddb`) and pale-blue background | ESUT green, commerce red accents, white surfaces, dark text | Replace all blue primary states with ESUT green. Reserve red for existing marketplace emphasis/error states rather than using it as the default authentication action. |
| Form affordances | 56px controls, 12px rounding, labelled inputs, inline error treatment, eye toggle | Functional 48px controls, labels, eye toggle, mostly toast feedback | Adopt the spacing and feedback quality while retaining existing accessible inputs and server error data. |
| Login flow | Client-only success state | `auth.login` mutation, secure session creation, user refresh, redirect, Redis/database lockout | Retain existing mutation and route destination; display success only after the server returns success. |
| Registration | Local name/email/password state only | `auth.register`, Nigerian phone validation, three intent values, account/session creation | Retain all real fields and server input; use accessible radio controls for registration intent. |
| Seller path | No seller workflow | Dual-role buyer/seller model and protected `/sell` onboarding | Make seller intent explicit in registration copy, but never grant seller access from the choice alone. |
| Password recovery | Prototype success screen and fake resend | Availability query, neutral reset request, token reset and email-verification routes | Reuse visual states only. Reflect the current delivery pause honestly; do not render fake resend/sent controls. |
| Social login | Visual Apple/Google buttons only | No approved Apple/Google OAuth path | Remove both buttons and both raster assets from the production UI. |
| Statistics | Hard-coded 10K/5K/98% claims | No current verified public metrics contract | Replace with truthful non-numeric trust statements. |

## Production contract that must remain unchanged

| Real capability | Existing implementation to preserve | Redesigned user experience |
| --- | --- | --- |
| Registration | `auth.register` validates name, marketplace email, Nigerian phone, ten-to-128-character password, and registration intent. | Inline required/format feedback, a strength indicator, and server-confirmed account creation feedback. |
| Buyer / seller intent | `BUYER`, `INDIVIDUAL_SELLER`, and `BUSINESS_VENDOR` are registration intents only; they map to account type and do not elevate authorization. | Three keyboard-accessible radio-card options with clear “shop now; sell after verification and approval” wording. |
| Login | `auth.login` checks current account state, uses Redis-backed lockout with durable database fallback, returns a retry time, and creates a secure session after valid credentials. | Email/password form with eye toggle, generic invalid-credential presentation, disabled submit plus live lockout countdown, and a route to recovery. |
| Sessions | Server-managed session cookie, session security records, account-security view, logout and other-session revocation. | No browser-created session state, token display, or cookie manipulation. A post-login success state appears only after `refresh()` confirms the authenticated user. |
| Reset request | Generic endpoint response and per-email throttling; delivery is currently unavailable for normal recipients. | Neutral, non-enumerating message when delivery is enabled; a truthful support-oriented unavailable state while the sender domain is paused. |
| Reset token | Server validates one-time token expiry and resets password, then creates a new session. | Password strength, show/hide controls, matching validation, expired/invalid state, and server-only final success. |
| Email verification | Token validation exists but sending is feature-flagged off. | Matching verification/result screen; no “resend” claim or delivery promise until the sender domain is verified and enabled. |
| Seller discovery | `/sell` distinguishes guest, ordinary buyer, pending review, verified applicant, and active-store seller states. | Preserve all current routing and seller-onboarding status text; add a concise link from registration confirmation only if the current account state permits it. |
| Administrator separation | Administrator roles are controlled server-side and are not registration choices. | Do not expose administrator registration, “admin intent,” or role-selection controls. |

> **Database correction:** The uploaded brief refers to “PostgreSQL / Neon,” but the active ESUT Marketplace production schema and Drizzle connection are currently MySQL/TiDB-compatible. The planned redesign is frontend-led and does not require a database migration. The separately approved PostgreSQL migration remains an explicit future gate.

## Visual system to implement

The new authentication experience will use the existing ESUT Marketplace logo, **Poppins** for brand/headline hierarchy where loaded, and **Inter** for form and support text. It will introduce scoped auth design tokens rather than scattering arbitrary values across components.

| Token family | Intended ESUT value and use |
| --- | --- |
| `--auth-primary` / hover / active | ESUT green (`#00843d` and controlled darker states) for the primary submission action, selected registration intent, focus treatment, and trusted status. |
| `--auth-surface` / backdrop | White form surface over a clean green-tinted neutral backdrop. |
| `--auth-ink` / muted | Existing deep marketplace charcoal/navy and neutral grey for readable commercial typography. |
| `--auth-border` / focus | Soft neutral borders and a visible green focus ring. |
| `--auth-danger` / warning / success | Existing semantic red, amber, and green states; never use colour as the sole indicator. |
| radius / shadow / spacing | 12px input/button corners, larger panel rounding, controlled soft shadows, and 44px-or-larger touch targets. |

The brand panel will use non-numeric, truthful messaging such as **“Shop. Sell. Connect.”**, **“Your marketplace for the ESUT community.”**, and real capability statements: verified seller workflow, protected campus pickup, and private marketplace messaging. It will have no fake statistics, reviews, ratings, or testimonials.

## Component plan

| New or refined component | Responsibility | Must not own |
| --- | --- | --- |
| `AuthLayout` | Responsive split/single-column layout, page background, back route | Authentication state or navigation decisions. |
| `AuthBrandPanel` | ESUT brand panel, non-numeric trust messages, logo treatment | Metrics, user data, or permission checks. |
| `AuthHeader` / `AuthFooter` | Screen heading, login/register route links, legal/support copy | Form submission. |
| `AuthTextInput` | Label, icon slot, help/error state, autocomplete, focus treatment | Email/password validation rules. |
| `PasswordInput` | Show/hide button, password autocomplete, visible field error support | Credential verdict or password storage. |
| `RegistrationIntentGroup` | Native radio inputs and keyboard/screen-reader accessible intent cards | Role assignment. |
| `PasswordStrength` | Local educational strength/readiness indicator | Server policy override or “secure” guarantee. |
| `AuthStatusPanel` | Loading, lockout, generic authentication error, paused delivery, success result surfaces | Toast replacement for global non-auth actions. |
| `AuthSubmitButton` | Pending/disabled visual state | Mutation creation or session handling. |

No `SocialAuthButton` will be shipped until a real provider integration is formally approved. No all-in-one Figma `App.tsx` or absolute-positioned export will be imported.

## Screen-specific plan

### Login

The login form will retain email, password, show/hide control, recovery route, real pending state, generic invalid-credential state, network/retry state, and the current server-derived lockout countdown. The submit action will continue calling `trpc.auth.login`, then refresh the session and redirect only on server success. The lockout response will never reveal whether an email belongs to an account.

### Create account

The registration view will retain first name, last name, email, Nigerian phone, password, confirmation, and all three intents. The radio-card copy will distinguish a buyer, an individual seller, and a business vendor without making a seller or administrator promise. It will continue calling `trpc.auth.register` and redirect only after the backend has persisted the account and issued the session.

### Forgot password and reset password

The recovery view will reuse the same layout and input treatment. While normal-recipient password-reset email delivery remains disabled, it will show the current truthful unavailable/support state rather than fake “check your inbox” or resend controls. The reset route will gain password-strength and visibility affordances but will preserve the real token validation mutation and its invalid/expired server error.

### Email verification

The verification result screen will use the shared design language. Because verification delivery is paused, registration and login will not claim that a verification message was sent. A resend control is deferred until a verified ESUT sender domain has been configured and tested.

## Implementation sequence

1. Introduce scoped authentication tokens and presentational components without changing routes, API procedures, or schema.
2. Refactor `AuthPage.tsx` to compose the new components around the existing `auth.login` and `auth.register` mutations.
3. Refactor recovery/reset/verification screens around their existing availability and token procedures.
4. Add focused tests covering component-level semantics and preserved mutation inputs, then run the existing auth security regression suite.
5. Verify logged-out login/register/recovery boundaries at desktop and mobile sizes, then use owner-controlled existing buyer and seller sessions for post-login and protected-route verification.
6. Save a checkpoint and have the owner publish through the managed Manus release flow. Cloudflare remains paused.

## Required acceptance checks

| Area | Required evidence |
| --- | --- |
| Security | Existing auth lockout, registration-intent, session, reset-token, and admin-isolation tests still pass. |
| UI | Visible focus, labelled controls, native radio semantics, inline error status, no horizontal mobile overflow, and reduced-motion safe transitions. |
| Backend preservation | UI calls existing tRPC procedures with unchanged input shapes; no new client-side token/session or mock-success implementation exists. |
| Seller model | Both seller intent cards remain registration intent only; real seller access requires the existing `/sell` verification/store workflow. |
| Email boundary | No ordinary-recipient reset or verification email is promised while flags remain disabled. |
| Publication | Managed Manus public URL verification occurs only after an owner-approved checkpoint is published. |

## Explicitly deferred items

1. Apple and Google sign-in require a separately approved provider integration and are not part of this UI redesign.
2. Ordinary-recipient email verification and password-reset delivery require a verified sending domain and end-to-end delivery test.
3. The MySQL/TiDB-to-PostgreSQL migration is a separate staged infrastructure programme and is not caused by this design request.
4. Cloudflare Pages/API work remains paused by owner direction.
