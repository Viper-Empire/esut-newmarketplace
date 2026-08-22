# ESUT Marketplace Hosting and Domain Decision

**Decision date:** 22 August 2026

The project owner has chosen to keep the current Manus-managed public URL as the official ESUT Marketplace address:

> https://esutshop-59wzg8bs.manus.space

The application remains hosted and served by Manus. Cloudinary is used for the approved public media layer, while the existing Manus services continue to provide the marketplace runtime, database, sessions, and protected storage boundaries.

Custom-domain purchase, connection, DNS changes, redirects, hostname replacement, and disabling of the current `manus.space` address are deferred. No custom-domain or DNS operation should be performed until the owner explicitly requests it and supplies or selects the exact domain.

The existing Manus URL is retained as the known public address and rollback/reference path. This decision does not change application code, database records, media objects, authentication, Cloudinary configuration, or traffic routing.
