# Buyer–Seller Chat Reference Analysis

## Scope

This document evaluates the supplied `esut_chat_system.html` as a visual and interaction reference for the authenticated ESUT Marketplace buyer–seller conversation experience. It is a design reference only. Its sample people, product, delivery/read indicators, online status, and menu actions are **not** marketplace data and must never be copied as live content.

## Reference structure to adopt

| Reference pattern | Appropriate ESUT Marketplace adaptation |
| --- | --- |
| Two-pane desktop shell | Conversation list on the left and the active, participant-authorized thread on the right; switch to one pane at a time on mobile. |
| Conversation search | Client-side filtering of the caller's already-authorized conversation list; no broader user directory search. |
| Avatar/initial treatment | Use an opt-in public avatar when available, otherwise a deterministic name-initial avatar. |
| Listing context under participant name | Show the real listing title and store context already provided by the authorized conversation projection. |
| Received/sent bubbles | Use distinct accessible neutral and ESUT-green bubble treatments, with timestamps and clear alignment. |
| Typing dots | Display only from a short-lived, participant-authorized typing signal; expire automatically after inactivity. |
| Composer | Multi-line text field, send action, keyboard shortcut, character boundary, send state, and disabled state while submitting. |
| Three-dot menu | Retain only actions backed by real policies: open related listing/store, report a message or user, and later any implemented mute/block capability. |

## Reference elements that must not be copied directly

| Reference element | Reason | ESUT Marketplace decision |
| --- | --- | --- |
| Sample names, product, times, delivery checks, and “Active now” text | They are illustrative and would become fabricated user-generated activity if shipped. | Replace solely with real authorized conversation data; omit a status when the system cannot truthfully provide it. |
| Call/video-call controls | The marketplace has no approved calling service, consent workflow, or safety controls for off-platform contact. | Do not add. |
| “View profile” unrestricted action | Profiles must not disclose private information or enable unsupported browsing. | Link only to an existing safe storefront/listing context, not private member records. |
| Pin/mute controls | They require user preference data and server/UI behavior that do not currently exist. | Treat as a later scoped feature, not a decorative non-functional control. |
| Block user control | Requires a cross-feature enforcement policy covering messaging, offers, orders, safety workflow, and appeals. | Do not add until its safety policy and backend enforcement are approved. |
| Attachment plus button | A generic uploader could introduce unsafe unsupported files and unmoderated media. | Do not add; existing report/evidence upload flows remain separate and protected. |
| Read receipts | The current schema has `lastReadAt`, but a full truthful per-message read-receipt model needs server procedure/UI coverage. | Defer unless the data contract is extended and tested. |

## Required design adjustments

The reference has a good information hierarchy but its supplied rendering is too visually light at browser scale. The ESUT implementation should use stronger contrast, larger type for the active participant and listing context, a visible selected-conversation state, comfortable 44px touch targets, and an explicit mobile back-to-conversations control. Message bubbles should never rely on colour alone; alignment, labels, timestamps, and adequate contrast provide the additional distinction.

The active-thread header should use the marketplace context rather than an unverified presence claim. It should display the authorized counterparty name, real listing title, store name, and a safe route back to the relevant public product/store record when that record is still accessible. The existing per-message report entry point should remain prominent but secondary to normal reply controls.

## Recommended live-update approach

For the current managed backend, use the existing caller-scoped marketplace refresh signal together with modest active-conversation refetching. A message send should issue a recipient-scoped event, and the message page should refetch only the authorized conversation while it is open. Typing is suitable as a short-lived participant-scoped signal that expires automatically. This is responsive without pretending that the system is an instant persistent socket service.

If sub-second delivery is later required, it needs an explicitly approved always-on chat runtime and operational monitoring before introducing WebSocket/SSE infrastructure.

## Implementation acceptance criteria

1. Buyer and seller routes render the same trusted two-pane conversation pattern while preserving role-specific navigation.
2. Every conversation, message, typing signal, and update query is participant-authorized server-side.
3. Conversation search filters only records the current caller is already entitled to see.
4. No mock conversations, people, presence, read receipts, or delivery states are hardcoded.
5. The design supports keyboard use, screen-reader labels, visible focus, reduced motion, and a one-column mobile workflow.
6. The message composer retains the existing 2,000-character server boundary and rate-limit feedback.
7. Existing report flows remain available; unsupported block, call, attachment, and read-receipt controls are not presented as working features.

## Visual validation notes

The supplied reference was visually inspected as a compact two-pane desktop composition. Its dark appearance is treated as a system-preference palette reference rather than a global application theme. The local unauthenticated `/account/messages` route was also checked after the redesigned component was wired: it correctly shows the private-message sign-in boundary and does not expose any conversation data. Authenticated-thread visual verification remains required with an authorised session.
