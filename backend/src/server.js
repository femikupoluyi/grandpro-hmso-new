const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const hospitalRoutes = require('./routes/hospital-full.routes'); // Using full implementation
const userRoutes = require('./routes/user.routes');
const contractRoutes = require('./routes/contract-full.routes'); // Using full implementation
const applicationRoutes = require('./routes/application.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const onboardingRoutes = require('./routes/onboarding-full.routes'); // Using full implementation

// CRM Routes
const crmRoutes = require('./routes/crm.routes');
const ownerCrmRoutes = require('./routes/owner-crm.routes');
const patientCrmRoutes = require('./routes/patient-crm.routes');
const communicationRoutes = require('./routes/communication.routes');
const enhancedCrmRoutes = require('./routes/crm-enhanced.routes');

// Hospital Management Routes
const emrRoutes = require('./routes/emr.routes');
const billingRoutes = require('./routes/billing.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const hrRoutes = require('./routes/hr.routes');

// Operations Routes
const operationsRoutes = require('./routes/operations.routes');

// Hospital Analytics Routes
const hospitalAnalyticsRoutes = require('./routes/hospital-analytics.routes');
const analyticsEnhancedRoutes = require('./routes/analytics-enhanced.routes');

// Partner Integration Routes
const insuranceRoutes = require('./routes/insurance.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const telemedicineRoutes = require('./routes/telemedicine.routes');

// Analytics & ML Routes
const dataAnalyticsRoutes = require('./routes/analytics.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// CRM Routes
app.use('/api/crm', crmRoutes);
app.use('/api/crm/owners', ownerCrmRoutes);
app.use('/api/crm/patients', patientCrmRoutes);
app.use('/api/crm/communications', communicationRoutes);
app.use('/api/crm/enhanced', enhancedCrmRoutes);

// Hospital Management Routes
app.use('/api/emr', emrRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/hr', hrRoutes);

// Operations Routes
app.use('/api/operations', operationsRoutes);

// Hospital Analytics Routes
app.use('/api/analytics', analyticsEnhancedRoutes); // Use enhanced implementation
// Legacy analytics route for backward compatibility
app.use('/api/analytics-legacy', hospitalAnalyticsRoutes);

// Partner Integration Routes
app.use('/api/insurance', insuranceRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/telemedicine', telemedicineRoutes);

// Analytics & ML Routes
app.use('/api/data-analytics', dataAnalyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message || 'Internal server error',
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
      path: req.path
    }
  });
});

// Database connection
const { pool } = require('./config/database');

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ GrandPro HMSO Backend Server running on port', PORT);
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🌍 Timezone:', process.env.TIMEZONE || 'Africa/Lagos');
    console.log('💵 Currency:', process.env.CURRENCY || 'NGN');
    console.log('🏥 Application: GrandPro HMSO');
    console.log('✅ Database connected successfully');
    console.log('📅 Server time:', result.rows[0].now);
    console.log('🗄️ Database:', process.env.DATABASE_NAME || 'neondb');
    
    app.listen(PORT);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
