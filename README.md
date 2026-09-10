# ESUT Marketplace

ESUT Marketplace is a React 19, Vite, Express, tRPC, Drizzle ORM, and MySQL/TiDB-backed multi-vendor marketplace for the ESUT community. This README is the operational guide for deploying the application on an **InterServer VPS Slice 1 using the Ubuntu 26.04 + NodeJS template**.

> **Important:** The InterServer NodeJS template is a hardened starting point, not a finished production deployment. InterServer states that the template provides UFW, fail2ban, automatic security updates, and random administrator credentials, while application configuration, secrets, backups, monitoring, and ongoing maintenance remain the customer’s responsibility. [1]

## 1. Deployment architecture

The production request path should be:

```text
Browser
  │
  ├── HTTPS :443 / HTTP :80
  ▼
Nginx reverse proxy
  │
  └── http://127.0.0.1:3000
        ▼
      Node.js production process
      dist/index.js
        ├── React/Vite static files in dist/public
        ├── tRPC API under /api/trpc
        ├── OAuth callback under /api/oauth/callback
        └── Health check at /healthz

External services: MySQL/TiDB database, Cloudinary, Upstash Redis, OAuth, and Resend when enabled.
```

The application must bind to localhost on the VPS. Nginx is the only service exposed publicly for normal web traffic. The database, Redis credentials, Cloudinary credentials, OAuth credentials, and JWT secret must never be committed to Git or placed in the frontend bundle.

## 2. VPS capacity and suitability

InterServer currently lists Slice 1 as **1 CPU core, 2 GB memory, 40 GB SSD, 2 TB transfer, KVM compute, and root access**. [2] This is a reasonable starting point for staging and a small initial production launch, but it is not a capacity guarantee. Monitor memory, disk, CPU, database latency, and request volume. Add slices before the VPS becomes memory-constrained or before build and runtime workloads compete for the same resources.

| Requirement | Initial decision |
|---|---|
| Provider | InterServer VPS |
| Plan | Slice 1 |
| Template | Ubuntu 26.04 + NodeJS, as shown in the InterServer order flow |
| Application mode | Node.js production process |
| Application port | `127.0.0.1:3000` unless `PORT` is intentionally changed |
| Public web server | Nginx on ports 80 and 443 |
| Process supervision | systemd recommended; PM2 is an acceptable alternative |
| Public domain | `esutmarketplace.com` and `www.esutmarketplace.com` if desired |
| Build output | `dist/public` and `dist/index.js` |
| Database | Existing compatible MySQL/TiDB service; do not put production data in the VPS without a backup plan |

## 3. Before ordering the VPS

Prepare the following before creating the server:

| Item | Required value or action |
|---|---|
| Domain | Access to the DNS provider for `esutmarketplace.com` |
| Repository | Access to the Git repository connected to ESUT Marketplace |
| Database | A production MySQL/TiDB connection string and a tested backup |
| Cloudinary | Cloud name, API key, API secret, and approved upload/delivery configuration |
| Redis | Upstash Redis URL or the configured security-state Redis connection |
| OAuth | Production callback URL and provider configuration for the final domain |
| JWT | A long random production-only `JWT_SECRET` |
| Email | Resend values only if a verified sending domain and delivery path are approved |
| Administrator | A secure administrator account and an independent recovery method |

Do not paste secrets into shell history, Git, support tickets, screenshots, or the README. Use a root-owned environment file with restrictive permissions.

## 4. Provision the InterServer VPS

1. Sign in to the InterServer account.
2. Open the VPS order flow and choose the **NodeJS template** or the Ubuntu 26.04 + NodeJS template shown in your account. InterServer’s public NodeJS template is identified as template ID 8096. [1]
3. Select **1 Slice** for the initial environment if the workload is still staging or small-scale production.
4. Confirm the actual operating-system release, public IPv4 address, hostname, root or administrator access method, and installed Node.js version after provisioning. Do not assume the checkout label and the installed package version are identical.
5. Save the initial credentials in a password manager and rotate them after the first successful login.
6. Record the server IP in a private deployment note. Do not publish it in frontend code.

InterServer describes the template as cloud-init based and hardened with UFW, fail2ban, and automatic security updates. [1] Still verify each control on the actual VPS before production traffic is enabled.

## 5. First SSH login and server hardening

From your computer, connect using the administrator credentials supplied by InterServer:

```bash
ssh root@SERVER_IP
```

Replace `SERVER_IP` with the real VPS address. Immediately inspect the baseline:

```bash
cat /etc/os-release
node --version
npm --version
ufw status verbose
systemctl status fail2ban --no-pager || true
systemctl status unattended-upgrades --no-pager || true
free -h
df -h
```

Create a non-root deployment user and grant administrative access:

```bash
adduser esutdeploy
usermod -aG sudo esutdeploy
```

From your own computer, copy your SSH public key to the new user:

```bash
ssh-copy-id esutdeploy@SERVER_IP
```

Test the new login in a second terminal before closing the root session:

```bash
ssh esutdeploy@SERVER_IP
sudo -v
```

After confirming the new account works, disable password-based root SSH login. Edit the SSH daemon configuration carefully:

```bash
sudo nano /etc/ssh/sshd_config
```

Set or confirm:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Validate and reload SSH without closing the working session:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

Keep an existing authenticated session open until a new key-based session succeeds.

## 6. Firewall and operating-system updates

Allow SSH, HTTP, and HTTPS only:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status numbered
```

Do **not** expose port 3000 publicly. The Node.js process should listen on localhost only. Do not expose MySQL or Redis to the public Internet unless a specific architecture requires it and the access list is restricted.

Apply updates and reboot only during a controlled maintenance window:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

Reconnect after the reboot and verify SSH, UFW, fail2ban, and the Node.js runtime again.

## 7. Install or verify the Node.js runtime

The template may already include Node.js. Verify first:

```bash
node --version
npm --version
corepack --version || true
```

This repository declares pnpm in `package.json` and includes a lockfile. Enable the package manager without replacing the repository lockfile:

```bash
sudo corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm --version
```

If the template provides a different Node.js major version, stop and confirm compatibility before deploying. The application should run on the Node.js version used for the validated build; do not silently switch runtimes during cutover.

## 8. Create the application directories

Use a release directory and a stable `current` symlink so rollback does not require deleting the live application:

```bash
sudo mkdir -p /var/www/esut-marketplace/releases
sudo mkdir -p /var/www/esut-marketplace/shared
sudo chown -R esutdeploy:esutdeploy /var/www/esut-marketplace
```

The recommended layout is:

```text
/var/www/esut-marketplace/
├── current -> releases/RELEASE_ID
├── releases/
│   ├── RELEASE_ID/
│   └── previous-release/
└── shared/
    └── .env.production
```

## 9. Deploy the repository

Clone the repository into a new release directory as the deployment user. Use the authenticated Git method approved for the repository; never put a long-lived private token into a shell command or committed file.

```bash
cd /var/www/esut-marketplace/releases
git clone YOUR_PRIVATE_REPOSITORY_URL RELEASE_ID
cd RELEASE_ID
corepack enable
pnpm install --frozen-lockfile
pnpm run build
```

Replace `YOUR_PRIVATE_REPOSITORY_URL` and `RELEASE_ID`. The build must create both of these files:

```text
dist/index.js
dist/public/index.html
```

Verify the release before activation:

```bash
pnpm run deploy:verify
```

If this command reports a missing artifact, do not restart production. Fix the build or deployment directory first.

## 10. Configure production environment variables

Create the shared environment file outside the release directory:

```bash
sudo -u esutdeploy nano /var/www/esut-marketplace/shared/.env.production
sudo chmod 600 /var/www/esut-marketplace/shared/.env.production
```

At minimum, review and populate the values required by the current application:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=REPLACE_WITH_PRODUCTION_DATABASE_URL
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
VITE_APP_ID=REPLACE_WITH_OAUTH_APP_ID
OAUTH_SERVER_URL=REPLACE_WITH_OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL=REPLACE_WITH_OAUTH_PORTAL_URL
OWNER_OPEN_ID=REPLACE_WITH_OWNER_OPEN_ID
OWNER_NAME=ESUT Marketplace
BUILT_IN_FORGE_API_URL=REPLACE_IF_USED
BUILT_IN_FORGE_API_KEY=REPLACE_IF_USED
VITE_FRONTEND_FORGE_API_URL=REPLACE_IF_USED
VITE_FRONTEND_FORGE_API_KEY=REPLACE_IF_USED
CLOUDINARY_CLOUD_NAME=REPLACE_WITH_CLOUD_NAME
CLOUDINARY_API_KEY=REPLACE_WITH_API_KEY
CLOUDINARY_API_SECRET=REPLACE_WITH_API_SECRET
REDIS_URL=REPLACE_WITH_REDIS_URL
RESEND_API_KEY=REPLACE_IF_APPROVED
RESEND_FROM_EMAIL=REPLACE_IF_APPROVED
```

The exact environment contract must be checked against `server/_core/env.ts` and the current deployment runbook before go-live. Never expose server-only secrets through `VITE_` variables unless the value is intentionally public.

## 11. Configure systemd

Create a service unit:

```bash
sudo nano /etc/systemd/system/esut-marketplace.service
```

Use this template and adjust only the paths if your deployment directory differs:

```ini
[Unit]
Description=ESUT Marketplace Node.js application
After=network.target

[Service]
Type=simple
User=esutdeploy
Group=esutdeploy
WorkingDirectory=/var/www/esut-marketplace/current
EnvironmentFile=/var/www/esut-marketplace/shared/.env.production
ExecStart=/usr/bin/node /var/www/esut-marketplace/current/dist/index.js
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Confirm the actual Node path with `command -v node`. If it is not `/usr/bin/node`, use the real absolute path or a systemd-compatible environment configuration.

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable esut-marketplace
sudo systemctl start esut-marketplace
sudo systemctl status esut-marketplace --no-pager
```

Inspect logs:

```bash
sudo journalctl -u esut-marketplace -n 100 --no-pager
sudo journalctl -u esut-marketplace -f
```

Test the application locally on the VPS:

```bash
curl -i http://127.0.0.1:3000/healthz
```

The expected response is HTTP 200 with JSON containing `"ok":true`.

## 12. Configure Nginx

Install Nginx if the template does not already provide it:

```bash
sudo apt install -y nginx
```

Create the site configuration:

```bash
sudo nano /etc/nginx/sites-available/esutmarketplace.com
```

Use:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name esutmarketplace.com www.esutmarketplace.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

Enable and test it:

```bash
sudo ln -s /etc/nginx/sites-available/esutmarketplace.com /etc/nginx/sites-enabled/esutmarketplace.com
sudo nginx -t
sudo systemctl reload nginx
```

Do not request the certificate until DNS points to the VPS and HTTP reaches Nginx.

## 13. DNS and HTTPS

At the domain DNS provider, create:

| Record | Name | Value |
|---|---|---|
| A | `@` | VPS public IPv4 address |
| A | `www` | VPS public IPv4 address, or a CNAME to the apex if preferred |

Verify propagation from multiple networks:

```bash
dig +short esutmarketplace.com
curl -I http://esutmarketplace.com
```

Install Certbot and request the certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d esutmarketplace.com -d www.esutmarketplace.com
sudo certbot renew --dry-run
```

Confirm HTTPS, HTTP-to-HTTPS redirect, and the health endpoint through the public domain:

```bash
curl -I https://esutmarketplace.com
curl -i https://esutmarketplace.com/healthz
```

## 14. OAuth, database, Cloudinary, Redis, and email

Before production cutover, update the OAuth provider with the final production callback URL used by the application, normally:

```text
https://esutmarketplace.com/api/oauth/callback
```

Confirm the database user has only the required privileges, the database backup can be restored, and all schema changes have been applied before switching traffic.

Confirm Cloudinary delivery URLs work for existing approved public product images, transformed thumbnails, logo assets, and eligible public avatars. Confirm that the VPS never stores Cloudinary API secrets in frontend code.

Confirm the Redis URL is reachable from the VPS and that the security-state operations work. Do not open Redis to the world. If the service is Upstash, use its TLS connection URL and provider access controls.

Keep transactional email disabled or limited until a verified sending domain and approved delivery path are available. The application documentation already records this boundary; do not claim that password recovery or verification email delivery is live unless it has been tested with an authorized recipient.

## 15. Database migration procedure

Do not run destructive migrations against production without a verified backup and an approved change window. For a release that contains only additive schema changes:

```bash
cd /var/www/esut-marketplace/current
set -a
. /var/www/esut-marketplace/shared/.env.production
set +a
pnpm run db:migrate
```

The current repository contains Drizzle schema and migration files. Review the generated SQL and provider compatibility before applying any migration. For a new environment, restore or provision the database first, then apply migrations in dependency order.

## 16. Release and rollback procedure

Build each release in a new directory:

```bash
cd /var/www/esut-marketplace/releases
RELEASE_ID=$(date -u +%Y%m%d%H%M%S)
git clone YOUR_PRIVATE_REPOSITORY_URL "$RELEASE_ID"
cd "$RELEASE_ID"
pnpm install --frozen-lockfile
pnpm run release:check
pnpm run deploy:verify
```

Activate it only after the checks pass:

```bash
ln -sfn "/var/www/esut-marketplace/releases/$RELEASE_ID" /var/www/esut-marketplace/current
sudo systemctl restart esut-marketplace
curl -fsS https://esutmarketplace.com/healthz
```

For rollback, point `current` to the last known-good release and restart:

```bash
ln -sfn /var/www/esut-marketplace/releases/LAST_KNOWN_GOOD_RELEASE /var/www/esut-marketplace/current
sudo systemctl restart esut-marketplace
curl -fsS https://esutmarketplace.com/healthz
```

If a migration changed the database schema, application rollback may require a compatible forward fix or a separately tested database restore. Never assume that reverting application files alone reverses a database migration.

## 17. Backups and monitoring

At minimum, maintain separate backups for the database, deployment configuration, environment secret recovery material, and any VPS-local operational files. Test restoration before production launch and periodically thereafter. Cloudinary remains the source of truth for approved public media; do not treat a local image folder as a backup.

Monitor:

```bash
sudo systemctl is-active esut-marketplace
sudo systemctl is-active nginx
curl -fsS https://esutmarketplace.com/healthz
free -h
df -h
sudo journalctl -u esut-marketplace --since "1 hour ago" --no-pager
sudo journalctl -u nginx --since "1 hour ago" --no-pager
```

Set an operational threshold for disk usage and memory usage before launch. On Slice 1, a sustained memory shortage is a scale-up signal, not a reason to keep restarting the application.

## 18. Go-live acceptance checklist

| Check | Required result |
|---|---|
| SSH | Key-based deployment user works; root/password login policy is verified |
| Firewall | Only required public ports are open |
| Node.js | Validated Node.js version is installed and recorded |
| Build | `pnpm run release:check` passes |
| Artifact | `pnpm run deploy:verify` passes |
| Process | systemd service is enabled and active |
| Local health | `curl http://127.0.0.1:3000/healthz` returns 200 |
| Public health | `curl https://esutmarketplace.com/healthz` returns 200 |
| HTTPS | Certificate is valid and renewal dry-run passes |
| Database | Read/write smoke checks pass and backup exists |
| OAuth | Final callback URL works without a visible code query left in the address bar |
| Media | Approved Cloudinary product images render on desktop and mobile |
| Auth | Login, logout, protected-route redirects, and session security work |
| Marketplace | Browse, product detail, cart, checkout, seller, and admin smoke paths pass |
| Rollback | Previous release can be activated and restarted |

## 19. Managed Manus deployment remains available

The repository is also compatible with the managed Manus WebDev environment. The managed path remains the simpler option when the goal is integrated build, secrets, HTTPS, checkpoint, rollback, and hosting operations. The InterServer VPS path is appropriate when you intentionally want root-level operating-system control and accept responsibility for server security, upgrades, monitoring, backups, and incident response.

Do not mix the two production sources of truth. Choose one production database, one canonical domain, one OAuth callback set, and one deployment owner before cutover.

## References

[1]: https://www.interserver.net/vps/marketplace/nodejs-vps.html "InterServer NodeJS VPS Template"

[2]: https://www.interserver.net/vps/ubuntu-vps.html "InterServer Ubuntu Cloud Compute VPS"
