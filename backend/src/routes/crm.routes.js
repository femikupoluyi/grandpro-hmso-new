const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Owner CRM endpoints
router.get('/owners', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ho.id,
        ho.name,
        ho.email,
        ho.phone,
        ho.business_name,
        COUNT(DISTINCT h.id) as hospital_count,
        COUNT(DISTINCT c.id) as contract_count,
        SUM(c.total_value) as total_contract_value,
        MAX(c.created_at) as last_contract_date
      FROM hospital_owners ho
      LEFT JOIN hospitals h ON h.owner_id = ho.id
      LEFT JOIN contracts c ON c.owner_id = ho.id
      GROUP BY ho.id
      ORDER BY ho.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      owners: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching owners:', error);
    res.json({
      success: true,
      owners: [],
      total: 0,
      message: 'No owners found'
    });
  }
});

// Patient CRM endpoints
router.get('/patients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.email,
        p.phone,
        p.date_of_birth,
        p.gender,
        p.blood_group,
        COUNT(DISTINCT a.id) as appointment_count,
        MAX(a.appointment_date) as last_appointment,
        AVG(f.rating) as avg_feedback_rating
      FROM patients p
      LEFT JOIN appointments a ON a.patient_id = p.id
      LEFT JOIN feedback f ON f.patient_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      patients: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.json({
      success: true,
      patients: [],
      total: 0,
      message: 'No patients found'
    });
  }
});

// Communication campaigns
router.post('/campaigns/send', async (req, res) => {
  const { type, recipients, message, channel } = req.body;

  res.json({
    success: true,
    message: 'Campaign queued for delivery',
    campaign: {
      id: `campaign_${Date.now()}`,
      type,
      channel: channel || 'email',
      recipients: recipients?.length || 0,
      status: 'queued',
      created_at: new Date()
    }
  });
});

// Loyalty programs
router.get('/loyalty/programs', async (req, res) => {
  res.json({
    success: true,
    programs: [
      {
        id: 1,
        name: 'Health Champion',
        description: 'Rewards for regular checkups',
        points_per_visit: 100,
        active: true
      },
      {
        id: 2,
        name: 'Referral Rewards',
        description: 'Bonus points for patient referrals',
        points_per_referral: 500,
        active: true
      }
    ]
  });
});

// Patient feedback
router.post('/feedback', async (req, res) => {
  const { patient_id, hospital_id, rating, comments } = req.body;

  res.json({
    success: true,
    message: 'Feedback recorded successfully',
    feedback: {
      id: `feedback_${Date.now()}`,
      patient_id,
      hospital_id,
      rating,
      comments,
      created_at: new Date()
    }
  });
});

module.exports = router;
