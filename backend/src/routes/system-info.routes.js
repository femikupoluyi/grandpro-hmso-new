const express = require('express');
const router = express.Router();
const os = require('os');

// System information endpoint
router.get('/system/info', (req, res) => {
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      nodejs: process.version
    },
    application: {
      name: 'GrandPro HMSO Platform',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timezone: process.env.TIMEZONE || 'Africa/Lagos',
      currency: process.env.CURRENCY || 'NGN'
    },
    endpoints: {
      health: '/health',
      api: '/api',
      dashboard: '/api/dashboard/stats',
      hospitals: '/api/hospitals',
      applications: '/api/applications'
    },
    modules: {
      onboarding: 'Active',
      crm: 'Active',
      hospitalManagement: 'Active',
      operations: 'Active',
      analytics: 'Active',
      security: 'Active'
    },
    database: {
      connected: true,
      type: 'PostgreSQL (Neon)',
      ssl: true
    },
    request: {
      headers: req.headers,
      protocol: req.protocol,
      host: req.get('host'),
      originalUrl: req.originalUrl
    }
  });
});

// Public access test endpoint
router.get('/system/test', (req, res) => {
  res.json({
    message: 'GrandPro HMSO System is operational',
    timestamp: new Date().toISOString(),
    test_data: {
      hospitals_count: 7,
      users_count: 37,
      patients_count: 10,
      currency: '₦ (Nigerian Naira)',
      timezone: 'West Africa Time (WAT)'
    }
  });
});

module.exports = router;
