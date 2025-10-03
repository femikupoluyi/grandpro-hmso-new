/**
 * Simplified CRM Routes using direct SQL
 * Avoids Sequelize association issues
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============= OWNER CRM ROUTES =============

// Get all owners
router.get('/owners', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, COUNT(p.id) as payout_count, SUM(p.net_amount) as total_payouts
      FROM crm_owners o
      LEFT JOIN crm_payouts p ON o.id = p.owner_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching owners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owners',
      error: error.message
    });
  }
});

// Get owner statistics
router.get('/owners/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_owners,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_owners,
        AVG(satisfaction_score) as avg_satisfaction,
        SUM(lifetime_value) as total_lifetime_value,
        COUNT(CASE WHEN payment_status = 'current' THEN 1 END) as current_payments,
        COUNT(CASE WHEN payment_status = 'overdue' THEN 1 END) as overdue_payments
      FROM crm_owners
    `);
    
    res.json({
      success: true,
      data: {
        totalOwners: parseInt(stats.rows[0].total_owners),
        activeOwners: parseInt(stats.rows[0].active_owners),
        averageSatisfaction: parseFloat(stats.rows[0].avg_satisfaction || 0).toFixed(2),
        totalLifetimeValue: parseFloat(stats.rows[0].total_lifetime_value || 0),
        paymentStats: {
          current: parseInt(stats.rows[0].current_payments),
          overdue: parseInt(stats.rows[0].overdue_payments)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching owner stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner statistics',
      error: error.message
    });
  }
});

// Create owner
router.post('/owners', [
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^(\+234|0)[789]\d{9}$/)
], validate, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, hospital_id, nin } = req.body;
    const owner_code = `OWN-${Date.now()}`;
    
    const result = await pool.query(`
      INSERT INTO crm_owners (
        owner_code, first_name, last_name, email, phone, nin, hospital_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [owner_code, first_name, last_name, email, phone, nin, hospital_id]);
    
    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create owner',
      error: error.message
    });
  }
});

// ============= PATIENT CRM ROUTES =============

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const queryParams = [limit, offset];
    
    if (search) {
      whereClause = `WHERE 
        first_name ILIKE $3 OR 
        last_name ILIKE $3 OR 
        email ILIKE $3 OR 
        phone ILIKE $3`;
      queryParams.push(`%${search}%`);
    }
    
    const result = await pool.query(`
      SELECT * FROM crm_patients
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);
    
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM crm_patients ${whereClause}
    `, search ? [`%${search}%`] : []);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
});

// Register patient
router.post('/patients/register', [
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('phone').matches(/^(\+234|0)[789]\d{9}$/),
  body('date_of_birth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('address').notEmpty(),
  body('city').notEmpty(),
  body('state').notEmpty()
], validate, async (req, res) => {
  try {
    const patient_code = `PAT-${Date.now()}`;
    const {
      first_name, last_name, middle_name, email, phone,
      date_of_birth, gender, address, city, state, lga
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO crm_patients (
        patient_code, first_name, last_name, middle_name, email, phone,
        date_of_birth, gender, address, city, state, lga, loyalty_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      patient_code, first_name, last_name, middle_name, email, phone,
      date_of_birth, gender, address, city, state, lga, 100
    ]);
    
    // Award welcome bonus
    await pool.query(`
      INSERT INTO crm_loyalty_transactions (
        patient_id, transaction_type, points, balance_after, description
      ) VALUES ($1, $2, $3, $4, $5)
    `, [result.rows[0].id, 'earned', 100, 100, 'Welcome bonus']);
    
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register patient',
      error: error.message
    });
  }
});

// Get patient by ID
router.get('/patients/:id', async (req, res) => {
  try {
    const patient = await pool.query(
      'SELECT * FROM crm_patients WHERE id = $1',
      [req.params.id]
    );
    
    if (patient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const appointments = await pool.query(
      'SELECT * FROM crm_appointments WHERE patient_id = $1 ORDER BY appointment_date DESC LIMIT 10',
      [req.params.id]
    );
    
    const loyaltyTxns = await pool.query(
      'SELECT * FROM crm_loyalty_transactions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );
    
    res.json({
      success: true,
      data: {
        ...patient.rows[0],
        appointments: appointments.rows,
        loyaltyTransactions: loyaltyTxns.rows
      }
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
});

// ============= APPOINTMENT ROUTES =============

// Get appointments
router.get('/appointments', async (req, res) => {
  try {
    const { status, type, patient_id, hospital_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;
    
    if (status) {
      whereConditions.push(`status = $${paramCounter++}`);
      queryParams.push(status);
    }
    if (type) {
      whereConditions.push(`type = $${paramCounter++}`);
      queryParams.push(type);
    }
    if (patient_id) {
      whereConditions.push(`a.patient_id = $${paramCounter++}`);
      queryParams.push(patient_id);
    }
    if (hospital_id) {
      whereConditions.push(`a.hospital_id = $${paramCounter++}`);
      queryParams.push(hospital_id);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    queryParams.push(limit);
    queryParams.push(offset);
    
    const result = await pool.query(`
      SELECT a.*, p.first_name, p.last_name, p.phone as patient_phone
      FROM crm_appointments a
      LEFT JOIN crm_patients p ON a.patient_id = p.id
      ${whereClause}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT $${paramCounter++} OFFSET $${paramCounter}
    `, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Schedule appointment
router.post('/appointments', [
  body('patient_id').isInt(),
  body('hospital_id').isInt(),
  body('appointment_date').isISO8601(),
  body('appointment_time').matches(/^\d{2}:\d{2}/),
  body('type').isIn(['consultation', 'follow_up', 'procedure', 'emergency', 'telemedicine'])
], validate, async (req, res) => {
  try {
    const appointment_code = `APT-${Date.now()}`;
    const {
      patient_id, hospital_id, department_id, doctor_id,
      appointment_date, appointment_time, type, reason
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO crm_appointments (
        appointment_code, patient_id, hospital_id, department_id, doctor_id,
        appointment_date, appointment_time, type, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      appointment_code, patient_id, hospital_id, department_id, doctor_id,
      appointment_date, appointment_time, type, reason
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment',
      error: error.message
    });
  }
});

// ============= CAMPAIGN ROUTES =============

// Get campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM crm_campaigns ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// Create campaign
router.post('/campaigns', [
  body('name').notEmpty().trim(),
  body('type').isIn(['promotional', 'educational', 'reminder', 'follow_up', 'survey']),
  body('target_audience').isIn(['all_patients', 'all_owners', 'specific_segment', 'custom']),
  body('message_template').notEmpty()
], validate, async (req, res) => {
  try {
    const { name, description, type, target_audience, message_template } = req.body;
    
    const result = await pool.query(`
      INSERT INTO crm_campaigns (
        name, description, type, target_audience, message_template
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, type, target_audience, message_template]);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// ============= FEEDBACK ROUTES =============

// Get feedback
router.get('/feedback', async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;
    
    if (status) {
      whereConditions.push(`status = $${paramCounter++}`);
      queryParams.push(status);
    }
    if (type) {
      whereConditions.push(`type = $${paramCounter++}`);
      queryParams.push(type);
    }
    if (priority) {
      whereConditions.push(`priority = $${paramCounter++}`);
      queryParams.push(priority);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const result = await pool.query(`
      SELECT * FROM crm_feedback
      ${whereClause}
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// Submit feedback
router.post('/feedback', [
  body('source_type').isIn(['patient', 'owner', 'staff']),
  body('source_id').isInt(),
  body('type').isIn(['complaint', 'suggestion', 'compliment', 'survey_response']),
  body('message').notEmpty()
], validate, async (req, res) => {
  try {
    const {
      source_type, source_id, hospital_id, type,
      category, rating, subject, message, priority
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO crm_feedback (
        source_type, source_id, hospital_id, type, category,
        rating, subject, message, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      source_type, source_id, hospital_id, type, category,
      rating, subject, message, priority || 'medium'
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// ============= PAYOUT ROUTES =============

// Get payouts for owner
router.get('/owners/:ownerId/payouts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM crm_payouts WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.params.ownerId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
});

// Create payout
router.post('/payouts', [
  body('owner_id').isInt(),
  body('period_start').isISO8601(),
  body('period_end').isISO8601(),
  body('gross_revenue').isFloat({ min: 0 }),
  body('net_amount').isFloat({ min: 0 })
], validate, async (req, res) => {
  try {
    const payout_code = `PAY-${Date.now()}`;
    const {
      owner_id, contract_id, period_start, period_end,
      gross_revenue, deductions, net_amount, bank_name,
      account_number, account_name
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO crm_payouts (
        payout_code, owner_id, contract_id, period_start, period_end,
        gross_revenue, deductions, net_amount, bank_name,
        account_number, account_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      payout_code, owner_id, contract_id, period_start, period_end,
      gross_revenue, deductions || 0, net_amount, bank_name,
      account_number, account_name
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Payout created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payout',
      error: error.message
    });
  }
});

// ============= COMMUNICATION ROUTES =============

// Get communication logs
router.get('/communications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cl.*, c.name as campaign_name
      FROM crm_communication_logs cl
      LEFT JOIN crm_campaigns c ON cl.campaign_id = c.id
      ORDER BY cl.created_at DESC
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communications',
      error: error.message
    });
  }
});

module.exports = router;
