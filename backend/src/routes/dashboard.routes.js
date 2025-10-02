const express = require('express');
const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
  res.json({ 
    message: 'Dashboard data',
    stats: {
      totalHospitals: 156,
      activePatients: 15420,
      monthlyRevenue: 25000000,
      pendingApplications: 23
    }
  });
});

module.exports = router;
