#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Default values
SSH_USER="ubuntu"
SSH_KEY=""
EC2_IP=""

# Usage information
usage() {
  echo "Usage: $0 -i <ec2_ip> -k <ssh_key_path> [-u <ssh_user>]"
  echo "  -i : Public IP or domain of the EC2 instance (Required)"
  echo "  -k : Path to the private SSH key file (Required)"
  echo "  -u : SSH username (Optional, defaults to 'ubuntu')"
  exit 1
}

# Parse options
while getopts "i:k:u:" opt; do
  case "$opt" in
    i) EC2_IP="$OPTARG" ;;
    k) SSH_KEY="$OPTARG" ;;
    u) SSH_USER="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$EC2_IP" ] || [ -z "$SSH_KEY" ]; then
  echo "Error: Missing required arguments."
  usage
fi

echo "=============================================="
echo "   CarrierBuddy Deployment Script"
echo "=============================================="
echo "Target: ${SSH_USER}@${EC2_IP}"
echo "Key: ${SSH_KEY}"

# 1. Build client bundle
echo "[1/4] Building client static assets with relative backend endpoints..."
cd client
VITE_API_BASE_URL="" VITE_AI_API_BASE_URL="" npm run build
cd ..

# 2. Upload Nginx setup script and run it
echo "[2/4] Uploading and running setup-ec2.sh on remote server..."
scp -o StrictHostKeyChecking=no -i "$SSH_KEY" setup-ec2.sh "${SSH_USER}@${EC2_IP}:/home/${SSH_USER}/setup-ec2.sh"
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${SSH_USER}@${EC2_IP}" "chmod +x setup-ec2.sh && ./setup-ec2.sh"

# 3. Synchronize application files
echo "[3/4] Copying application files to /var/www/carrierbuddy/..."

# Check if rsync is available, if not fallback to scp
if command -v rsync >/dev/null 2>&1; then
  echo "Using rsync to transfer files..."
  rsync -avz -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='__pycache__' \
    client/ "${SSH_USER}@${EC2_IP}:/var/www/carrierbuddy/client/"

  rsync -avz -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='__pycache__' \
    server-express/ "${SSH_USER}@${EC2_IP}:/var/www/carrierbuddy/server-express/"

  rsync -avz -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='__pycache__' \
    server-fastapi/ "${SSH_USER}@${EC2_IP}:/var/www/carrierbuddy/server-fastapi/"
else
  echo "rsync not found, using scp..."
  # Create directories remotely first
  ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${SSH_USER}@${EC2_IP}" "mkdir -p /var/www/carrierbuddy/client/dist /var/www/carrierbuddy/server-express /var/www/carrierbuddy/server-fastapi"
  
  # Copy files
  scp -o StrictHostKeyChecking=no -i "$SSH_KEY" -r client/dist "${SSH_USER}@${EC2_IP}:/var/www/carrierbuddy/client/"
  scp -o StrictHostKeyChecking=no -i "$SSH_KEY" -r server-express/* "${SSH_USER}@${EC2_IP}:/var/www/carrierbuddy/server-express/"
  scp -o StrictHostKeyChecking=no -i "$SSH_KEY" -r server-fastapi/* "${SSH_USER}@${EC2_IP}:/var/www/carrierbuddy/server-fastapi/"
fi

# 4. Final step reminder
echo "[4/4] Code files successfully uploaded!"
echo "=============================================="
echo "Next Steps to start the servers on EC2:"
echo "1. SSH into the instance:"
echo "   ssh -i $SSH_KEY ${SSH_USER}@${EC2_IP}"
echo ""
echo "2. Inside the instance, navigate to /var/www/carrierbuddy/server-express:"
echo "   - Create and populate the .env file (SMTP, DB secrets, JWT secret, OAuth config)"
echo "   - Run: npm install"
echo "   - Run database migrations: npx prisma db push"
echo "   - Build & Start: npm run build && pm2 start dist/index.js --name 'carrierbuddy-express'"
echo ""
echo "3. Inside the instance, navigate to /var/www/carrierbuddy/server-fastapi:"
echo "   - Create and populate the .env file (GEMINI_API_KEY)"
echo "   - Run: python3 -m venv venv && ./venv/bin/pip install -r requirements.txt"
echo "   - Start: pm2 start './venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000' --name 'carrierbuddy-fastapi'"
echo ""
echo "4. Save the PM2 process list to persist on reboot:"
echo "   pm2 save"
echo "=============================================="
