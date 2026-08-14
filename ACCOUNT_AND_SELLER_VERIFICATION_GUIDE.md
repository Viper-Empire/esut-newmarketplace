# ESUT Marketplace Account Claim and Seller Verification Guide

## Existing account password claim

Existing marketplace users do **not** need a replacement account. After signing in with their current session, they can open **My Account** and use **Claim password login**. They then sign out, open `/register`, and enter the same email address already attached to their ESUT Marketplace account, along with their name, phone number, account type, and a new password confirmed a second time.

The server finds the existing user record by normalized email. If that record does not yet have a password hash, it stores only a new password hash and updates the profile contact/account-type fields. It retains the same user ID, open ID, role, seller application, store ownership, listings, cart, orders, messages, notifications, reviews, and audit history. If a password is already present for that email, the flow refuses to overwrite it and directs the person to the normal login or password-recovery route.

## Registration account types

New and existing users can choose either **Individual** or **Business / Vendor** during registration. This classification is saved in the account profile and guides the verification workflow; it never grants seller permissions by itself.

| Account choice | Required seller verification data | What remains locked until approval |
| --- | --- | --- |
| Individual | ESUT email address and registration number | Store application, seller workspace, and sensitive seller operations |
| Business / Vendor | Business name and business registration number | Store application, seller workspace, and sensitive seller operations |

## Seller onboarding sequence

1. An authenticated account opens `/sell` and chooses **Individual seller** or **Business / Vendor**.
2. The account supplies the matching verification fields. The application is stored as `PENDING` and the profile verification state becomes `PENDING`.
3. An administrator visits `/admin`, reviews the verification queue, and either approves or rejects it with a recorded note.
4. Only an approved verification unlocks the store-application form. The user then submits their proposed store details for a separate administrator review.
5. An administrator approves the store application only if the matching verification type is already approved. The server activates the store, grants the `SELLER` role, and creates the seller notification.

> **Security control:** Role labels in the browser do not unlock seller tools. Sensitive seller procedures perform a server-side verified-seller check. Administrators and super administrators retain oversight access, while a normal seller without approved verification is denied.

## Password controls

The branded login and registration pages provide an independent **show/hide password** control. Registration also requires a separate **Confirm password** field; client-side submission stops if the two values differ, and the server independently enforces password length requirements.

## Email operations

Password recovery and new-account email verification use one-hour opaque tokens, whose hashes—not raw tokens—are retained in the database. A verified Resend sending domain is still required for those emails to reach arbitrary marketplace recipients.

### Temporary sign-up mode and safe re-enablement

Email verification is currently **paused**. Any valid email address can create an account and immediately sign in; the registration interface does not claim an email was sent or require verification before normal marketplace access. This avoids blocking users while the current Resend test sender is limited to its account owner.

To re-enable the feature safely, first verify an ESUT Marketplace sending domain in Resend and send a successful test to a normal non-owner recipient. Then set `EMAIL_VERIFICATION_ENABLED` to `true` in `server/authFeatureFlags.ts`, restart the server, and test these flows with a disposable account: registration → received verification link → `/verify-email`, plus forgot password → received reset link → `/reset-password`. Do not enable the flag merely because an API key exists.
