# GrandPro HMSO - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores

### Software Requirements
```bash
# Node.js 18+ and npm
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v8.0.0 or higher

# PostgreSQL 14+
psql --version  # Should be 14.0 or higher

# Git
git --version   # Should be 2.30 or higher

# Optional: PM2 for process management
npm install -g pm2
```

---

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/femikupoluyi/grandpro-hmso-new.git
cd grandpro-hmso-new
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Create database
createdb grandpro_hmso_dev

# Run migrations
cd backend
npm run migrate

# Seed sample data
npm run seed
```

### 4. Environment Configuration
```bash
# Backend
cd backend
cp .env.example .env
nano .env  # Edit with your configurations

# Frontend
cd ../frontend
cp .env.example .env
nano .env  # Edit with your configurations
```

### 5. Start Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## Production Deployment

### 1. Server Preparation

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Application Setup

#### Clone and Build
```bash
cd /var/www
sudo git clone https://github.com/femikupoluyi/grandpro-hmso-new.git
cd grandpro-hmso-new

# Set permissions
sudo chown -R $USER:$USER /var/www/grandpro-hmso-new

# Install dependencies
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build
```

#### Configure Environment
```bash
# Backend production config
cd /var/www/grandpro-hmso-new/backend
cat > .env << EOF
DATABASE_URL=postgresql://grandpro:password@localhost/grandpro_prod
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
EOF

# Frontend production config
cd ../frontend
cat > .env << EOF
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=GrandPro HMSO
EOF
```

### 3. Database Production Setup

```sql
-- Create production database and user
sudo -u postgres psql

CREATE USER grandpro WITH PASSWORD 'secure_password';
CREATE DATABASE grandpro_prod OWNER grandpro;
GRANT ALL PRIVILEGES ON DATABASE grandpro_prod TO grandpro;
\q
```

Run migrations:
```bash
cd /var/www/grandpro-hmso-new/backend
NODE_ENV=production npm run migrate
```

### 4. Process Management with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Create ecosystem file
cd /var/www/grandpro-hmso-new
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'grandpro-backend',
      script: './backend/src/server.js',
      cwd: './backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'grandpro-frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/grandpro-hmso

# Add the following configuration:
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Application
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/grandpro-hmso /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Configuration

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance (Ubuntu 20.04, t3.medium minimum)
# Configure security groups:
# - Port 22 (SSH)
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
# - Port 5000 (API)
# - Port 3000 (Frontend)
```

#### 2. RDS PostgreSQL Setup
```bash
# Create RDS instance
# - Engine: PostgreSQL 14+
# - Instance class: db.t3.medium
# - Storage: 100GB SSD
# - Enable automated backups
```

#### 3. S3 for Static Assets
```bash
# Create S3 bucket for uploads
aws s3 mb s3://grandpro-hmso-uploads

# Configure CORS
aws s3api put-bucket-cors --bucket grandpro-hmso-uploads --cors-configuration file://cors.json
```

### Google Cloud Platform

#### 1. Compute Engine
```bash
# Create VM instance
gcloud compute instances create grandpro-hmso \
  --machine-type=e2-medium \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB
```

#### 2. Cloud SQL
```bash
# Create PostgreSQL instance
gcloud sql instances create grandpro-hmso-db \
  --database-version=POSTGRES_14 \
  --tier=db-n1-standard-2 \
  --region=us-central1
```

### Azure Deployment

#### 1. Virtual Machine
```bash
# Create resource group
az group create --name grandpro-rg --location eastus

# Create VM
az vm create \
  --resource-group grandpro-rg \
  --name grandpro-vm \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

#### 2. Azure Database for PostgreSQL
```bash
az postgres server create \
  --resource-group grandpro-rg \
  --name grandpro-db-server \
  --sku-name B_Gen5_2 \
  --version 14
```

---

## Database Setup

### Neon PostgreSQL (Recommended)

1. **Create Neon Account**: https://neon.tech
2. **Create Project**: grandpro-hmso
3. **Get Connection String**:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb
```

4. **Update .env**:
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Local PostgreSQL

```bash
# Create database
sudo -u postgres createdb grandpro_hmso

# Create user
sudo -u postgres createuser --interactive grandpro

# Set password
sudo -u postgres psql
ALTER USER grandpro PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE grandpro_hmso TO grandpro;
```

### Run Migrations
```bash
cd backend
npm run migrate

# Or manually
psql -U grandpro -d grandpro_hmso -f src/database/migrations/*.sql
```

---

## Environment Configuration

### Production Environment Variables

#### Backend (.env.production)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database
DIRECT_URL=postgresql://user:pass@host:5432/database

# Security
JWT_SECRET=generate-with-openssl-rand-base64-32
SESSION_SECRET=generate-random-string
ENCRYPTION_KEY=32-character-key

# Application
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=https://yourdomain.com

# Communication Services
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+234xxxxxxxxxx
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# File Storage
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
S3_BUCKET=grandpro-uploads

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_license_key
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=GrandPro HMSO
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_CURRENCY=₦
VITE_DEFAULT_TIMEZONE=Africa/Lagos
VITE_GOOGLE_ANALYTICS=UA-XXXXXXXXX
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## Security Configuration

### 1. Firewall Setup
```bash
# UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 3. SSL/TLS Configuration
```nginx
# Strong SSL configuration in Nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 4. Database Security
```sql
-- Revoke public access
REVOKE ALL ON DATABASE grandpro_prod FROM public;

-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE grandpro_prod TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
```

---

## Monitoring & Maintenance

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Web dashboard
pm2 install pm2-web
pm2 web
```

#### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend health
curl https://yourdomain.com/health
```

### 2. Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_database_size('grandpro_prod');

-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 3. Log Management

```bash
# Application logs
tail -f /var/log/pm2/grandpro-backend-out.log
tail -f /var/log/pm2/grandpro-frontend-out.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u postgresql -f
```

### 4. Automated Monitoring

```bash
# Install monitoring stack
docker-compose -f monitoring-stack.yml up -d

# Includes:
# - Prometheus (metrics)
# - Grafana (dashboards)
# - AlertManager (alerts)
# - Loki (log aggregation)
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U grandpro -d grandpro_prod -c "SELECT 1"

# Check logs
sudo tail -f /var/log/postgresql/*.log
```

#### 2. Port Already in Use
```bash
# Find process using port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

#### 3. Permission Denied
```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/grandpro-hmso-new
chmod -R 755 /var/www/grandpro-hmso-new
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h

# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 5. SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew --dry-run
sudo certbot renew
```

---

## Backup & Recovery

### 1. Automated Backups

#### Database Backup Script
```bash
#!/bin/bash
# /usr/local/bin/backup-grandpro.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/grandpro"
DB_NAME="grandpro_prod"

# Create backup
pg_dump -U grandpro -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://grandpro-backups/

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

#### Cron Job
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-grandpro.sh
```

### 2. Recovery Procedures

#### Database Recovery
```bash
# Download backup from S3
aws s3 cp s3://grandpro-backups/backup_20251004.sql.gz .

# Decompress
gunzip backup_20251004.sql.gz

# Restore
psql -U grandpro -d grandpro_prod < backup_20251004.sql
```

#### Application Recovery
```bash
# Stop services
pm2 stop all

# Pull latest code
cd /var/www/grandpro-hmso-new
git pull origin main

# Rebuild
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build

# Restart services
pm2 restart all
```

### 3. Disaster Recovery

#### Failover Procedure
1. **Detect failure** - Monitoring alerts
2. **Switch DNS** - Point to backup server
3. **Restore database** - From latest backup
4. **Verify services** - Health checks
5. **Notify team** - Status updates

#### Recovery Time Objectives
- **RTO**: < 2 hours
- **RPO**: < 15 minutes
- **Backup retention**: 30 days daily, 12 months monthly

---

## Performance Optimization

### 1. Frontend Optimization
```bash
# Build with optimization
npm run build -- --minify

# Enable gzip compression
npm install compression

# Use CDN for static assets
```

### 2. Backend Optimization
```javascript
// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_patients_hospital ON patients(hospital_id);
```

### 3. Caching
```bash
# Install Redis
sudo apt install -y redis-server

# Configure caching in application
npm install redis
```

---

## Support

For deployment support:
- Email: devops@grandprohmso.ng
- Documentation: https://docs.grandprohmso.ng
- GitHub Issues: https://github.com/femikupoluyi/grandpro-hmso-new/issues

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
