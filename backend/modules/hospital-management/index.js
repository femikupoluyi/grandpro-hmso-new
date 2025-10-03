const express = require('express');
const router = express.Router();

// Import sub-modules
const emrRoutes = require('./emr/emrRoutes');
const billingRoutes = require('./billing/billingRoutes');
const inventoryRoutes = require('./inventory/inventoryRoutes');
const hrRoutes = require('./hr/hrRoutes');
const analyticsRoutes = require('./analytics/analyticsRoutes');

// Mount sub-routes
router.use('/emr', emrRoutes);
router.use('/billing', billingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/hr', hrRoutes);
router.use('/analytics', analyticsRoutes);

// Hospital Management Dashboard
router.get('/dashboard', async (req, res) => {
  const pool = require('../../config/database');
  
  try {
    const { hospital_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    // Patient statistics
    const patientStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_patients,
        COUNT(DISTINCT CASE WHEN DATE(e.encounter_date) = $1 THEN e.id END) as today_visits,
        COUNT(DISTINCT CASE WHEN e.encounter_type = 'INPATIENT' AND e.encounter_status = 'IN_PROGRESS' THEN e.patient_id END) as current_admissions
      FROM patients p
      LEFT JOIN encounters e ON e.patient_id = p.id
      WHERE p.hospital_id = $2`,
      [today, hospital_id]
    );

    // Billing statistics
    const billingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_bills_today,
        SUM(total_amount) as revenue_today,
        SUM(paid_amount) as collected_today,
        SUM(balance_amount) as outstanding_today
      FROM bills 
      WHERE hospital_id = $1 AND bill_date = $2`,
      [hospital_id, today]
    );

    // Inventory alerts
    const inventoryAlerts = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE current_stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE current_stock <= reorder_level) as low_stock
      FROM inventory_items 
      WHERE hospital_id = $1 AND is_active = true`,
      [hospital_id]
    );

    // Staff on duty
    const staffStats = await pool.query(`
      SELECT 
        COUNT(*) as staff_on_duty,
        COUNT(*) FILTER (WHERE shift_type = 'MORNING') as morning_shift,
        COUNT(*) FILTER (WHERE shift_type = 'AFTERNOON') as afternoon_shift,
        COUNT(*) FILTER (WHERE shift_type = 'NIGHT') as night_shift
      FROM work_schedules 
      WHERE hospital_id = $1 AND schedule_date = $2 AND schedule_status = 'SCHEDULED'`,
      [hospital_id, today]
    );

    res.json({
      success: true,
      data: {
        date: today,
        patient_statistics: patientStats.rows[0],
        billing_statistics: billingStats.rows[0],
        inventory_alerts: inventoryAlerts.rows[0],
        staff_statistics: staffStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching hospital dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Get hospital departments
router.get('/departments', async (req, res) => {
  const departments = [
    { code: 'OPD', name: 'Outpatient Department' },
    { code: 'IPD', name: 'Inpatient Department' },
    { code: 'EMERGENCY', name: 'Emergency Department' },
    { code: 'ICU', name: 'Intensive Care Unit' },
    { code: 'SURGERY', name: 'Surgery Department' },
    { code: 'PEDIATRICS', name: 'Pediatrics' },
    { code: 'OBSTETRICS', name: 'Obstetrics & Gynecology' },
    { code: 'RADIOLOGY', name: 'Radiology' },
    { code: 'LABORATORY', name: 'Laboratory' },
    { code: 'PHARMACY', name: 'Pharmacy' },
    { code: 'CARDIOLOGY', name: 'Cardiology' },
    { code: 'ORTHOPEDICS', name: 'Orthopedics' },
    { code: 'PSYCHIATRY', name: 'Psychiatry' },
    { code: 'DENTAL', name: 'Dental' }
  ];

  res.json({
    success: true,
    data: departments
  });
});

module.exports = router;
