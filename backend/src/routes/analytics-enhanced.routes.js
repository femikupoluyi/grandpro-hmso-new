const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Analytics API is working',
    endpoints: {
      occupancy: {
        current: 'GET /api/analytics/occupancy/:hospitalId',
        historical: 'GET /api/analytics/occupancy/:hospitalId/historical'
      },
      patientFlow: {
        realtime: 'GET /api/analytics/patient-flow/:hospitalId',
        hourly: 'GET /api/analytics/patient-flow/:hospitalId/hourly',
        daily: 'GET /api/analytics/patient-flow/:hospitalId/daily'
      },
      emergency: {
        metrics: 'GET /api/analytics/emergency/:hospitalId',
        waitTimes: 'GET /api/analytics/emergency/:hospitalId/wait-times'
      },
      revenue: {
        summary: 'GET /api/analytics/revenue/:hospitalId',
        byPaymentMethod: 'GET /api/analytics/revenue/:hospitalId/payment-methods',
        insurance: 'GET /api/analytics/revenue/:hospitalId/insurance'
      },
      operational: {
        kpis: 'GET /api/analytics/kpis/:hospitalId',
        dashboard: 'GET /api/analytics/dashboard/:hospitalId'
      },
      predictions: {
        admissions: 'GET /api/analytics/predictions/admissions/:hospitalId'
      }
    }
  });
});

// Get real-time occupancy
router.get('/occupancy/:hospitalId', async (req, res) => {
  try {
    // For now, return mock data since beds table might not be fully populated
    const mockData = {
      hospital_id: req.params.hospitalId,
      total_beds: 100,
      occupied_beds: 65,
      available_beds: 35,
      occupancy_rate: 65.0,
      department_occupancy: [
        { department: 'Emergency', total_beds: 20, occupied: 15, occupancy_rate: 75 },
        { department: 'ICU', total_beds: 10, occupied: 8, occupancy_rate: 80 },
        { department: 'General Ward', total_beds: 50, occupied: 30, occupancy_rate: 60 }
      ]
    };
    res.json(mockData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical occupancy
router.get('/occupancy/:hospitalId/historical', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await analyticsService.getHistoricalOccupancy(req.params.hospitalId, days);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time patient flow
router.get('/patient-flow/:hospitalId', async (req, res) => {
  try {
    const result = await analyticsService.getPatientFlowMetrics(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hourly patient flow
router.get('/patient-flow/:hospitalId/hourly', async (req, res) => {
  try {
    const { date } = req.query;
    const result = await analyticsService.getHourlyPatientFlow(req.params.hospitalId, date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily patient flow
router.get('/patient-flow/:hospitalId/daily', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await analyticsService.getDailyPatientFlow(req.params.hospitalId, start_date, end_date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency department metrics
router.get('/emergency/:hospitalId', async (req, res) => {
  try {
    const result = await analyticsService.getEmergencyMetrics(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency wait times
router.get('/emergency/:hospitalId/wait-times', async (req, res) => {
  try {
    const result = await analyticsService.getEmergencyWaitTimes(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue analytics
router.get('/revenue/:hospitalId', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const hospitalId = req.params.hospitalId;
    
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(AVG(amount), 0) as avg_transaction_value
      FROM payments
      WHERE hospital_id = $1
        AND status = 'completed'
    `;
    
    const result = await pool.query(query, [hospitalId]);
    res.json({
      status: 'success',
      data: result.rows[0] || {
        total_revenue: 0,
        total_transactions: 0,
        avg_transaction_value: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue by payment method
router.get('/revenue/:hospitalId/payment-methods', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const result = await analyticsService.getRevenueByPaymentMethod(req.params.hospitalId, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insurance revenue
router.get('/revenue/:hospitalId/insurance', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const result = await analyticsService.getInsuranceRevenue(req.params.hospitalId, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get operational KPIs
router.get('/kpis/:hospitalId', async (req, res) => {
  try {
    const result = await analyticsService.getOperationalKPIs(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive dashboard
router.get('/dashboard/:hospitalId', async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    
    // Return comprehensive mock dashboard data
    const dashboardData = {
      status: 'success',
      hospital_id: hospitalId,
      occupancy: {
        total_beds: 100,
        occupied_beds: 65,
        occupancy_rate: 65.0
      },
      patient_flow: {
        admissions_today: 12,
        discharges_today: 8,
        current_inpatients: 65,
        emergency_admissions: 5
      },
      revenue: {
        total_revenue: 2500000,
        cash_revenue: 1500000,
        insurance_revenue: 1000000,
        total_transactions: 150
      },
      kpis: {
        bed_occupancy_rate: 65,
        avg_length_of_stay: 4.5,
        active_staff: 85,
        staff_present_today: 78,
        patient_satisfaction_score: 4.2
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admission predictions
router.get('/predictions/admissions/:hospitalId', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const result = await analyticsService.predictAdmissions(req.params.hospitalId, days);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff productivity metrics
router.get('/staff-productivity/:hospitalId', async (req, res) => {
  try {
    const { department, period = 'week' } = req.query;
    const result = await analyticsService.getStaffProductivityMetrics(req.params.hospitalId, department, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get department performance
router.get('/department-performance/:hospitalId', async (req, res) => {
  try {
    const { department } = req.query;
    const result = await analyticsService.getDepartmentPerformance(req.params.hospitalId, department);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set up alerts
router.post('/alerts', async (req, res) => {
  try {
    const result = await analyticsService.setUpAlerts(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active alerts
router.get('/alerts/:hospitalId', async (req, res) => {
  try {
    const result = await analyticsService.getActiveAlerts(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
