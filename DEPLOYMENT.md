# GrandPro HMSO Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Production Setup](#production-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Server**: Ubuntu 20.04+ or similar Linux distribution
- **CPU**: Minimum 4 cores, recommended 8 cores
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: Minimum 100GB SSD
- **Network**: Stable internet with static IP

### Software Requirements
- Node.js v18.x or higher
- npm v8.x or higher
- PostgreSQL 14+ or Neon Database account
- Nginx 1.18+
- PM2 for process management
- Git
- SSL certificate (Let's Encrypt or commercial)

## Production Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y build-essential curl git nginx postgresql-client

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash grandpro
sudo usermod -aG sudo grandpro
```

### 2. Clone Repository

```bash
# Switch to application user
sudo su - grandpro

# Clone repository
git clone https://github.com/femikupoluyi/grandpro-hmso-new.git
cd grandpro-hmso-new
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend
npm ci --production

# Frontend dependencies
cd ../frontend
npm ci
npm run build
```

## Database Configuration

### Option 1: Neon Database (Recommended)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project with name `grandpro-hmso-prod`
3. Copy connection string
4. Update backend `.env`:
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE grandpro_hmso;
CREATE USER grandpro_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE grandpro_hmso TO grandpro_user;

-- Enable required extensions
\c grandpro_hmso;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Database Migration

```bash
cd /home/grandpro/grandpro-hmso-new/backend

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

## Application Deployment

### 1. Environment Configuration

#### Backend Configuration
```bash
# Create production environment file
cp .env.example .env.production
nano .env.production
```

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Application
NODE_ENV=production
PORT=5001
APP_NAME=GrandPro HMSO
TIMEZONE=Africa/Lagos
CURRENCY=NGN

# Security (Generate strong keys!)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)

# External Services
WHATSAPP_API_KEY=your-whatsapp-key
SMS_API_KEY=your-sms-key
EMAIL_API_KEY=your-email-key

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

#### Frontend Configuration
```bash
cd ../frontend
cp .env.example .env.production
nano .env.production
```

```env
VITE_API_URL=https://api.grandpro-hmso.ng/api
VITE_APP_NAME=GrandPro HMSO
VITE_CURRENCY=NGN
VITE_TIMEZONE=Africa/Lagos
VITE_COUNTRY=Nigeria
```

### 2. Build Frontend

```bash
cd /home/grandpro/grandpro-hmso-new/frontend
npm run build
```

### 3. Configure PM2

Create PM2 ecosystem file:
```bash
cd /home/grandpro/grandpro-hmso-new
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'grandpro-backend',
      script: './backend/src/server.js',
      instances: 4,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10
    },
    {
      name: 'grandpro-frontend',
      script: 'serve',
      args: '-s dist -l 3001',
      cwd: './frontend',
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log'
    }
  ]
};
```

### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by PM2
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/grandpro-hmso
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name grandpro-hmso.ng www.grandpro-hmso.ng;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    server_name grandpro-hmso.ng www.grandpro-hmso.ng;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/grandpro-hmso.ng/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grandpro-hmso.ng/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_proxied any;
    gzip_min_length 1000;
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/grandpro-hmso /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d grandpro-hmso.ng -d www.grandpro-hmso.ng

# Setup automatic renewal
sudo systemctl enable certbot.timer
```

## Security Configuration

### 1. Firewall Setup

```bash
# Install and configure UFW
sudo apt install -y ufw

# Allow SSH (change port if using custom)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. Fail2ban Configuration

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Create custom jail
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

### 3. Security Hardening

```bash
# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Set secure file permissions
chmod 600 /home/grandpro/grandpro-hmso-new/backend/.env.production
chmod 600 /home/grandpro/grandpro-hmso-new/frontend/.env.production

# Create backup directory with restricted access
mkdir -p /backup/grandpro-hmso
chmod 700 /backup/grandpro-hmso
chown grandpro:grandpro /backup/grandpro-hmso
```

## Monitoring & Maintenance

### 1. Setup Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. Health Checks

Create health check script:
```bash
nano /home/grandpro/health-check.sh
```

```bash
#!/bin/bash
# Health check script

# Check backend
curl -f http://localhost:5001/health || exit 1

# Check frontend
curl -f http://localhost:3001 || exit 1

# Check database
psql $DATABASE_URL -c "SELECT 1" || exit 1

echo "All services healthy"
```

### 3. Backup Configuration

```bash
# Create backup script
nano /home/grandpro/backup.sh
```

```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/backup/grandpro-hmso"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"

# Database backup
pg_dump $DATABASE_URL > $DB_BACKUP
gzip $DB_BACKUP

# Application files backup
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
  /home/grandpro/grandpro-hmso-new \
  --exclude=node_modules \
  --exclude=.git

# Clean old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Setup cron job:
```bash
crontab -e
```

```cron
# Daily backup at 2 AM
0 2 * * * /home/grandpro/backup.sh >> /home/grandpro/logs/backup.log 2>&1

# Health check every 5 minutes
*/5 * * * * /home/grandpro/health-check.sh

# Certificate renewal check
0 3 * * 1 certbot renew --quiet
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs grandpro-backend
pm2 logs grandpro-frontend

# Check system resources
free -h
df -h
top
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check PostgreSQL status (if self-hosted)
sudo systemctl status postgresql
```

#### 3. Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. Performance Issues
```bash
# Monitor PM2 metrics
pm2 monit

# Check database slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
gunzip < /backup/grandpro-hmso/db_backup_20251002.sql.gz | psql $DATABASE_URL
```

#### Application Recovery
```bash
# Restart all services
pm2 restart all

# If PM2 crashes
pm2 kill
pm2 start ecosystem.config.js --env production
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_hospitals_location ON hospitals(location);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Analyze tables for query optimization
ANALYZE;
```

### 2. Application Optimization
```bash
# Enable Node.js production optimizations
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. Nginx Caching
Add to Nginx configuration:
```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Enable Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
```

## Scaling

### Horizontal Scaling
```javascript
// Update PM2 configuration for multiple instances
{
  name: 'grandpro-backend',
  script: './backend/src/server.js',
  instances: 'max',  // Use all available CPU cores
  exec_mode: 'cluster'
}
```

### Load Balancing
For multiple servers, use Nginx upstream:
```nginx
upstream backend {
    least_conn;
    server backend1.grandpro-hmso.ng:5001;
    server backend2.grandpro-hmso.ng:5001;
    server backend3.grandpro-hmso.ng:5001;
}

location /api {
    proxy_pass http://backend;
}
```

## Support

For deployment support:
- Email: devops@grandpro.ng
- Documentation: https://docs.grandpro-hmso.ng
- GitHub Issues: https://github.com/femikupoluyi/grandpro-hmso-new/issues

---

**Last Updated**: October 2, 2025  
**Version**: 1.0.0
