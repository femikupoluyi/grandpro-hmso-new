const express = require('express');
const router = express.Router();

// Import existing hospital routes
const hospitalRoutes = require('./hospital.routes');
const emrRoutes = require('./emr.routes');
const billingRoutes = require('./billing.routes');
const inventoryRoutes = require('./inventory.routes');
const hrRoutes = require('./hr.routes');

// Mount all hospital management sub-routes
router.use('/', hospitalRoutes);
router.use('/emr', emrRoutes);
router.use('/billing', billingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/hr', hrRoutes);

// Hospital overview endpoint
router.get('/overview', async (req, res) => {
  res.json({
    status: 'operational',
    modules: {
      emr: 'Electronic Medical Records',
      billing: 'Billing & Revenue Management',
      inventory: 'Inventory Management',
      hr: 'Human Resources & Rostering'
    }
  });
});

module.exports = router;
