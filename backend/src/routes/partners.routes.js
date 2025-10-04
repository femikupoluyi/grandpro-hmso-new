const express = require('express');
const router = express.Router();

// Import partner integration routes
const insuranceRoutes = require('./insurance.routes');
const pharmacyRoutes = require('./pharmacy.routes');
const telemedicineRoutes = require('./telemedicine.routes');

// Mount partner sub-routes
router.use('/insurance', insuranceRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/telemedicine', telemedicineRoutes);

// Partners overview endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'operational',
    partners: {
      insurance: {
        name: 'Insurance & HMO Integration',
        status: 'active',
        providers: ['NHIS', 'AXA Mansard', 'Hygeia HMO', 'Leadway Health']
      },
      pharmacy: {
        name: 'Pharmacy Integration',
        status: 'active',
        suppliers: ['MedPlus', 'HealthPlus', 'Alpha Pharmacy']
      },
      telemedicine: {
        name: 'Telemedicine Services',
        status: 'active',
        features: ['Video Consultation', 'E-Prescription', 'Remote Monitoring']
      }
    }
  });
});

module.exports = router;
