const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const userRoutes = require('./routes/user.routes');
const contractRoutes = require('./routes/contract.routes');
const applicationRoutes = require('./routes/application.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const crmRoutes = require('./routes/crm.routes');
const insuranceRoutes = require('./routes/insurance.routes');
const dataAnalyticsRoutes = require('./routes/data-analytics.routes');
const auditRoutes = require('./routes/audit.routes');
const operationsRoutes = require('./routes/operations.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Import security middleware
const securityMiddleware = require('./middleware/simple-security');

// Apply security middleware
securityMiddleware.applyAll(app);

// Additional middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GrandPro HMSO Backend API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    timezone: process.env.TIMEZONE,
    currency: process.env.CURRENCY
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/data-analytics', dataAnalyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/operations', operationsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GrandPro HMSO API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      hospitals: '/api/hospitals',
      users: '/api/users',
      contracts: '/api/contracts',
      applications: '/api/applications',
      dashboard: '/api/dashboard',
      onboarding: '/api/onboarding'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.originalUrl
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ GrandPro HMSO Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌍 Timezone: ${process.env.TIMEZONE}`);
  console.log(`💵 Currency: ${process.env.CURRENCY}`);
  console.log(`🏥 Application: ${process.env.APP_NAME}`);
});

module.exports = app;
