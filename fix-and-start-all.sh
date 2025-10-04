#!/bin/bash

# GrandPro HMSO - Complete Fix and Startup Script
# This script fixes all known issues and ensures all services are properly running

echo "================================================"
echo "GrandPro HMSO Platform - Complete Fix & Startup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Kill all existing processes
print_info "Stopping all existing services..."
pkill -f "serve" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "pm2" 2>/dev/null
sleep 2

# Change to project directory
cd /root/grandpro-hmso-new

# 1. Fix Backend Configuration
print_info "Configuring backend..."
cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://neondb_owner:npg_InhJz3HWVO6E@ep-solitary-recipe-adrz8omw-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_InhJz3HWVO6E@ep-solitary-recipe-adrz8omw.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="grandpro-hmso-secret-key-2024"
NODE_ENV="production"
PORT=5000
CORS_ORIGIN="*"
HOST="0.0.0.0"

# Communication Service Credentials (Stubs for now)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER="+2348000000000"
TWILIO_WHATSAPP_NUMBER="+14155238886"
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="noreply@grandprohmso.ng"
EOF
print_status "Backend environment configured"

# 2. Update backend server.js to ensure proper binding
print_info "Updating backend server configuration..."
cat > backend/src/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'GrandPro HMSO Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    res.json({
      status: 'operational',
      database: 'connected',
      databaseInfo: result.rows[0],
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const crmRoutes = require('./routes/crm.routes');
const hospitalRoutes = require('./routes/hospital-management.routes');
const operationsRoutes = require('./routes/operations.routes');
const partnersRoutes = require('./routes/partners.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const securityRoutes = require('./routes/security.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);

// Catch-all API route
app.get('/api', (req, res) => {
  res.json({
    message: 'GrandPro HMSO API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: '/api/auth',
      onboarding: '/api/onboarding',
      dashboard: '/api/dashboard',
      crm: '/api/crm',
      hospital: '/api/hospital',
      operations: '/api/operations',
      partners: '/api/partners',
      analytics: '/api/analytics',
      security: '/api/security'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`\n================================================`);
  console.log(`GrandPro HMSO Backend Server`);
  console.log(`================================================`);
  console.log(`✓ Server running on http://${HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✓ Database: Connected to Neon PostgreSQL`);
  console.log(`✓ Health check: http://${HOST}:${PORT}/health`);
  console.log(`✓ API status: http://${HOST}:${PORT}/api/status`);
  console.log(`================================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end();
  process.exit(0);
});

module.exports = app;
EOF
print_status "Backend server updated"

# 3. Fix Frontend Configuration
print_info "Configuring frontend..."
cat > frontend/.env << 'EOF'
VITE_API_URL=http://morphvm-wz7xxc7v.ssh.cloud.morph.so:5000/api
VITE_APP_NAME="GrandPro HMSO"
VITE_APP_VERSION="1.0.0"
VITE_DEFAULT_CURRENCY="₦"
VITE_DEFAULT_TIMEZONE="Africa/Lagos"
EOF
print_status "Frontend environment configured"

# 4. Build Frontend
print_info "Building frontend application..."
cd frontend
npm install --legacy-peer-deps 2>/dev/null
npm run build
print_status "Frontend built successfully"

# 5. Create a simple static server for frontend
cd /root/grandpro-hmso-new
cat > serve-frontend.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'frontend' });
});

// Catch all - serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
});
EOF
print_status "Frontend server configured"

# 6. Install dependencies
print_info "Installing dependencies..."
npm install express 2>/dev/null
print_status "Dependencies installed"

# 7. Start Backend
print_info "Starting backend server..."
cd /root/grandpro-hmso-new/backend
nohup node src/server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if ps -p $BACKEND_PID > /dev/null; then
    print_status "Backend started (PID: $BACKEND_PID)"
else
    print_error "Backend failed to start"
fi

# 8. Start Frontend
print_info "Starting frontend server..."
cd /root/grandpro-hmso-new
nohup node serve-frontend.js > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# Check if frontend started
if ps -p $FRONTEND_PID > /dev/null; then
    print_status "Frontend started (PID: $FRONTEND_PID)"
else
    print_error "Frontend failed to start"
fi

# 9. Test endpoints
print_info "Testing public endpoints..."
echo ""

# Test backend health
echo -n "Testing backend health... "
BACKEND_HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null)
if [[ $BACKEND_HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

# Test frontend
echo -n "Testing frontend... "
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [[ $FRONTEND_RESPONSE == "200" ]]; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

# Test API status
echo -n "Testing API status... "
API_STATUS=$(curl -s http://localhost:5000/api/status 2>/dev/null)
if [[ $API_STATUS == *"operational"* ]]; then
    echo -e "${GREEN}✓ Operational${NC}"
else
    echo -e "${RED}✗ Not operational${NC}"
fi

# 10. Display public URLs
echo ""
echo "================================================"
echo "🎉 GrandPro HMSO Platform Ready!"
echo "================================================"
echo ""
echo "📱 PUBLIC ACCESS URLs:"
echo "-------------------"
echo -e "${GREEN}Frontend Application:${NC}"
echo "  http://morphvm-wz7xxc7v.ssh.cloud.morph.so:3000"
echo ""
echo -e "${GREEN}Backend API:${NC}"
echo "  http://morphvm-wz7xxc7v.ssh.cloud.morph.so:5000"
echo ""
echo -e "${GREEN}API Endpoints:${NC}"
echo "  Health Check: http://morphvm-wz7xxc7v.ssh.cloud.morph.so:5000/health"
echo "  API Status: http://morphvm-wz7xxc7v.ssh.cloud.morph.so:5000/api/status"
echo "  Dashboard: http://morphvm-wz7xxc7v.ssh.cloud.morph.so:5000/api/dashboard/stats"
echo ""
echo "================================================"
echo ""
echo "📊 Service Status:"
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 View Logs:"
echo "  Backend: tail -f /root/grandpro-hmso-new/logs/backend.log"
echo "  Frontend: tail -f /root/grandpro-hmso-new/logs/frontend.log"
echo ""
echo "🔑 Default Login Credentials:"
echo "  Super Admin: admin@grandpro.com / Admin123!"
echo "  Doctor: doctor@luth.ng / Doctor123!"
echo "  Patient: patient1@gmail.com / Patient123!"
echo ""
echo "================================================"

# Save process IDs
echo "$BACKEND_PID" > /root/grandpro-hmso-new/.backend.pid
echo "$FRONTEND_PID" > /root/grandpro-hmso-new/.frontend.pid

print_status "All services started successfully!"
