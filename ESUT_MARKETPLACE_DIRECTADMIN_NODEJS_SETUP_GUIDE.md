# ESUT Marketplace DirectAdmin and HostAfrica Node.js Setup Guide

**Website:** `esutmarketplace.com`  
**Current application:** React 19 + Vite frontend, Node.js/Express/tRPC backend, Drizzle ORM, MySQL/TiDB-compatible database  
**Hosting panel:** HostAfrica DirectAdmin Node.js Hosting  
**Confirmed DirectAdmin values:** Node.js 22 LTS, Production mode, current root `apps/api`, temporary URL `myapp.africa`  
**Prepared by:** Manus AI

## Important decision before you click anything

The current ESUT Marketplace repository is a **single-root application**. Its important files are arranged like this:

```text
package.json
pnpm-lock.yaml
client/
server/
drizzle/
shared/
vite.config.ts
tsconfig.json
```

The production build creates the Node.js entry file:

```text
dist/index.js
```

The current production scripts are:

```json
"build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
"start": "NODE_ENV=production node dist/index.js"
```

Therefore, **do not leave `apps/api` as the application root unless the complete ESUT Marketplace repository is physically deployed inside that directory**. If `apps/api` contains only a frontend, only an API fragment, or no `package.json`, the application will not deploy correctly.

The correct mapping for the current repository is:

| DirectAdmin field | Correct ESUT Marketplace value |
|---|---|
| Node.js version | Node.js 22 LTS |
| Application mode | Production for staging-like runtime testing; production only after acceptance gates pass |
| Application root | The directory containing the complete repository and `package.json` |
| Startup file | `dist/index.js` |
| Temporary application URL | `myapp.africa`, only if this is an authorized provider hostname |
| Staging URL | Prefer `staging.esutmarketplace.com` after DNS setup |
| Production URL | `https://esutmarketplace.com` |
| Start command | `pnpm start` or the provider’s equivalent using `NODE_ENV=production node dist/index.js` |

## Part 1: Change the DirectAdmin application root

### Step 1: Open the Node.js application manager

1. Sign in to the HostAfrica customer portal.
2. Open the hosting service connected to the ESUT account.
3. Open **DirectAdmin**.
4. Find **Node.js**, **Node.js Selector**, **Node.js Applications**, or **Application Manager**. The exact label can vary by HostAfrica panel version.
5. Open the existing application currently showing:
   - Node.js version: `22 LTS`
   - Application mode: `Production`
   - Application root: `apps/api`
   - Application URL: `myapp.africa`

Do not delete the application yet. First inspect the available edit fields and record the current values in a private deployment note.

### Step 2: identify the actual deployed repository directory

The application root must point to the directory where the complete repository will be uploaded or cloned. Common examples are:

```text
/home/USERNAME/esut-marketplace
/home/USERNAME/domains/myapp.africa/esut-marketplace
/home/USERNAME/apps/esut-marketplace
```

The correct directory is the one where these files will exist:

```text
/home/USERNAME/esut-marketplace/package.json
/home/USERNAME/esut-marketplace/pnpm-lock.yaml
/home/USERNAME/esut-marketplace/client/
/home/USERNAME/esut-marketplace/server/
/home/USERNAME/esut-marketplace/drizzle/
```

If `apps/api` is only an empty directory, do not use it. You have two choices:

| Choice | When to use it |
|---|---|
| Change root to a repository directory such as `esut-marketplace` | Preferred for the current single-root repository |
| Keep `apps/api` but deploy the entire repository inside it | Use only if DirectAdmin or the provider requires that path |

Do not split the current frontend and backend into separate directories for this deployment. The current Vite build and Express server are built from the same project root.

### Step 3: change the Application root field

In the Node.js application edit screen:

1. Click **Edit**, **Modify**, or the pencil icon beside **Application root**.
2. Replace `apps/api` with the full repository directory. For example:

```text
esut-marketplace
```

or, if DirectAdmin requires an absolute path:

```text
/home/USERNAME/esut-marketplace
```

3. Do not add `/dist` to the application root. The root must contain `package.json` so dependencies and build scripts can run.
4. Save the application-root change.
5. If DirectAdmin asks whether to restart the application, choose restart only after the startup file and environment settings are also corrected.

### Step 4: verify the directory before continuing

If SSH is enabled, connect to the account and run:

```bash
cd /home/USERNAME/esut-marketplace
pwd
ls -la
test -f package.json && echo "package.json found"
test -f pnpm-lock.yaml && echo "pnpm lockfile found"
```

If Git is enabled in DirectAdmin, the repository should be cloned into the application root rather than into a nested duplicate such as:

```text
/home/USERNAME/esut-marketplace/esut-marketplace
```

That nested layout is a common cause of startup failures. The directory selected in DirectAdmin must be the same directory where `package.json` is located.

## Part 2: Set the startup file to `dist/index.js`

### Step 1: locate the startup-file field

In the same Node.js application screen, locate a field named **Startup file**, **Entry point**, **Application startup file**, or **Startup script**.

Enter exactly:

```text
dist/index.js
```

Do not enter:

```text
server/_core/index.ts
client/src/main.tsx
index.html
dist/public/index.html
```

Those are development/source/browser files, not the production Node.js server entrypoint.

### Step 2: confirm the build creates the startup file

From the application root, run:

```bash
pnpm install --frozen-lockfile
pnpm run build
ls -l dist/index.js
```

The final command must show the file. If it does not, stop and do not restart the DirectAdmin application. Inspect the build output first.

### Step 3: set the application command if DirectAdmin provides one

If DirectAdmin has a **Start command** field, use:

```bash
pnpm start
```

If it requires the full command, use:

```bash
NODE_ENV=production node dist/index.js
```

Do not hard-code a public port. The application must use the provider-assigned `PORT` environment variable or the project’s existing runtime port handling.

### Step 4: save and restart

1. Save the startup-file change.
2. Save the application configuration.
3. Restart the Node.js application from DirectAdmin.
4. Open the application URL.
5. Check the Node.js application log immediately if the page does not load.

A successful restart should show the application process running rather than a one-time command that exits immediately.

## Part 3: deploy the repository

### Option A: Git deployment

If DirectAdmin provides Git deployment or SSH access, use a private repository and a pinned commit:

```bash
cd /home/USERNAME
mkdir -p esutmarketplace
cd esutmarketplace
git clone YOUR_PRIVATE_REPOSITORY_URL .
git checkout APPROVED_COMMIT_SHA
```

Never place a Git token directly in a public URL or commit it into the repository.

### Option B: upload an archive

If Git is unavailable:

1. Create a release archive from the approved commit.
2. Upload it through DirectAdmin File Manager, SFTP, or SSH.
3. Extract it into the application root.
4. Confirm that `package.json` is directly inside the root.
5. Confirm that you did not upload `.env`, database dumps, private keys, or local development credentials.

### Install dependencies

From the application root:

```bash
pnpm install --frozen-lockfile
```

If pnpm is not available, do not immediately replace it with npm. The project declares pnpm and uses `pnpm-lock.yaml`. Ask HostAfrica whether pnpm 10 is available through SSH or whether they provide a lockfile-compatible deployment method.

### Build the project

```bash
pnpm check
pnpm test
pnpm run build
```

Confirm the output:

```bash
test -f dist/index.js && echo "Node entrypoint is ready"
find dist -maxdepth 2 -type f | head -40
```

## Part 4: configure DirectAdmin environment variables

Open the Node.js application’s **Environment Variables**, **Application Variables**, or **Environment** panel. Add the values there rather than creating a public `.env` file.

Use separate staging and production values. The following are the main variables used by the current application:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Set to `production` |
| `PORT` | Provider-assigned application port; do not hard-code it |
| `DATABASE_URL` | MySQL/TiDB-compatible application database |
| `JWT_SECRET` | Server-side session signing secret |
| `VITE_APP_ID` | OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth server base URL |
| `VITE_OAUTH_PORTAL_URL` | Browser login portal URL |
| `OWNER_OPEN_ID` | Authorized owner identity |
| `OWNER_NAME` | Owner display name |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Cloudinary server-side API key |
| `CLOUDINARY_API_SECRET` | Cloudinary server-side API secret |
| `REDIS_URL` | Upstash/Redis connection if enabled |
| `RESEND_API_KEY` | Only when live email is authorized |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `BUILT_IN_FORGE_API_URL` | Required if Manus Forge services remain active |
| `BUILT_IN_FORGE_API_KEY` | Server-only Forge credential if required |
| `VITE_PUBLIC_SITE_URL` | Staging or production canonical URL |

For staging, use:

```text
VITE_PUBLIC_SITE_URL=https://staging.esutmarketplace.com
```

For production, use:

```text
VITE_PUBLIC_SITE_URL=https://esutmarketplace.com
```

Never expose `JWT_SECRET`, `DATABASE_URL`, `CLOUDINARY_API_SECRET`, `REDIS_URL`, `RESEND_API_KEY`, or `BUILT_IN_FORGE_API_KEY` as public browser variables.

## Part 5: prepare the database

Create a separate staging database before using production data. The database must be compatible with the existing Drizzle schema and MySQL driver.

Confirm with HostAfrica:

| Question | Required answer |
|---|---|
| Database engine/version | MySQL-compatible version supported by `mysql2` and Drizzle |
| Connection limit | Enough for the application and administrative tools |
| Import size | Large enough for the approved database backup |
| Backups | Retention and restore procedure documented |
| SSL/TLS | Available for database connections if supported |
| Charset/collation | Compatible with Nigerian names, descriptions, and messages |
| Remote access | Not publicly exposed unless specifically required and secured |

For a first staging schema deployment, use the project’s approved migration procedure. Do not run destructive database commands against production. Validate migrations and row relationships before cutover.

## Part 6: configure the domain and HTTPS

### Staging first

Create a staging subdomain such as:

```text
staging.esutmarketplace.com
```

Point its DNS record to the HostAfrica hosting destination only after HostAfrica provides the correct target. Do not change the root domain while staging is incomplete.

### Production later

After staging passes, configure:

```text
esutmarketplace.com
www.esutmarketplace.com
```

The preferred behavior is to choose one canonical hostname and redirect the other to it. For example, redirect `www.esutmarketplace.com` to `https://esutmarketplace.com`.

### SSL

Enable HostAfrica’s Let’s Encrypt certificate for the staging hostname first. Then verify:

```bash
curl -I http://staging.esutmarketplace.com
curl -I https://staging.esutmarketplace.com
```

Expected behavior is HTTP-to-HTTPS redirection, a valid certificate, no mixed content, and secure cookies.

## Part 7: configure OAuth callbacks

For staging, register:

```text
https://staging.esutmarketplace.com/api/oauth/callback
```

For production, register:

```text
https://esutmarketplace.com/api/oauth/callback
```

Do not point the OAuth provider at the temporary `myapp.africa` URL after production cutover. The OAuth callback must preserve state validation, exchange the code server-side, create the session, set the secure cookie, and redirect to `/` without leaving `?code=` visible.

Test authentication in a private browser window:

1. Open the staging URL.
2. Select Log in.
3. Complete authentication.
4. Confirm the callback returns to the homepage without a visible code parameter.
5. Open Account and Security & devices.
6. Confirm the real session/device information appears.
7. Log out.
8. Open `/account/security` directly.
9. Confirm the unauthenticated user is sent to `/login`.

## Part 8: configure Cloudinary and private storage

The public product-image path should use Cloudinary. Add the Cloudinary server variables through DirectAdmin and test signed uploads, public transformations, product detail images, missing-image states, and approved public artwork.

Private seller evidence and any remaining protected storage paths must not become publicly accessible merely because the application is now hosted externally. If they still depend on Manus Forge storage, confirm external outbound access and credentials before production cutover.

Do not store product-image bytes in the shared hosting filesystem as the permanent source of truth. Use Cloudinary for approved public product media and store only the approved metadata and identifiers in the database.

## Part 9: configure Redis and email

If Redis/Upstash is enabled, add the production `REDIS_URL` as a server-only variable. Confirm HostAfrica allows outbound TLS connections. Test rate limiting, security events, session operations, and graceful failure when Redis is unavailable.

Keep email delivery paused until the sender domain is verified and ordinary-recipient testing is authorized. If enabled, configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only on the server. Test verification, password recovery, seller approval, security, and marketplace event messages before public launch.

## Part 10: configure scheduled jobs

The application has these scheduled endpoints:

```text
POST /api/scheduled/product-reminders
POST /api/scheduled/reservation-expiry
```

They are protected and are not ordinary public endpoints. HostAfrica must confirm that DirectAdmin cron can call them with the required authenticated task identity and task UID. A basic anonymous `curl -X POST` may receive `403` and must not be used as a workaround.

If HostAfrica cannot provide the existing scheduler identity, do not make the endpoints public. Instead, obtain an approved security design for a signed scheduler adapter with timestamp validation, replay protection, task-specific authorization, and audit logging.

Test valid execution, invalid credentials, wrong task UID, duplicate execution, timeout, and partial failure in staging.

## Part 11: first staging deployment

Use this order:

1. Confirm DirectAdmin root is the complete repository root.
2. Confirm startup file is `dist/index.js`.
3. Confirm Node.js is 22 LTS.
4. Confirm staging URL and SSL.
5. Add staging environment variables.
6. Configure staging database.
7. Upload or clone the approved commit.
8. Run `pnpm install --frozen-lockfile`.
9. Run `pnpm check`.
10. Run `pnpm test`.
11. Run `pnpm run build`.
12. Restart the DirectAdmin Node.js application.
13. Open the staging homepage.
14. Inspect application logs.
15. Test the API and authentication.
16. Test buyer, seller, admin, media, checkout, and security flows.

Check the app and static assets:

```bash
curl -I https://staging.esutmarketplace.com/
curl -I https://staging.esutmarketplace.com/robots.txt
curl -I https://staging.esutmarketplace.com/sitemap.xml
curl -i https://staging.esutmarketplace.com/assets/does-not-exist.js
```

A missing hashed asset must return a non-HTML 404. It must not return `index.html` with HTTP 200, because that causes dynamic-import failures.

## Part 12: staging acceptance matrix

Do not connect the production domain until all relevant tests pass:

| Area | Acceptance test |
|---|---|
| Homepage | Loads without console errors and displays real data states |
| Search | Query, category, price, sorting, loading, and no-results behavior |
| Product | Known listing, unknown listing, images, seller, related listings |
| Store | Known store and honest unknown-store error state |
| Authentication | Registration, login, OAuth, logout, callback cleanup |
| Security | Security & devices, real sessions, activity, device revocation |
| Buyer | Account, cart, checkout, orders, favorites, messages, notifications |
| Seller | Application, verification, store, listings, inventory, orders, offers |
| Admin | Users, sellers, stores, moderation, reports, disputes, audit log |
| Media | Cloudinary product images and protected evidence boundary |
| Scheduled work | Reminders and reservation expiry with authenticated scheduler |
| Responsive | 320px, 360px, 375px, 390px, tablet, desktop |
| Security headers | HTTPS, HSTS, non-indexing, route redirects, protected APIs |
| Recovery | Backup restore, application rollback, DNS rollback |

## Part 13: production cutover

Only after staging passes:

1. Take a final database backup.
2. Record the current Manus release URL as the rollback target.
3. Change `VITE_PUBLIC_SITE_URL` to `https://esutmarketplace.com`.
4. Build and deploy the approved commit to the production DirectAdmin application.
5. Configure the production OAuth callback.
6. Configure production Cloudinary and Redis values.
7. Confirm the production database connection.
8. Point `esutmarketplace.com` DNS to HostAfrica.
9. Enable and verify SSL.
10. Restart the Node.js application.
11. Open the production homepage.
12. Test login, logout, buyer, seller, admin, checkout, product images, and Security & devices.
13. Verify robots.txt, sitemap, security headers, and missing-asset behavior.
14. Keep the Manus deployment available until the new site has passed the observation period.

## Part 14: monitoring and maintenance

During the first 72 hours, inspect the DirectAdmin Node.js logs, resource usage, database errors, authentication errors, Cloudinary delivery, Redis connections, scheduled-job responses, and user reports.

The application should be upgraded or moved to a VPS if shared-host limits cause process restarts, memory exhaustion, database connection failures, inability to run authenticated cron, inadequate logs, or unreliable response times.

Maintain the following operational records:

| Record | Frequency |
|---|---|
| Database backup verification | Daily backup; restore test at an approved interval |
| Dependency/security review | Regularly and after security advisories |
| Node.js runtime review | Before end-of-life or provider runtime changes |
| OAuth callback review | After every domain or hosting change |
| Cloudinary delivery review | After media or transformation changes |
| Scheduler review | After cron or task-identity changes |
| Full acceptance test | Before every production release |

## Part 15: rollback

If the HostAfrica deployment fails after cutover:

1. Keep the failed environment intact for logs and investigation.
2. Restore DNS to the Manus rollback deployment or approved previous host.
3. Restore the previous OAuth callback if the domain target changes.
4. Restore the previous application release if the database schema remains compatible.
5. Restore the database only when the application and schema require it.
6. Re-test login, buyer, seller, admin, checkout, media, and scheduled flows.
7. Document the incident and the reason for rollback.

Never solve a failed deployment by disabling authorization, making scheduler endpoints public, exposing secrets, or bypassing OAuth state validation.

## DirectAdmin troubleshooting table

| Symptom | Likely cause | Corrective action |
|---|---|---|
| Application does not start | Wrong root or missing `dist/index.js` | Point root to repository and rebuild |
| `Cannot find package.json` | Root points to a nested/empty directory | Change root to the directory containing `package.json` |
| HTML returned for JS chunk | Stale deployment or asset fallback | Deploy matching build and preserve asset 404 boundary |
| OAuth callback fails | Wrong callback URL or proxy HTTPS headers | Register exact HTTPS callback and verify proxy behavior |
| Session does not persist | Secure cookie/proxy/domain mismatch | Verify HTTPS, forwarded protocol, cookie domain, and same-site policy |
| Database connection fails | Wrong URL, version, or connection limit | Verify database credentials and provider compatibility |
| Images fail | Cloudinary credentials or outbound HTTPS issue | Test signed upload and public transformation URL |
| Scheduled endpoint returns 403 | Missing scheduler identity/task UID | Configure an approved authenticated cron path |
| App restarts repeatedly | Memory/process limit or runtime error | Read logs, reduce pressure, or upgrade to VPS |
| `pnpm` unavailable | Provider does not expose package manager | Ask for supported pnpm workflow; do not alter lockfile blindly |

## Final configuration checklist

Before declaring ESUT Marketplace live on HostAfrica Node.js Hosting, verify:

```text
[ ] Node.js 22 LTS selected
[ ] Application root contains package.json
[ ] Application root is not an empty or partial apps/api directory
[ ] Startup file is dist/index.js
[ ] Application mode is Production
[ ] pnpm/lockfile installation works
[ ] pnpm check passes
[ ] pnpm test passes
[ ] pnpm run build passes
[ ] PORT is provider-managed
[ ] Staging database is separate from production
[ ] Production DATABASE_URL is correct
[ ] JWT_SECRET is configured server-side
[ ] Cloudinary server secrets are configured
[ ] Redis/Upstash connection is tested if enabled
[ ] OAuth staging and production callbacks are registered
[ ] Scheduler identity/task UID is supported
[ ] SSL is valid
[ ] Missing assets return 404, not HTML 200
[ ] Product images load through Cloudinary
[ ] Private evidence is not public
[ ] Buyer/seller/admin routes pass acceptance tests
[ ] Backup restore has been tested
[ ] Manus rollback deployment remains available
[ ] Root-domain DNS is changed only after staging approval
```

## References

[1]: https://www.hostafrica.ng/hosting/node-js-hosting/ — HostAfrica Node.js Hosting product information.  
[2]: `package.json` — Current build, start, validation, test, and package-manager contract.  
[3]: `server/_core/env.ts` — Current environment-variable contract.  
[4]: `server/_core/oauth.ts` — OAuth callback, state validation, secure session, and redirect behavior.  
[5]: `server/cloudinary.ts` — Cloudinary public media integration.  
[6]: `server/productReminderSchedule.ts` and `server/reservationExpirySchedule.ts` — Scheduled endpoint authentication and task behavior.  
[7]: `server/_core/securityHeaders.ts` — Security headers and crawler policy.  
[8]: `server/_core/vite.ts` — Static asset serving, SPA fallback, and missing-asset behavior.

> This guide is a technical deployment procedure. The project owner must approve provider contracts, DNS changes, production data migration, email activation, and final cutover before execution.
