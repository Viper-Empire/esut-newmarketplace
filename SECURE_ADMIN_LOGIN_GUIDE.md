# Secure Administrator Login Guide

## Sign-in path

Administrators use the same branded marketplace login route as every other member: `/login`. Enter the email address and password for an account that has already been assigned the `ADMIN` or `SUPER_ADMIN` role. After authentication, open `/admin` or use the administrator workspace entry point.

The public `/register` route never grants an administrator role. Buyer, Individual Seller, and Business Vendor registration intents create marketplace member accounts only. Administrator privileges must be assigned server-side by an authorized project owner or existing administrator through a controlled management process. A browser, request body, or client-side role value cannot elevate an account.

## Protected behavior

The `/admin` route has a user-experience access gate, but the actual security boundary is the server-side `adminProcedure` used by administrator tRPC procedures. It accepts only active users whose live database role is `ADMIN` or `SUPER_ADMIN`. Deactivated accounts are rejected during request authentication, even if their previous session cookie has not expired.

## Recommended operator flow

Create or identify the intended member account through `/register` or `/login`. Have an authorized project owner assign the administrator role server-side. Sign out and sign back in to refresh the authenticated session, then open `/admin`. If the account is not authorized, the application should display an administrator-access message and deny protected procedures.

Administrators should use unique passwords, avoid sharing credentials, sign out from shared devices, and review `/admin/audit-logs` after sensitive changes. The current project does not yet provide MFA or step-up authentication; that should be the next administrator-security enhancement before broad production launch.
