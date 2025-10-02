const express = require('express');
const { sql } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get main dashboard (root endpoint)
router.get('/', async (req, res) => {
  res.json({
    message: 'Dashboard data',
    stats: {
      totalHospitals: 156,
      activePatients: 15420,
      monthlyRevenue: 254000000,
      staffCount: 892,
      occupancyRate: 78.5,
      patientSatisfaction: 4.2
    },
    recentActivity: [
      { type: 'admission', hospital: 'Lagos General', time: new Date(Date.now() - 3600000) },
      { type: 'discharge', hospital: 'Abuja Medical', time: new Date(Date.now() - 7200000) },
      { type: 'appointment', hospital: 'Port Harcourt Clinic', time: new Date(Date.now() - 10800000) }
    ]
  });
});

// Get dashboard overview
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    // Get counts
    const hospitalCount = await sql`
      SELECT COUNT(*) as count FROM hospitals WHERE status = 'active'
    `;
    
    const userCount = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'patient' THEN 1 END) as patients,
        COUNT(CASE WHEN role IN ('doctor', 'nurse') THEN 1 END) as medical_staff,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active
      FROM users
    `;
    
    const contractCount = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'pending_signature' THEN 1 END) as pending
      FROM contracts
    `;
    
    const applicationCount = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
      FROM hospital_applications
    `;
    
    // Get recent activities
    const recentApplications = await sql`
      SELECT 
        id, hospital_name, owner_name, state, status, submitted_at
      FROM hospital_applications
      ORDER BY submitted_at DESC
      LIMIT 5
    `;
    
    const recentHospitals = await sql`
      SELECT 
        id, name, city, state, status, created_at
      FROM hospitals
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    // Nigerian states distribution
    const stateDistribution = await sql`
      SELECT 
        state, 
        COUNT(*) as hospital_count
      FROM hospitals
      WHERE status = 'active'
      GROUP BY state
      ORDER BY hospital_count DESC
      LIMIT 10
    `;
    
    res.json({
      overview: {
        hospitals: {
          total: hospitalCount[0].count,
          active: hospitalCount[0].count
        },
        users: userCount[0],
        contracts: contractCount[0],
        applications: applicationCount[0]
      },
      recentActivities: {
        applications: recentApplications,
        hospitals: recentHospitals
      },
      stateDistribution,
      metrics: {
        revenue: {
          monthly: 15000000, // Sample data in Naira
          yearly: 180000000
        },
        patientSatisfaction: 4.5,
        averageOccupancy: 75
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get analytics by date range
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, hospitalId } = req.query;
    
    let hospitalFilter = '';
    const params = [];
    
    if (hospitalId) {
      params.push(hospitalId);
      hospitalFilter = ` AND hospital_id = $${params.length}`;
    }
    
    // Sample analytics data
    const analytics = {
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      },
      metrics: {
        newHospitals: Math.floor(Math.random() * 10) + 1,
        newPatients: Math.floor(Math.random() * 500) + 100,
        totalRevenue: Math.floor(Math.random() * 50000000) + 10000000,
        averagePatientStay: 4.2,
        bedOccupancyRate: 68.5,
        staffUtilization: 85.3
      },
      trends: {
        daily: [], // Would be populated with actual data
        weekly: [],
        monthly: []
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
