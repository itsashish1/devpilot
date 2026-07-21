#!/bin/bash
# CarrierBuddy EC2 Fix Script
# Run this on the EC2 server to fix Nginx routing + check PM2 services
set -e

echo "=============================================="
echo "   CarrierBuddy EC2 Nginx Fix"
echo "=============================================="

# Fix Nginx config — /api/ai MUST come before /api
echo "[1/3] Writing fixed Nginx config..."
sudo tee /etc/nginx/sites-available/carrierbuddy > /dev/null << 'EOF'
server {
    listen 80;
    server_name itsmeashishy.live www.itsmeashishy.live _;

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
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "[2/3] Testing and reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "[3/3] Checking PM2 services..."
pm2 status

echo "=============================================="
echo "Done! Testing endpoints..."
sleep 1
echo "Express health: $(curl -s http://localhost:5000/health || echo 'FAILED')"
echo "FastAPI health: $(curl -s http://localhost:8000/health || echo 'FAILED')"
echo "Nginx /api/health: $(curl -s http://localhost/api/health || echo 'FAILED')"
echo "Nginx /api/ai/health: $(curl -s http://localhost/api/ai/health || echo 'FAILED')"
echo "=============================================="
