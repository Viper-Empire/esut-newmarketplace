# VPS deployment research findings — 2026-09-07

## Truehost Cloud VPS 1
Source: https://truehost.com.ng/cloud/cart.php?a=confproduct&i=0

The current configuration page showed 1 vCPU, 2 GB RAM, 50 GB SSD, 1 TB transfer, Europe/USA data centers, Linux OS choices, and monthly pricing of ₦10,997. The selector included Ubuntu 24.04, Ubuntu 22.04, Debian 12, Debian 13, and other Linux options. Optional items included an additional IPv4 address and an AskSSL Premium SSL certificate. The page did not establish CPU burst policy, backup retention, monitoring, firewall management, Node.js process limits, database limits, or a production SLA.

## Official operating-system and proxy references

Ubuntu Server documentation: https://ubuntu.com/server/docs/

The official documentation includes server installation, software management, SSH, firewalls, DNS, certificates, automatic updates, MySQL/PostgreSQL, NGINX, and security guidance.

NGINX reverse-proxy guide: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/

The guide explains that NGINX receives a client request, passes it to a specified proxied server, receives the response, and sends the response back. It documents `proxy_pass`, `location`, and request-header forwarding concepts relevant to routing `esutmarketplace.com` to a local Node.js service.

Certbot NGINX instructions: https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal

The official instructions require SSH/sudo access and an HTTP site reachable on port 80 for the standard NGINX flow. They show snap installation, `sudo certbot --nginx`, and `sudo certbot renew --dry-run` for renewal testing.
