# Managed Website Release Verification

## Public baseline

On 2026-08-22, the managed public website at `https://esutshop-59wzg8bs.manus.space` returned the ESUT Marketplace homepage successfully after the owner-published release candidate was made available.

The public route displayed the expected marketplace identity, navigation, real catalogue entries, seller-photo fallback states, category links, cart controls, and buyer/seller entry points. The inspection was read-only; no account, listing, cart, order, seller, administrator, storage, database, email, or Cloudflare action was performed.

## Verification boundary

The seller listing manager and message workspace are intentionally authenticated and role-gated. Their full data-bearing states must be verified using an owner-controlled account session, not fabricated records or unapproved credentials. Cloudflare staging remains paused by owner instruction and is not part of this managed-site verification.

## Published route checks

The managed `/explore` route was verified after publication. It renders the public listing search, sort, condition, price, verified-seller, and quick category controls alongside real listing results. The managed `/account/messages` route was also verified while signed out. It shows a compact private-messages sign-in boundary and does not disclose conversation records to an anonymous visitor.

The next required verification is an authenticated seller/listing session and an authenticated buyer or seller conversation session. This must be completed by the owner through the browser because the verification should use an existing real account and no password should be shared in chat.

## Authenticated messaging verification

With the owner-controlled signed-in session, the managed `/account/messages` route returned only the caller's existing conversation summaries and provided a searchable two-pane conversation workspace. Opening an authorised existing conversation rendered the selected-thread state, counterparty initials/name, real listing and store context, received/sent message alignment, timestamps, report controls, and the character-limited composer with its keyboard instructions.

The interaction was read-only. No new message was entered or sent, no report action was used, and no conversation data outside the authenticated caller's visible list was requested.

## Authenticated seller listing verification

The owner-controlled signed-in account reached the published protected `/seller/products` workspace and received the real store catalogue, including listing-status filters, listing counts, direct edit links, stock and trust-video destinations, permitted lifecycle actions, and draft-only guarded deletion. The page did not expose other stores' listings.

An existing draft’s published edit route loaded the persisted title, category, description, price, quantity, pickup information, offer setting, and the real primary-photo publication requirement. No field was changed and no save, publish, archive, pause, or deletion action was submitted.
