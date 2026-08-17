# ESUT Marketplace Registration and Seller Application Clarity

## Goal

Make account classification and seller onboarding understandable at the first interaction while preserving the current dual-role account model: every authenticated member can buy, and an approved seller can operate a store without signing out or using a separate seller login.

## Product decisions

The registration form should present three plain-language choices under **“I am registering as”**:

| Choice | Meaning | Account behavior |
| --- | --- | --- |
| **A buyer** | I primarily want to shop, save listings, message sellers, and place campus-pickup orders | Creates a normal marketplace account; the member can later apply to sell from account navigation |
| **An individual seller** | I want to sell personally under my own identity | Creates a normal marketplace account and records individual seller intent; selling remains locked until individual verification and store approval |
| **A business vendor** | I represent a registered business or organized vendor operation | Creates a normal marketplace account and records business seller intent; selling remains locked until business verification and store approval |

The system should not create separate buyer and seller identities. The selected classification should be an onboarding intent and profile attribute, not a role elevation. The server must continue to decide whether sensitive seller tools are available based on verified evidence, approved application, active store, and role guards.

## Phase 1 — Audit current registration and seller-entry surfaces

Inspect the branded registration schema, profile account-type field, seller onboarding procedure, public header CTA, mobile navigation, buyer workspace navigation, seller onboarding page, and protected seller workspace boundary. Confirm whether the current account type accepts only `INDIVIDUAL` and `BUSINESS`, how the current `/sell` route behaves for signed-out and signed-in members, and whether the buyer dashboard has a persistent seller-application entry.

Record the current behavior before modification. The audit must distinguish three states: a guest who has not registered, an authenticated buyer who has not applied, and an authenticated member whose verification or store application is pending or approved.

## Phase 2 — Refine the registration contract

Add a UI-only `BUYER` option while preserving the database’s current seller classification values. The recommended server input is:

```ts
const registrationInput = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().email().max(320),
  phone: z.string().trim().min(7).max(32),
  registrationIntent: z.enum(["BUYER", "INDIVIDUAL_SELLER", "BUSINESS_VENDOR"]),
  password: z.string().min(10).max(128),
});
```

Map the intent safely at the server boundary:

```ts
const accountType = input.registrationIntent === "BUSINESS_VENDOR"
  ? "BUSINESS"
  : "INDIVIDUAL";

await db.insert(profiles).values({
  userId,
  accountType,
  sellerIntent: input.registrationIntent,
});
```

If adding `sellerIntent` is not necessary because the existing account type is sufficient, use a server-side mapping instead and do not expose a new database column. The decision should be based on whether the product needs to distinguish a buyer who has never expressed seller interest from an individual seller applicant. Do not overload `role`; a buyer who selects “individual seller” must remain a buyer until verification and approval.

The UI should use radio cards rather than a select menu. Each card should explain what happens next and should not imply that choosing a seller option automatically grants selling access.

```tsx
<fieldset>
  <legend className="text-sm font-extrabold">I am registering as</legend>
  <div className="mt-3 grid gap-3 sm:grid-cols-3">
    {[
      ["BUYER", "A buyer", "Shop, save listings, and order for campus pickup."],
      ["INDIVIDUAL_SELLER", "An individual seller", "Sell personally after identity verification and approval."],
      ["BUSINESS_VENDOR", "A business vendor", "Sell as a registered vendor after business verification and approval."],
    ].map(([value, label, help]) => (
      <label key={value} className="cursor-pointer rounded-2xl border p-4 has-[:checked]:border-[#00843d] has-[:checked]:bg-[#eaf7ef]">
        <input type="radio" name="registrationIntent" value={value} className="sr-only" />
        <span className="block font-extrabold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{help}</span>
      </label>
    ))}
  </div>
</fieldset>
```

The form should retain password confirmation, independent show/hide controls, account recovery messaging, and the paused email-verification behavior already documented by the project.

## Phase 3 — Make “Apply to become a seller” discoverable

The seller application should be available through several consistent entry points:

| Surface | Signed-out state | Authenticated buyer state | Seller state |
| --- | --- | --- | --- |
| Storefront header | **Buy / Sell** links to `/sell` | **Buy / Sell** links to `/sell` | Link opens seller workspace or `/sell` status page |
| Buyer dashboard | Sign-in prompt if needed | Prominent **Become a seller** action | Status-aware seller card |
| Account menu | Login/create account | **Sell on ESUT** or **Become a seller** | **Seller workspace** |
| Footer | Seller requirements and apply link | Same apply link | Seller workspace/status link |
| Empty state after buying | No order-specific seller prompt | Contextual “Interested in selling?” card | Hidden or replaced by workspace CTA |

The primary wording should be **“Become a seller”** or **“Apply to sell”**, not only “Sell on ESUT,” because the user is beginning an approval journey rather than immediately publishing inventory.

The `/sell` route should behave as an onboarding status page:

1. Signed-out visitor: explain ESUT Marketplace selling, verification requirements, and show **Create account** and **Log in**.
2. Authenticated buyer: show **Start seller application** and explain individual versus business verification.
3. Verification pending: show the submitted verification type, pending status, and what is still locked.
4. Verification approved but store application missing: show **Create your store application**.
5. Store application pending: show administrator-review status and prevent duplicate submissions.
6. Store approved and seller tools unlocked: show **Open seller workspace**.

The buyer dashboard should include a persistent card such as:

> **Want to sell to the ESUT community?** Apply as an individual seller or business vendor. Verification is required before listings and sensitive seller tools unlock.

This card must disappear or change to a status card once the member has an active seller application.

## Phase 4 — Preserve dual-role behavior

Do not introduce a seller login route or separate seller session. Keep the existing authenticated session and render role-aware navigation from the same user account. A verified seller should retain the buyer navigation, cart, favorites, messages, notifications, and account settings while also seeing seller workspace links.

The server should continue to enforce ownership independently of navigation. For example:

```ts
const sellerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});

const verifiedSellerProcedure = sellerProcedure.use(async ({ ctx, next }) => {
  const store = await getOwnedActiveStore(ctx.user.id);
  if (!store) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Seller verification and store approval are required.",
    });
  }
  return next({ ctx: { ...ctx, store } });
});
```

The frontend may show or hide navigation based on state, but it must never be the only authorization layer. A normal buyer who visits `/seller` or calls a seller procedure directly must still receive the current protected boundary.

## Phase 5 — Onboarding status and copy

Use a reusable status model for the seller application card. It should display the next action rather than only a technical state.

| Current state | User-facing message | Primary action |
| --- | --- | --- |
| No seller intent | “You can shop now and apply whenever you are ready to sell.” | Become a seller |
| Seller intent selected, no submission | “Choose individual or business verification to begin.” | Start verification |
| Verification pending | “We are reviewing your evidence.” | View submission |
| Verification rejected | “Changes are required before selling can unlock.” | Review requirements |
| Verification approved | “Your identity is approved. Submit your store application.” | Apply for store |
| Store pending | “Your store is awaiting administrator approval.” | View application |
| Store active | “Your seller workspace is ready.” | Open seller workspace |

Avoid promising immediate access after selecting an option. The copy must clearly distinguish account creation from seller approval.

## Phase 6 — Validation plan

Add procedure tests for all three registration intents, existing-account password claim behavior, and the mapping between UI intent and stored profile data. Add browser scenarios for the following journeys:

| Scenario | Expected result |
| --- | --- |
| Guest opens `/sell` | Requirements and account CTAs are visible |
| Buyer opens `/sell` | Application CTA is visible without a second login |
| Buyer selects individual seller | Individual verification path is shown |
| Buyer selects business vendor | Business verification path is shown |
| Unapproved seller visits `/seller` | Protected onboarding boundary remains visible |
| Approved seller returns to storefront | Buyer and seller navigation remain available in one session |
| Direct unauthorized seller procedure call | Server returns `FORBIDDEN` or `NOT_FOUND` according to the existing ownership policy |
| Mobile registration | Three classification cards are readable, keyboard accessible, and do not overflow |

The full release gate remains `pnpm check`, `pnpm test`, and `pnpm test:e2e`, plus authenticated live-preview review with a real buyer and a verified seller account. No sensitive seller evidence should be submitted or approved during automated testing.

## Recommended implementation order

First, make `/sell` a status-aware onboarding entry point and add buyer-dashboard/account navigation to it. Second, add the three registration radio-card choices and map them safely to the existing account and verification model. Third, align desktop header, mobile navigation, footer, and workspace shell labels. Fourth, add the dual-role status card and ensure seller approval does not remove buyer tools. Fifth, add the regression and browser coverage before changing any production data.

## Deferred decisions

This plan does not introduce separate seller accounts, automatic seller approval, online payment, escrow, QR pickup, or administrator bypasses. It also does not require a new database column unless the current account model cannot distinguish seller intent from account classification without losing useful onboarding state. The current secure dual-role session model remains the preferred foundation.
