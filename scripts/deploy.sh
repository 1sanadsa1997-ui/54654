#!/bin/bash
set -e

echo "🚀 PromoHive Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
apt install -y nginx

# Install Certbot for SSL
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p /var/www/promohive
cd /var/www/promohive

# Copy project files (assuming current directory is the project)
echo -e "${YELLOW}📋 Copying project files...${NC}"
cp -r /home/ubuntu/promohive-final/* /var/www/promohive/

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd /var/www/promohive/server
npm install

cd /var/www/promohive/client
npm install

# Build client
echo -e "${YELLOW}🔨 Building client...${NC}"
npm run build

# Build server
echo -e "${YELLOW}🔨 Building server...${NC}"
cd /var/www/promohive/server
npm run build

# Setup Prisma
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Configure Nginx
echo -e "${YELLOW}⚙️  Configuring Nginx...${NC}"
cp /var/www/promohive/nginx.conf /etc/nginx/sites-available/promohive
ln -sf /etc/nginx/sites-available/promohive /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Setup SSL with Certbot
echo -e "${YELLOW}🔐 Setting up SSL...${NC}"
certbot --nginx -d globalpromonetwork.store -d www.globalpromonetwork.store --non-interactive --agree-tos -m promohive@globalpromonetwork.store

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application...${NC}"
cd /var/www/promohive
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now running at https://globalpromonetwork.store${NC}"

