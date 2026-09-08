# HostAfrica Hosting Options Compared for ESUT Marketplace

**Decision subject:** Shared Web Hosting, LiteSpeed Hosting, WordPress Hosting, or Node.js Hosting  
**Application:** ESUT Marketplace  
**Domain under planning:** `esutmarketplace.com`  
**Prepared by:** Manus AI  
**Research date:** 2026-09-07

## Executive recommendation

If the decision is limited to the four HostAfrica options you listed, choose **Node.js Hosting**. It is the only option explicitly designed to run custom Node.js applications, and ESUT Marketplace is a custom React/Vite plus Node.js/Express/tRPC application rather than a WordPress site or a conventional PHP/CMS website.[1] [4]

However, Node.js Hosting on HostAfrica appears to be **shared hosting**, not a VPS. For an early staging deployment or carefully tested low-to-moderate production workload, it may be suitable. For the serious production marketplace you described—with authentication, buyers, sellers, administrators, messaging, security sessions, scheduled jobs, Cloudinary, Redis, checkout reservations, and long-term operational control—the previously discussed **Truehost VPS** or another properly managed VPS remains the stronger architecture. A VPS gives you control over the Node.js process, NGINX, systemd, firewall, cron, logs, database placement, deployment releases, and rollback.

Therefore:

> **Among HostAfrica’s four choices: Node.js Hosting. For the preferred production architecture: a VPS, not shared hosting.**

Do not purchase WordPress Hosting, even though ESUT Marketplace has an e-commerce function. The platform is not a WordPress/WooCommerce application.

## What each option means

### 1. Shared Web Hosting

HostAfrica’s general Web Hosting is a shared DirectAdmin hosting product. The provider presents it as a convenient solution for ordinary business websites, domains, email, SSL, migrations, installers, backups, and Git-based deployment.[1]

In shared hosting, multiple customer applications use a common server environment. The provider manages the operating system and server layer, while the customer receives a restricted control panel and application space. This is attractive for simple websites because the operator does not need to maintain Linux, NGINX, systemd, firewalls, or patching.

For ESUT Marketplace, the problem is not that shared hosting is inherently bad. The problem is control. The application needs a reliable long-running Node.js/Express service, protected environment variables, a compatible database, OAuth callback handling, scheduled POST jobs, Redis/Upstash connectivity, Cloudinary uploads, logs, and predictable process restarts. The general page does not establish all of those capabilities. It is therefore not the correct product to select merely because it mentions Git or website hosting.

### 2. LiteSpeed Hosting

HostAfrica’s LiteSpeed product is also shared hosting, but with LiteSpeed server technology, caching, image optimization, CDN/QUIC options, object-cache integrations, and strong WordPress/CMS positioning.[2]

LiteSpeed can improve the delivery of cacheable static or CMS content. It does not automatically make a custom Node.js/tRPC marketplace compatible. Aggressive page caching can also be dangerous for authenticated marketplace pages, account security, checkout, carts, seller dashboards, admin pages, messaging, and personalized responses. Those routes must not be served from a shared public cache.

LiteSpeed Hosting may be useful for a separate public brochure site or a future marketing site. It is not the first choice for the current application unless HostAfrica confirms that the same plan supports the required Node.js runtime, process model, reverse proxy, environment variables, cron, database access, and cache exclusions.

### 3. WordPress Hosting

HostAfrica’s WordPress product is a managed WordPress platform with WordPress staging, plugin/theme management, automatic WordPress updates, WordPress-oriented backups, restore points, security hardening, and WordPress support.[3]

This is appropriate for WordPress, WooCommerce, blogs, institutional content sites, and plugin-driven websites. ESUT Marketplace does not use WordPress, PHP, WooCommerce, or a WordPress database. It uses React/Vite, Node.js/Express, tRPC, Drizzle ORM, and a custom marketplace schema.

WordPress Hosting is therefore **not compatible as the primary host** unless the application is rewritten as a WordPress/WooCommerce system. That would be a new product and migration, not a hosting change. Do not choose it for the current codebase.

### 4. Node.js Hosting

HostAfrica’s Node.js product explicitly advertises Node.js on every plan, SSH access on request, shared hosting, free SSL, and the ability to configure Node.js applications through the hosting control panel.[4]

This makes it the only direct match among the four options. It may be able to run the Express server and serve the built React application. It still requires technical confirmation before purchase because the public page does not specify the details that determine production suitability: supported Node major version, process manager, memory/CPU limits, process restart behavior, application port/proxy handling, environment variables, database options, cron, WebSockets or long polling, outbound API access, deployment hooks, and log retention.

## Fit against ESUT Marketplace requirements

| Requirement | Shared Web Hosting | LiteSpeed Hosting | WordPress Hosting | Node.js Hosting | VPS |
|---|---|---|---|---|---|
| React/Vite build | Possible if static files can be served | Possible | Not the intended model | Possible | Yes |
| Node.js/Express server | Unconfirmed | Unconfirmed | Not intended | Explicitly advertised | Full control |
| tRPC API | Unconfirmed | Unconfirmed | Not intended | Must be tested | Yes |
| Long-running process | Provider-dependent | Provider-dependent | Managed WordPress process | Provider-dependent | systemd/PM2 under owner control |
| Custom environment variables | Must confirm | Must confirm | WordPress-focused | Must confirm | Yes |
| MySQL/TiDB-compatible database | Usually shared/limited | Usually shared/limited | WordPress database model | Must confirm | Full choice/control |
| OAuth callback and secure cookies | Must confirm proxy behavior | Must confirm proxy/cache behavior | Not appropriate | Must test forwarded HTTPS | NGINX control |
| Authenticated routes | Possible only with correct app runtime | Cache exclusions must be exact | Not appropriate | Possible if runtime is correct | Full control |
| Scheduled jobs | Must confirm | Must confirm | WordPress scheduler model | Must confirm cron/auth model | VPS cron/systemd timers |
| Cloudinary outbound HTTPS | Must confirm | Must confirm | Possible but irrelevant | Must confirm | Yes |
| Redis/Upstash outbound connection | Must confirm | Must confirm | Not intended | Must confirm | Yes |
| Deployment rollback | Panel/provider-dependent | Panel/provider-dependent | Managed WordPress restore | Provider-dependent | Release directories and symlink |
| Security headers and NGINX policy | Limited | Provider-controlled | Provider-controlled | Limited/provider-controlled | Full control |
| Growth and observability | Shared limits | Shared limits | WordPress limits | Shared limits | Better operational visibility |

## The architecture we should use

### Preferred production architecture

For the current serious marketplace, use a VPS architecture:

```text
esutmarketplace.com
        |
        v
DNS A record -> VPS public IP
        |
        v
NGINX HTTPS reverse proxy
        |
        v
systemd-managed Node.js/Express application
        |
        +--> MySQL/TiDB-compatible database
        +--> Cloudinary public media
        +--> Redis/Upstash where enabled
        +--> Resend or authorized email provider
        +--> authenticated scheduled jobs
```

This architecture lets the operator control the Node.js version, application process, systemd restart policy, NGINX headers, HTTPS, firewall, cron authentication, logs, release directories, backups, and rollback. The Truehost Cloud VPS 1 specification previously reviewed was 1 vCPU, 2 GB RAM, 50 GB SSD, and 1 TB transfer. That is a starting configuration, not a forever capacity guarantee.

### Conditional alternative

Use HostAfrica Node.js Hosting only if the owner wants a simpler shared deployment and HostAfrica answers the following questions in writing:

| Question | Required answer |
|---|---|
| Runtime | Is Node.js 22.x available and supported for production? |
| Process | How is the Express process kept alive and restarted after failure? |
| Port | How is the application port mapped behind the provider’s proxy? |
| Memory | What are the RAM, CPU, process, request, and execution-time limits? |
| Secrets | Can server-only environment variables be stored securely and hidden from the browser build? |
| Database | Is compatible MySQL/TiDB access available, and what are connection limits and backups? |
| Cron | Can authenticated POST requests run at the required frequency? |
| Scheduler auth | Can the current task identity/UID mechanism be supported, or is an approved adapter required? |
| HTTPS | Are secure cookies and forwarded HTTPS headers handled correctly? |
| WebSockets | Are messaging or real-time transport requirements supported, if used? |
| Logs | Can application, process, proxy, cron, and error logs be viewed and retained? |
| Deployment | Can Git deploy a pinned commit and provide a reliable rollback? |
| Backups | What is backed up, for how long, and how is a restore tested? |
| Outbound access | Are Cloudinary, Redis, OAuth, and email APIs reachable over TLS? |

If any answer is “no,” “unknown,” or “contact support after purchase,” do not use the plan as the production host. It can still be used as an experimental staging target if no real customer data is placed there.

## Why Node.js Hosting wins among the four

The decisive factor is application runtime, not speed branding. ESUT Marketplace needs a server process that can execute Express routes and tRPC procedures. Node.js Hosting is the only listed product whose public description directly targets Node.js applications.[4]

LiteSpeed’s caching and CDN language is valuable for cacheable pages but does not replace an application runtime. WordPress Hosting automates WordPress, not this codebase. General Web Hosting may have useful Git and SSL features, but the public description does not establish the custom Node.js operational contract needed by a marketplace backend.

## What we should not do

Do not upload only the `dist` folder and assume the API will work. The application needs the bundled Node.js server process, environment variables, database, OAuth configuration, storage/media integrations, scheduled jobs, and correct proxy behavior.

Do not turn on global page caching for account, checkout, cart, seller, admin, messaging, order, session-security, or tRPC responses. Personalized and authenticated responses must not be publicly cached.

Do not expose the Node.js port, MySQL port, Redis port, `.env` file, private evidence paths, or server logs to the public internet.

Do not migrate production directly from the current Manus deployment to shared hosting without a staging host, full database backup, media verification, OAuth callback update, smoke testing, and rollback target.

## Recommendation by scenario

| Scenario | Recommendation |
|---|---|
| You want the correct HostAfrica product for a trial/staging deployment | Node.js Hosting, lowest suitable plan only after technical confirmation |
| You want the correct HostAfrica product for early production | Node.js Hosting, a plan with confirmed Node process, database, cron, logs, and resource limits; still conditional |
| You want serious production control for ESUT Marketplace | VPS, preferably with the database and backups separated from the application VPS |
| You want a separate institutional/blog/marketing website | WordPress Hosting or LiteSpeed Hosting, depending on CMS and caching needs |
| You want only a static landing page | General Web Hosting or LiteSpeed Hosting can be sufficient |
| You want WordPress/WooCommerce | WordPress Hosting |

## Final decision

For **ESUT Marketplace itself**, we should use **Node.js Hosting only if we are choosing from the four HostAfrica categories**. It is the only category aligned with the application’s custom backend.

For the deployment plan you previously described—external domain `esutmarketplace.com`, a manually managed server, NGINX, systemd, cron, security policy, and rollback—the better choice remains a **VPS**. It provides the control ESUT Marketplace needs and avoids forcing a production marketplace into undocumented shared-hosting process limits.

The recommended sequence is:

1. Keep the existing Manus deployment as the current production/rollback environment.
2. Provision the VPS or a HostAfrica Node.js staging account.
3. Deploy a staging copy with a separate database and environment secrets.
4. Test Node.js process behavior, OAuth, Cloudinary, Redis, email, cron, sessions, checkout, admin, seller, and responsive routes.
5. Run a controlled load test and observe CPU, RAM, process restarts, database connections, and latency.
6. Select VPS for production unless Node.js shared hosting passes every technical question and the workload remains intentionally small.
7. Cut over `esutmarketplace.com` only after the release, backup, DNS, SSL, and rollback gates pass.

## References

[1]: https://www.hostafrica.ng/hosting/web-hosting/ — HostAfrica general Web Hosting features, DirectAdmin, backups, Git deployment, SSL, and package descriptions.  
[2]: https://www.hostafrica.ng/hosting/litespeed-hosting/ — HostAfrica LiteSpeed Hosting caching, CDN, object-cache, CMS, and resource-limit information.  
[3]: https://www.hostafrica.ng/hosting/wordpress-hosting/ — HostAfrica WordPress Hosting staging, updates, backups, restore, and WordPress-specific platform description.  
[4]: https://www.hostafrica.ng/hosting/node-js-hosting/ — HostAfrica Node.js Hosting description, SSH-on-request statement, packages, and Node.js application support.  
[5]: https://truehost.com.ng/cloud/cart.php?a=confproduct&i=0 — Truehost Cloud VPS 1 configuration page reviewed for the previously discussed VPS alternative.  
[6]: `package.json`, `server/_core/index.ts`, `server/_core/env.ts`, `server/_core/oauth.ts`, `server/cloudinary.ts`, and `server/*Schedule.ts` — current ESUT Marketplace runtime and integration contracts.
