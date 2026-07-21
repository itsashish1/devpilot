#!/bin/bash
# CarrierBuddy EC2 — SSL/HTTPS Setup Script
# Run this on the EC2 server to enable HTTPS via Let's Encrypt + Certbot
# Prerequisites: NGINX running, domain DNS A record pointing to EC2 IP
set -e

DOMAIN="itsmeashishy.live"
WWW_DOMAIN="www.itsmeashishy.live"
EMAIL="support@itsmeashishy.live"   # Change to your real email for SSL alerts

echo "=============================================="
echo "   CarrierBuddy — SSL/HTTPS Setup"
echo "   Domain: $DOMAIN"
echo "=============================================="

# Step 1: Install Certbot
echo ""
echo "[1/5] Installing Certbot + NGINX plugin..."
sudo apt-get update -qq
sudo apt-get install -y certbot python3-certbot-nginx

# Step 2: Write NGINX config with HTTP first (needed for certbot verification)
echo ""
echo "[2/5] Writing base NGINX config for domain verification..."
sudo tee /etc/nginx/sites-available/carrierbuddy > /dev/null << 'NGINX_CONF'
server {
    listen 80;
    server_name itsmeashishy.live www.itsmeashishy.live;

    root /var/www/carrierbuddy/client/dist;
    index index.html;

    # Static frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # FastAPI — MUST be before /api to avoid prefix collision
    location /api/ai/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONF

# Enable site
sudo ln -sf /etc/nginx/sites-available/carrierbuddy /etc/nginx/sites-enabled/carrierbuddy
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload NGINX
sudo nginx -t && sudo systemctl reload nginx
echo "✅ NGINX reloaded with base HTTP config"

# Step 3: Obtain SSL Certificate via Certbot
echo ""
echo "[3/5] Obtaining SSL certificate from Let's Encrypt..."
echo "      (Domain must be pointing to this server's IP)"
sudo certbot --nginx \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect

echo "✅ SSL certificate obtained and NGINX updated with HTTPS"

# Step 4: Verify NGINX config after certbot modification
echo ""
echo "[4/5] Verifying NGINX configuration..."
sudo nginx -t && sudo systemctl reload nginx
echo "✅ NGINX running with HTTPS + HTTP redirect"

# Step 5: Setup auto-renewal cron job
echo ""
echo "[5/5] Setting up SSL auto-renewal..."
# Certbot installs a systemd timer automatically, but also add a cron just in case
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
echo "✅ Auto-renewal cron job added"

# Final verification
echo ""
echo "=============================================="
echo "  Testing endpoints..."
echo "=============================================="
sleep 2
echo "HTTP health (should redirect to HTTPS):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/api/health || echo "FAILED"

echo "HTTPS health check (via domain):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://$DOMAIN/api/health || echo "FAILED (if this fails, check DNS propagation)"

echo "FastAPI health:"
curl -s http://localhost:8000/health || curl -s http://localhost:8000/ | head -c 100

echo ""
echo "=============================================="
echo "  SSL Setup Complete!"
echo "  Your site is now accessible at:"
echo "  ✅ https://$DOMAIN"
echo "  ✅ https://$WWW_DOMAIN"
echo "  HTTP → HTTPS redirect is active"
echo "  Certificate renews automatically"
echo "=============================================="
