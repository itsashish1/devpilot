#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=============================================="
echo "   CarrierBuddy EC2 Setup Script"
echo "=============================================="

# 1. Update package list
echo "[1/7] Updating system package list..."
sudo apt-get update -y

# 2. Install Node.js (v20)
echo "[2/7] Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Python 3, venv, and pip
echo "[3/7] Installing Python and virtual environments..."
sudo apt-get install -y python3 python3-venv python3-pip

# 4. Install PM2 globally
echo "[4/7] Installing PM2 global process manager..."
sudo npm install -g pm2

# 5. Install and configure Nginx
echo "[5/7] Installing and configuring Nginx..."
sudo apt-get install -y nginx

# Create directory and set permissions for deployment
sudo mkdir -p /var/www/carrierbuddy
sudo chown -R $USER:$USER /var/www/

# Write Nginx configuration
sudo tee /etc/nginx/sites-available/carrierbuddy > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/carrierbuddy/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ai {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/carrierbuddy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 6. Verify installations
echo "[6/7] Verifying installed software versions..."
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "PM2: $(pm2  -v || echo 'installed')"
echo "Python: $(python3 --version)"
echo "Nginx is running on port 80."

echo "=============================================="
echo "Setup Complete!"
echo "Make sure to:"
echo "1. Copy the application to /var/www/carrierbuddy"
echo "2. Configure .env files in server-express and server-fastapi"
echo "3. Run Express: npm run prisma:generate && npm run build && pm2 start dist/index.js --name 'carrierbuddy-express'"
echo "4. Run FastAPI: python3 -m venv venv && ./venv/bin/pip install -r requirements.txt && pm2 start './venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000' --name 'carrierbuddy-fastapi'"
echo "=============================================="
