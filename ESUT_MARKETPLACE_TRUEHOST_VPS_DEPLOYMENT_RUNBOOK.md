# ESUT Marketplace: Truehost VPS Deployment Runbook

**Application:** ESUT Marketplace  
**Production domain:** `esutmarketplace.com`  
**Primary hostname:** `https://esutmarketplace.com`  
**Recommended VPS assumption:** Truehost Cloud VPS 1  
**Prepared by:** Manus AI  
**Document status:** Staging-first production deployment procedure

## 1. Scope and important boundary

This runbook describes how to move ESUT Marketplace from the current managed deployment to an external Truehost Linux VPS using `esutmarketplace.com`. It is written for the current application architecture: React 19 and Vite in the browser, Node.js/Express on the server, tRPC API procedures, Drizzle ORM, a MySQL/TiDB-compatible database, Manus OAuth, Cloudinary public media, security/session data, notifications, messaging, and scheduled marketplace work.

This is a **migration and operations procedure**, not merely a file-upload guide. A successful migration must preserve authentication, role authorization, sessions, media, database relationships, scheduled jobs, security headers, public routing, and rollback capability.

> Do not point the live domain to the VPS until staging has passed the acceptance gates. Keep the current Manus deployment available as the rollback target throughout migration.

## 2. Truehost VPS assessment

The Truehost configuration page currently shows Cloud VPS 1 with **1 vCPU, 2 GB RAM, 50 GB SSD, 1 TB transfer**, Europe/USA data-center choices, and Linux operating systems. The page showed monthly pricing of ₦10,997, with separate quarterly, semi-annual, annual, biennial, and triennial billing options.[1]

This VPS can be a reasonable starting point for a low-to-moderate traffic application server, but it is not a performance guarantee. One vCPU and 2 GB RAM are limited for running the Node.js application, NGINX, local database, build process, monitoring, and other services simultaneously. The recommended initial architecture is therefore:

| Component | Recommended location |
|---|---|
| React/Express/tRPC application | Truehost VPS |
| Reverse proxy and TLS | NGINX on the VPS |
| Database | Managed MySQL/TiDB-compatible service where possible; local MySQL only if backups and capacity are accepted |
| Product images and approved public artwork | Cloudinary |
| Session/security state | Existing configured Redis/Upstash path where required by the application |
| Email | Resend or another authorized provider with a verified sender domain |
| DNS | Registrar/DNS provider controlling `esutmarketplace.com` |
| Backups | Database backup plus encrypted offsite copy; VPS snapshots are supplementary, not the only backup |

### Provider capabilities to confirm before purchase or cutover

The plan page does not by itself prove the following capabilities. Obtain written confirmation from Truehost before treating them as available: root/sudo access, Ubuntu 24.04 support, public IPv4, firewall behavior, CPU/RAM allocation, disk I/O limits, outbound SMTP/API access, Node.js version support, reboot behavior, network monitoring, snapshot/backup retention, support response, traffic policy, and abuse/resource-throttling rules.

## 3. Target architecture

```mermaid
flowchart TB
    Browser[Buyer, seller, admin, or public visitor]
    DNS[DNS: esutmarketplace.com]
    TLS[NGINX + HTTPS certificate]
    Node[systemd-managed Node.js/Express process]
    API[tRPC /api/trpc + OAuth + storage proxy + schedules]
    DB[(Managed or local MySQL/TiDB-compatible DB)]
    Cloudinary[Cloudinary public media CDN]
    Redis[Upstash/Redis security or state integration]
    Email[Resend or approved email provider]
    Cron[External/VPS scheduler]
    Logs[journald + NGINX logs + backup logs]

    Browser --> DNS --> TLS --> Node
    Node --> API
    API --> DB
    API --> Cloudinary
    API --> Redis
    API --> Email
    Cron --> API
    Node --> Logs
```

NGINX receives HTTPS requests for `esutmarketplace.com`, forwards application requests to the local Node.js process, and returns the Node response to the browser. This is the standard reverse-proxy pattern described in the official NGINX documentation.[3]

## 4. Required changes before custom-domain deployment

The current project was developed around the Manus public hostname. Before production cutover, search for and replace hard-coded public URLs with a single configured public-site value.

The current source contains a canonical URL construction using the Manus hostname in `client/src/App.tsx`. The public `robots.txt` and `sitemap.xml` also contain the Manus hostname. These must be changed for `esutmarketplace.com` before the new domain is considered production-ready.

### Required public-site configuration

Introduce a public, non-secret build variable such as:

```text
VITE_PUBLIC_SITE_URL=https://esutmarketplace.com
```

Use it for:

- Canonical URLs.
- Sitemap URLs.
- Robots sitemap reference.
- Public share links where applicable.
- Any absolute links generated in emails or notifications.

Do not place database credentials, JWT secrets, Cloudinary API secrets, Redis credentials, or email API keys in variables beginning with `VITE_`. Vite variables can be included in browser JavaScript.

### Required callback configuration

Configure the OAuth application to allow exactly:

```text
https://esutmarketplace.com/api/oauth/callback
```

For staging, configure a separate approved callback such as:

```text
https://staging.esutmarketplace.com/api/oauth/callback
```

The callback route validates `code` and `state`, checks the one-time state cookie, exchanges the code server-side, creates a tracked session, sets the session cookie, and redirects to `/`.[4]

## 5. Deployment environments

Use three logical environments even if the VPS provider gives you one machine.

| Environment | Hostname | Purpose | Database |
|---|---|---|---|
| Development | Local or managed preview | Feature development and automated tests | Development database or isolated test database |
| Staging | `staging.esutmarketplace.com` | Migration testing, OAuth, media, cron, and acceptance tests | Staging database or isolated schema |
| Production | `esutmarketplace.com` | Real users, sellers, orders, and administration | Production database with backups |

Do not let staging and production share the same database, OAuth secrets, JWT secret, Cloudinary folders, or cron task identifiers unless there is a documented reason and an explicit owner approval.

## 6. Domain and DNS preparation

Before installing the application, obtain the VPS public IPv4 address from Truehost. At the DNS provider controlling `esutmarketplace.com`, create:

| Record | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | VPS IPv4 address | Root domain |
| A | `www` | VPS IPv4 address | `www` hostname, if retained |
| A | `staging` | VPS IPv4 address | Staging hostname, if using the same VPS |

Do not add an `AAAA` record unless IPv6 is configured and tested on the VPS. A broken IPv6 record can make some users fail to connect even when IPv4 works.

During staging, use `staging.esutmarketplace.com`. During production cutover, change only the approved records, preserve the previous Manus URL, and reduce DNS TTL before the cutover if the provider allows it. DNS propagation is not a replacement for application rollback; retain the old deployment and be prepared to restore the previous record values.

## 7. Provision and harden Ubuntu

Select **Ubuntu 24.04 LTS** if it is available and supported by the provider. Ubuntu’s official Server documentation covers software management, SSH, firewalls, DNS, certificates, automatic updates, NGINX, and security administration.[2]

### 7.1 Initial access

Use the VPS provider’s temporary root credential or SSH key only for initial setup. Replace it with a dedicated deployment administrator and a separate application user.

From a trusted workstation:

```bash
ssh root@SERVER_IP
```

Update the system:

```bash
apt update
apt -y upgrade
apt -y install ca-certificates curl git unzip jq build-essential nginx ufw fail2ban unattended-upgrades
```

Set the server timezone explicitly and verify time synchronization:

```bash
timedatectl set-timezone Africa/Lagos
timedatectl status
```

### 7.2 Create a non-root deployment user

```bash
adduser deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

Add the deployment operator’s public SSH key to:

```text
/home/deploy/.ssh/authorized_keys
```

Then set permissions:

```bash
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Open a second terminal and verify that key-based login works before disabling root/password login:

```bash
ssh deploy@SERVER_IP
sudo -v
```

### 7.3 SSH hardening

Create a drop-in configuration:

```bash
sudo tee /etc/ssh/sshd_config.d/esut-marketplace.conf >/dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
EOF
```

Validate and reload SSH:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

Do not close the existing root session until the new deployment-user session has been tested.

### 7.4 Firewall

Allow only SSH, HTTP, and HTTPS to the public internet. The application port remains bound to localhost and is not opened publicly.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

If Truehost provides an external firewall, duplicate the policy there. Do not expose MySQL, Redis, or the Node.js port to the public internet unless there is a documented and secured reason.

### 7.5 Automatic security updates and intrusion controls

Enable the operating system’s security-update mechanism and review its behavior. Keep Fail2ban enabled for SSH and review its logs. Do not treat Fail2ban as a substitute for strong SSH keys, least privilege, application rate limits, or secure passwords.

## 8. Install Node.js and pnpm

Use the same major Node.js version used by the application’s development and validation environment. The current project was validated with Node.js 22.x. Confirm that Truehost supports Node.js 22 LTS before proceeding.

One reproducible approach is to install Node.js through the provider-approved NodeSource or Node Version Manager process, then enable the repository’s pinned pnpm version:

```bash
node --version
npm --version
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm --version
```

The expected outcome is Node.js 22.x and pnpm 10.4.1 or the exact approved versions used by the release pipeline. Do not mix npm and pnpm lockfiles or run production builds with an unreviewed package-manager version.

## 9. Application directory and release layout

Use a release layout so rollback does not require overwriting the currently running version:

```text
/srv/esut-marketplace/
  releases/
    20260907-commitsha/
  shared/
    .env.production
    uploads-not-used-as-source-of-truth/
  current -> releases/20260907-commitsha
```

Create it:

```bash
sudo mkdir -p /srv/esut-marketplace/releases /srv/esut-marketplace/shared
sudo chown -R deploy:deploy /srv/esut-marketplace
```

Clone the repository as the deployment user:

```bash
cd /srv/esut-marketplace/releases
git clone YOUR_PRIVATE_REPOSITORY_URL RELEASE_ID
cd RELEASE_ID
```

Use a pinned commit or signed release tag rather than deploying an unreviewed branch head.

Install and build:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm run build
```

After the build succeeds:

```bash
ln -sfn /srv/esut-marketplace/releases/RELEASE_ID /srv/esut-marketplace/current
```

The application’s production start command is:

```bash
NODE_ENV=production node dist/index.js
```

The application must use the hosting-provided `PORT` value. Do not hard-code a public port.

## 10. Production environment file

Create the protected environment file:

```bash
sudo install -d -m 750 -o root -g deploy /etc/esut-marketplace
sudo touch /etc/esut-marketplace/esut-marketplace.env
sudo chown root:deploy /etc/esut-marketplace/esut-marketplace.env
sudo chmod 640 /etc/esut-marketplace/esut-marketplace.env
sudo nano /etc/esut-marketplace/esut-marketplace.env
```

Use placeholders only in documentation. Real values must be entered privately:

```dotenv
NODE_ENV=production
PORT=3000
VITE_PUBLIC_SITE_URL=https://esutmarketplace.com
DATABASE_URL=mysql://APP_USER:APP_PASSWORD@DB_HOST:3306/DB_NAME
JWT_SECRET=GENERATE_A_LONG_RANDOM_SECRET
VITE_APP_ID=PRODUCTION_OAUTH_APP_ID
OAUTH_SERVER_URL=PRODUCTION_OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL=PRODUCTION_OAUTH_PORTAL_URL
OWNER_OPEN_ID=AUTHORIZED_OWNER_OPEN_ID
OWNER_NAME=AUTHORIZED_OWNER_NAME
BUILT_IN_FORGE_API_URL=IF_REQUIRED_BY_THE_DEPLOYMENT
BUILT_IN_FORGE_API_KEY=IF_REQUIRED_BY_THE_DEPLOYMENT
CLOUDINARY_CLOUD_NAME=PRODUCTION_CLOUD_NAME
CLOUDINARY_API_KEY=PRODUCTION_CLOUDINARY_KEY
CLOUDINARY_API_SECRET=PRODUCTION_CLOUDINARY_SECRET
RESEND_API_KEY=IF_LIVE_EMAIL_IS_AUTHORIZED
RESEND_FROM_EMAIL=VERIFIED_SENDER_ADDRESS
REDIS_URL=IF_REQUIRED_BY_THE_DEPLOYMENT
```

Generate a strong JWT secret on a trusted machine or directly on the VPS without printing it to a shell history file:

```bash
openssl rand -base64 48
```

Do not place the production environment file inside the Git repository. Do not expose it through NGINX. Do not include it in backups unless the backup is encrypted and access-controlled.

## 11. Database deployment

The current schema is MySQL/TiDB-oriented and contains users, profiles, sessions, security events, seller applications, stores, verifications, categories, listings, images, inventory, carts, orders, reservations, pickup coordination, offers, conversations, messages, notifications, reminders, search alerts, moderation, and audit records.[5]

### 11.1 Preferred database arrangement

Use a managed MySQL/TiDB-compatible database if the project owner can provide one. This keeps database storage, backups, replication, and recovery separate from the small 1-vCPU/2-GB application VPS.

### 11.2 Local MySQL arrangement

If using local MySQL on the VPS, install it only after accepting the operational burden:

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
sudo systemctl enable --now mysql
```

Create a database and least-privilege application user through the MySQL administrator account. Bind MySQL to localhost unless remote access is explicitly required. Do not expose port 3306 in UFW.

### 11.3 Migration procedure

Before applying schema changes:

1. Back up the current database.
2. Generate the migration in a development environment with `pnpm drizzle-kit generate`.
3. Inspect the generated SQL.
4. Confirm no destructive operation is accidental.
5. Apply the migration to staging.
6. Run the full test suite and read-only integrity checks.
7. Apply the approved migration to production during the planned release window.
8. Record migration name, timestamp, operator, database backup identifier, and rollback plan.

Do not run `pnpm db:push` blindly against production. That script combines migration generation and application and is not a substitute for an approved schema review.

### 11.4 Data verification

After migration or database cutover, compare counts and relationships for users, stores, active listings, listing images, media assets, inventory rows, orders, order items, sessions, security events, conversations, messages, reports, and audit records. Confirm that all active product images resolve and that no mock sellers, fake products, fake orders, or fake reviews are introduced.

## 12. Cloudinary and public media

Configure Cloudinary production credentials in the protected environment file. The application’s Cloudinary integration signs public-image uploads server-side and returns optimized URLs using bounded-width transformations for listing cards, product detail, avatars, and public artwork.[6]

Run the following staging checks:

| Test | Expected result |
|---|---|
| Product image upload | Upload succeeds through the server and returns an approved media reference |
| Listing card | Optimized image loads from Cloudinary |
| Product detail | Larger optimized transformation loads |
| Avatar | Only an approved public avatar can be made publicly visible |
| Invalid MIME type | Upload is rejected |
| Oversized upload | Upload is rejected or safely constrained |
| Deleted/archived media | Public response does not continue to expose it |
| Private evidence | Verification and unapproved evidence remain access-controlled |

Do not use the VPS local disk as the source of truth for public product images. Local disk can be used for temporary processing or logs, but product media metadata and public delivery should remain in the approved provider path.

## 13. Run the application with systemd

Create a systemd unit:

```bash
sudo tee /etc/systemd/system/esut-marketplace.service >/dev/null <<'EOF'
[Unit]
Description=ESUT Marketplace Node.js application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/srv/esut-marketplace/current
EnvironmentFile=/etc/esut-marketplace/esut-marketplace.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
KillSignal=SIGTERM
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF
```

Confirm the actual Node path with `command -v node`; adjust `ExecStart` if Node was installed elsewhere. Then start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now esut-marketplace
sudo systemctl status esut-marketplace --no-pager
sudo journalctl -u esut-marketplace -n 100 --no-pager
```

Test the local service before configuring NGINX:

```bash
curl -i http://127.0.0.1:3000/
```

The expected result is an HTTP 200 response with the application shell. If the process exits, inspect:

```bash
sudo journalctl -u esut-marketplace -e --no-pager
```

## 14. Configure NGINX reverse proxy

Create the HTTP/HTTPS site configuration:

```bash
sudo tee /etc/nginx/sites-available/esutmarketplace.com >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name esutmarketplace.com www.esutmarketplace.com;

    client_max_body_size 60m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/esutmarketplace.com /etc/nginx/sites-enabled/esutmarketplace.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The `X-Forwarded-Proto` header is important because the application uses the request’s secure/forwarded-HTTPS state when applying secure cookie and transport behavior. Do not proxy the Node.js port directly to the internet.

Test HTTP routing:

```bash
curl -I http://esutmarketplace.com/
```

## 15. Install and test HTTPS

Certbot’s official NGINX instructions require SSH/sudo access and an already reachable HTTP website on port 80. They show installing Certbot, running `certbot --nginx`, and testing renewal with `certbot renew --dry-run`.[4]

Install Certbot using the provider-supported method. The official snap-based sequence is:

```bash
sudo apt update
sudo apt install -y snapd
sudo snap install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
```

Request and install the certificate:

```bash
sudo certbot --nginx -d esutmarketplace.com -d www.esutmarketplace.com
```

Verify the certificate and renewal timer:

```bash
sudo certbot certificates
sudo certbot renew --dry-run
systemctl list-timers | grep -i certbot || true
```

Test HTTPS:

```bash
curl -I https://esutmarketplace.com/
curl -I https://www.esutmarketplace.com/
```

Confirm the browser shows a valid certificate, HTTP redirects to HTTPS, OAuth cookies are secure, and no mixed-content warning appears.

## 16. OAuth, cookies, and external domain cutover

Update the OAuth provider configuration before production cutover:

```text
https://esutmarketplace.com/api/oauth/callback
```

Keep the staging callback separate. After deployment:

1. Open a private browser window.
2. Visit `https://esutmarketplace.com`.
3. Sign in through OAuth.
4. Confirm the callback returns to `/` without a visible `?code=` parameter.
5. Confirm the user is authenticated.
6. Open `/account/security` and verify a real session appears.
7. Log out.
8. Confirm the protected account route redirects to `/login`.

If OAuth fails after domain cutover, inspect the provider callback allow-list, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, cookie attributes, NGINX forwarded headers, browser storage, and the server journal. Do not weaken state validation or change cookies to insecure settings as a quick fix.

## 17. Scheduled jobs and cron authentication

The application exposes these POST endpoints:

```text
POST /api/scheduled/product-reminders
POST /api/scheduled/reservation-expiry
```

Both endpoints authenticate the request through the application SDK, require a recognized cron identity and task UID, and compare that task UID with the corresponding `marketplaceSettings` record. The reservation-expiry endpoint returns a failure when partial processing fails.[7] [8]

This means an ordinary anonymous VPS cron request will not automatically work. Before enabling external VPS cron, confirm how the current SDK identifies cron requests. If the existing Manus cron identity is not available on the VPS, implement an approved VPS scheduler authentication adapter using a dedicated secret, constant-time comparison, request timestamp/replay protection, and a task-specific identifier. Do not make either endpoint public.

Once the authentication contract is available, create cron entries that call HTTPS endpoints at the approved frequency. Example structure only—do not use until the application’s actual cron authentication header is configured:

```cron
*/5 * * * * curl --fail --silent --show-error -X POST https://esutmarketplace.com/api/scheduled/product-reminders -H 'Authorization: Bearer REPLACE_WITH_CRON_CREDENTIAL' >> /var/log/esut-marketplace-reminders.log 2>&1
*/5 * * * * curl --fail --silent --show-error -X POST https://esutmarketplace.com/api/scheduled/reservation-expiry -H 'Authorization: Bearer REPLACE_WITH_CRON_CREDENTIAL' >> /var/log/esut-marketplace-reservations.log 2>&1
```

The exact frequency should be chosen with the business owner because it affects reminder timing and inventory reservation expiry. Test each job in staging, confirm idempotency, verify logs, and confirm invalid credentials return 403 rather than processing work.

## 18. Redis, email, and external integrations

### Redis/Upstash

If the current security-state or rate-limit implementation uses Redis/Upstash, provide the production connection string through the protected server environment and verify TLS connectivity from the VPS. Test login rate limiting, security-state reads/writes, session/security controls, and behavior during a Redis outage. Do not expose Redis publicly or commit its URL.

### Email

Password recovery, verification, security alerts, and notifications require a verified sender identity. Configure the approved email provider only after the sender domain is verified. Test delivery to ordinary recipient mailboxes, not only the account owner’s address. Verify SPF, DKIM, DMARC, bounce behavior, rate limits, and unsubscribe/notification policy before telling users that recovery email is live.

### Cloudflare or other proxy

If an external proxy is placed in front of the VPS, configure origin HTTPS, forwarded headers, caching exclusions for `/api/*` and OAuth, and correct WebSocket/polling behavior. Do not cache authenticated tRPC responses, OAuth callbacks, account routes, checkout routes, or security pages.

## 19. Backup and recovery

The VPS itself is not a complete backup strategy. Back up these objects separately:

| Object | Backup procedure | Restore test |
|---|---|---|
| Database | Encrypted daily dump or managed database backup; retain multiple generations offsite | Restore into isolated database and run integrity checks |
| Source | Git repository and immutable release commit/tag | Clone and rebuild from the recorded commit |
| Application release | Keep previous release directory until acceptance completes | Switch `current` symlink and restart systemd |
| NGINX/systemd | Back up `/etc/nginx`, systemd unit, firewall rules, and deployment scripts | Recreate proxy and service on staging VPS |
| Secrets inventory | Record variable names and rotation owner without storing secret values in the document | Reconstruct environment securely |
| Media metadata | Database records for Cloudinary IDs, URLs, status, and ownership | Verify known products and public/private media behavior |
| Cloudinary | Provider retention/export plan for critical public artwork | Verify delivery of restored/reference assets |
| Logs | Retain security, application, NGINX, cron, and backup logs | Confirm incident timeline can be reconstructed |

For a local MySQL database, an example logical backup is:

```bash
sudo mysqldump --single-transaction --routines --triggers --events DB_NAME | gzip > /secure-backup/esutmarketplace-$(date +%F).sql.gz
```

Encrypt or place the backup in access-controlled offsite storage. Do not leave only one unencrypted copy on the same VPS.

## 20. Monitoring and logs

Use systemd and NGINX logs as the first operational signals:

```bash
sudo systemctl is-active esut-marketplace
sudo journalctl -u esut-marketplace -f
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
sudo systemctl status nginx --no-pager
sudo systemctl status mysql --no-pager   # only if MySQL is local
```

Monitor at least:

| Signal | Action threshold |
|---|---|
| Node process down | Restart automatically; alert operator if repeated |
| HTTP 5xx increase | Inspect application journal, database, and external services |
| Database connection failures | Check database health, credentials, connection limits, and network |
| Missing `/assets/*` 404s | Investigate stale HTML, failed deployment, or incorrect release directory |
| OAuth failures | Check callback allow-list, cookies, forwarded HTTPS, and provider response |
| Cloudinary failures | Check credentials, outbound HTTPS, upload limits, and provider status |
| Cron failures | Check cron identity, task UID, database setting, and endpoint logs |
| Disk usage | Alert before the VPS is full; rotate logs and remove old releases safely |
| Memory pressure | Inspect Node, MySQL, NGINX, build jobs, and provider limits |

A future improvement should add a dedicated authenticated or internal health endpoint that checks the process without exposing sensitive database or provider details. Until then, use the homepage HTTP response, systemd status, logs, and authenticated smoke tests.

## 21. Deployment procedure for every release

The release procedure should be repeatable and reversible:

1. Merge and review the change in the repository.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm check`.
4. Run `pnpm test`.
5. Run `pnpm run build`.
6. Capture the commit SHA and release identifier.
7. Create a new release directory under `/srv/esut-marketplace/releases/`.
8. Build the release there.
9. Run staging smoke tests.
10. Switch the `current` symlink to the release.
11. Restart the systemd service.
12. Check `systemctl status` and `journalctl`.
13. Run production smoke tests.
14. Keep the previous release available until acceptance passes.
15. Record the release identifier, operator, time, migration status, and test result.

A simple controlled release switch is:

```bash
sudo ln -sfn /srv/esut-marketplace/releases/RELEASE_ID /srv/esut-marketplace/current
sudo systemctl restart esut-marketplace
sudo systemctl is-active --quiet esut-marketplace
curl --fail --silent --show-error https://esutmarketplace.com/ >/dev/null
```

## 22. Production smoke-test matrix

| Area | Test | Expected result |
|---|---|---|
| Public | Homepage, Explore, category, product, store | 200 response and correct content |
| Not found | Unknown product and store | Helpful not-found state, not blank loading |
| Auth | Login, OAuth callback, logout | Session starts and ends safely; no visible OAuth code |
| Buyer | Account, Security & devices, cart, checkout | Protected routes work and unauthenticated access redirects to `/login` |
| Seller | Seller dashboard, listing create/edit, inventory, orders | Ownership and verification rules hold |
| Admin | Admin control center, moderation, users, audit logs | Admin-only access remains enforced |
| Media | Approved Cloudinary images, avatars, private evidence | Public/private boundaries remain correct |
| Messaging | Buyer/seller conversation, message send, typing expiry | Participant authorization and state behavior work |
| Checkout | Reservation, order, pickup coordination, pickup code | Inventory and order transitions are correct |
| Scheduled work | Reminders and reservation expiry | Authenticated cron runs and logs successful results |
| Security | Headers, HTTPS, noindex, firewall, SSH | Expected controls are present |
| Mobile | 320, 360, 375, and 390px | No horizontal overflow or clipped workspace controls |

## 23. Cutover procedure

Perform cutover during a planned low-traffic window.

### Before cutover

Confirm that the VPS staging deployment passes the entire matrix. Take a final database backup. Freeze destructive data changes during the short cutover window. Record the current Manus deployment/version and DNS values. Confirm the owner has approved the domain change.

### Cutover

1. Confirm the VPS service is healthy through its temporary hostname.
2. Confirm HTTPS is valid for the production hostname or request the final certificate after DNS points correctly.
3. Update OAuth callback configuration.
4. Update `VITE_PUBLIC_SITE_URL`, canonical URLs, robots, sitemap, and any email absolute URLs.
5. Update DNS `A` records for `@` and `www` to the VPS IP.
6. Wait for the required DNS propagation and verify from multiple networks.
7. Confirm NGINX serves HTTPS and redirects HTTP.
8. Run the full production smoke-test matrix.
9. Verify a real buyer login and a real administrator login.
10. Confirm Cloudinary images, session security, orders, and scheduled endpoints.
11. Keep the previous deployment online until the acceptance window closes.

### After cutover

Monitor NGINX, systemd, database, and application logs continuously for the first release window. Confirm DNS, TLS, OAuth, image delivery, tRPC requests, and user reports. Do not remove the previous deployment or old DNS record until the rollback period has expired.

## 24. Rollback procedure

### Application-only rollback

If the new application build is faulty but the database schema remains compatible:

```bash
sudo ln -sfn /srv/esut-marketplace/releases/PREVIOUS_RELEASE /srv/esut-marketplace/current
sudo systemctl restart esut-marketplace
sudo journalctl -u esut-marketplace -n 100 --no-pager
```

Run the smoke-test matrix again.

### Database rollback

If a schema migration is incompatible, do not start the old application against the changed database unless compatibility is proven. Stop the application, preserve logs, restore the approved database backup into an isolated or production recovery target according to the incident plan, and then start the compatible application release.

### Domain rollback

If the VPS cannot serve production reliably, restore the previous DNS records or proxy target to the Manus deployment. Keep the VPS available for investigation. Do not delete its database or release directory until the incident has been reviewed.

### Security incident rollback

If credentials are exposed, rotate the affected secrets, invalidate sessions if required, pause the affected integration, preserve logs, and restore from a known-good release. Do not hide the incident by deleting audit records.

## 25. Go-live approval checklist

Production cutover requires explicit approval for each row:

| Gate | Approval evidence |
|---|---|
| VPS | Truehost plan, IP, OS, access, firewall, backup, and resource policy confirmed |
| Domain | `esutmarketplace.com` DNS access and owner authorization confirmed |
| Runtime | Node.js version, pnpm, systemd, NGINX, and process limits verified |
| Database | Compatible database, migration plan, backup, and restore test completed |
| OAuth | Production callback URL and allowed origins configured |
| Secrets | All required production values stored securely and separately from Git |
| Media | Cloudinary production credentials and public/private tests passed |
| Email | Verified sender domain and ordinary-recipient delivery tested, if enabled |
| Cron | Scheduler authentication adapter and task UID checks tested |
| Security | SSH, UFW, updates, HTTPS, headers, noindex, logs, and access controls verified |
| Operations | Monitoring, alerts, backups, restore, and rollback rehearsed |
| QA | Full tests, build, responsive route matrix, and authenticated smoke tests passed |
| Business | Owner approved payment method, pickup process, categories, retention, disputes, and go-live timing |

## 26. Known limitations and deferred work

The current codebase was designed and tested in the managed Manus environment. External VPS deployment may require a small infrastructure adapter for cron authentication because the scheduled endpoints expect an authenticated cron identity and matching task UID. This must be implemented and tested before VPS cron can safely replace the managed scheduler.

The current source also contains public URLs tied to the Manus hostname. The custom-domain migration must introduce a public-site configuration and update canonical URL, robots, sitemap, OAuth, email, and any absolute-link behavior before cutover.

The Truehost VPS plan is a small shared-resource starting point. It may be adequate for early traffic, but it should not host a heavy local database, large build jobs, high-concurrency messaging, and growing marketplace traffic indefinitely without monitoring and capacity planning.

## References

[1]: https://truehost.com.ng/cloud/cart.php?a=confproduct&i=0 — Truehost Cloud VPS 1 configuration page; current displayed VPS specifications and billing options reviewed on 2026-09-07.  
[2]: https://ubuntu.com/server/docs/ — Official Ubuntu Server documentation covering software management, SSH, firewalls, DNS, certificates, updates, NGINX, and security.  
[3]: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/ — Official NGINX reverse-proxy documentation.  
[4]: https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal — Official Certbot NGINX instructions and renewal test procedure.  
[5]: `drizzle/schema.ts` — Current ESUT Marketplace database schema and domain statuses.  
[6]: `server/cloudinary.ts` — Current Cloudinary signed-upload and optimized public-media integration.  
[7]: `server/productReminderSchedule.ts` — Current authenticated product-reminder scheduler contract.  
[8]: `server/reservationExpirySchedule.ts` — Current authenticated reservation-expiry scheduler contract.  
[9]: `package.json` — Current build, test, start, migration, and Cloudflare staging scripts.  
[10]: `server/_core/index.ts` — Current Express middleware order, OAuth, tRPC, scheduled endpoints, and static delivery.  
[11]: `server/_core/oauth.ts` — Current OAuth callback, state-cookie validation, tracked-session creation, and redirect behavior.  
[12]: `server/_core/securityHeaders.ts` — Current browser security headers, HSTS, and route-aware crawler protection.  
[13]: `server/_core/vite.ts` — Current static asset cache, SPA fallback, and missing hashed-asset 404 behavior.

> This runbook is an engineering and deployment guide. It is not legal, tax, privacy, consumer-protection, university-policy, or provider-contract advice. The ESUT project owner and qualified technical/security reviewers must approve the final infrastructure and operational policies.
