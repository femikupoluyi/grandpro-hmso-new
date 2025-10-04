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
