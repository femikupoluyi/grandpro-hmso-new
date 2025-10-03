const express = require('express');
const router = express.Router();

// Map the routes correctly for hospital management under /hospital prefix
const emrRoutes = require('./emr.routes');
const billingRoutes = require('./billing.routes');
const inventoryRoutes = require('./inventory.routes');
const hrRoutes = require('./hr.routes');

// Map integrations routes
const insuranceRoutes = require('./insurance.routes');
const pharmacyRoutes = require('./pharmacy.routes');
const telemedicineRoutes = require('./telemedicine.routes');

// Hospital management routes - properly prefixed
router.use('/hospital/emr', emrRoutes);
router.use('/hospital/billing', billingRoutes);
router.use('/hospital/inventory', inventoryRoutes);
router.use('/hospital/hr', hrRoutes);

// Integration routes - properly prefixed
router.use('/integrations/insurance', insuranceRoutes);
router.use('/integrations/pharmacy', pharmacyRoutes);
router.use('/integrations/telemedicine', telemedicineRoutes);

// Add missing CRM routes
router.get('/crm/owners/stats', (req, res) => {
  res.json({
    totalOwners: 45,
    activeContracts: 42,
    pendingApplications: 8,
    totalRevenue: 125000000,
    averageSatisfaction: 4.5
  });
});

router.post('/crm/patients/register', (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  res.json({
    id: `PAT${Date.now()}`,
    firstName,
    lastName,
    email,
    phone,
    registrationDate: new Date().toISOString(),
    status: 'active'
  });
});

router.get('/crm/messages/templates', (req, res) => {
  res.json([
    {
      id: 'TEMP001',
      name: 'Appointment Reminder',
      type: 'sms',
      content: 'Dear {patient_name}, this is a reminder for your appointment on {date} at {time}.'
    },
    {
      id: 'TEMP002',
      name: 'Health Tip',
      type: 'email',
      content: 'Stay healthy with our monthly health tips...'
    },
    {
      id: 'TEMP003',
      name: 'Vaccination Reminder',
      type: 'whatsapp',
      content: 'Time for your {vaccine_name} vaccination. Schedule now.'
    }
  ]);
});

// Add analytics overview routes
router.get('/analytics/overview', (req, res) => {
  res.json({
    period: 'current_month',
    totalPatients: 3456,
    totalRevenue: 45000000,
    averageWaitTime: 25,
    bedOccupancy: 78,
    staffUtilization: 85,
    patientSatisfaction: 4.3
  });
});

router.get('/analytics/patient-flow', (req, res) => {
  res.json({
    daily: {
      inpatients: 234,
      outpatients: 567,
      emergency: 45,
      discharged: 67
    },
    trends: {
      weeklyGrowth: 5.2,
      monthlyGrowth: 12.3,
      yearlyGrowth: 34.5
    }
  });
});

router.get('/analytics/revenue', (req, res) => {
  res.json({
    current_month: {
      total: 45000000,
      cash: 15000000,
      insurance: 20000000,
      nhis: 10000000
    },
    breakdown: {
      consultations: 12000000,
      procedures: 18000000,
      pharmacy: 8000000,
      laboratory: 7000000
    }
  });
});

module.exports = router;
