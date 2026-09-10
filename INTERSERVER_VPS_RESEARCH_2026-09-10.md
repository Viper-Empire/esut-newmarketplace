# InterServer VPS findings — 2026-09-10

## Verified provider facts

InterServer’s official NodeJS VPS template page identifies the NodeJS template as ID 8096 and describes it as a cloud-init starting point with UFW, fail2ban, and automatic security updates, plus random administrator credentials. The page explicitly states that application configuration, secrets, integrations, backups, monitoring, and ongoing maintenance remain the customer’s responsibility. Source: https://www.interserver.net/vps/marketplace/nodejs-vps.html

InterServer’s official Ubuntu cloud compute page lists Slice 1 as 1 core, 2 GB memory, 40 GB SSD, 2 TB transfer, KVM compute, and root access. The page states that each slice adds CPU, memory, SSD, and transfer and that slices can be scaled. Source: https://www.interserver.net/vps/ubuntu-vps.html

## Deployment consequences

The application should be deployed as a conventional VPS service rather than DirectAdmin shared hosting. The target architecture is Node.js production process supervised by systemd or PM2, bound to localhost, exposed through Nginx on ports 80 and 443, protected by UFW, and secured with TLS after DNS points to the VPS. The README must treat the NodeJS template as a starting baseline, not as a completed production deployment.

Slice 1 is suitable for an initial staging deployment and a small production launch only if build jobs, database placement, traffic, logs, and memory usage are monitored. The guide must avoid promising capacity and must document the upgrade path to additional slices.

## Explicit unknowns to confirm at order time

The exact Ubuntu release shown in checkout, public IPv4 assignment, reverse-DNS availability, backup options and retention, support boundaries, and the final Node.js version installed by template 8096 must be confirmed in the InterServer account after provisioning. The guide must verify these values on the actual VPS instead of assuming them from marketing pages.
