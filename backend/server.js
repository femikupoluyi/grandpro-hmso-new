const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
const crmRouter = require('./src/routes/crm.routes');
const ownerCrmRouter = require('./src/routes/owner-crm.routes');
const patientCrmRouter = require('./src/routes/patient-crm.routes');
const communicationRouter = require('./src/routes/communication.routes');
const hospitalRouter = require('./src/routes/hospital.routes');
const hospitalOnboardingRouter = require('./src/routes/hospital-onboarding.routes');
const hospitalManagementRouter = require('./modules/hospital-management');
const operationsRouter = require('./src/routes/operations.routes');

app.use('/api/crm', crmRouter);
app.use('/api/crm/owners', ownerCrmRouter);
app.use('/api/crm/patients', patientCrmRouter);
app.use('/api/crm/communications', communicationRouter);
app.use('/api/hospital', hospitalOnboardingRouter); // This handles applications, contracts, onboarding
app.use('/api/hospital-core', hospitalRouter); // This handles EMR, billing, inventory
app.use('/api/hospital-management', hospitalManagementRouter);
app.use('/api/operations', operationsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     GrandPro HMSO - CRM Module Backend Server                ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                           ║
║  Database: Connected to Neon PostgreSQL                      ║
║                                                               ║
║  Available Endpoints:                                         ║
║  - Health Check: GET /health                                 ║
║  - CRM API: /api/crm/*                                       ║
║  - Owner CRM: /api/crm/owners/*                              ║
║  - Patient CRM: /api/crm/patients/*                          ║
║  - Communications: /api/crm/communications/*                 ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
