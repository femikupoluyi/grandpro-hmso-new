// Complete CRM & Relationship Management Routes
const express = require('express');
const router = express.Router();
const crmService = require('../services/crm-complete.service');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// ==================== CRM DASHBOARD ====================

// Get CRM dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const result = await crmService.getCRMDashboard();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CRM dashboard',
      error: error.message
    });
  }
});

// ==================== OWNER CRM ROUTES ====================

// Create or update owner profile
router.post('/owners', [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^\+?234\d{10}$|^0\d{10}$/).withMessage('Invalid Nigerian phone number')
], validate, async (req, res) => {
  try {
    const result = await crmService.upsertOwnerProfile(req.body);
    res.status(result.action === 'created' ? 201 : 200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process owner profile',
      error: error.message
    });
  }
});

// Get all owners
router.get('/owners', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        ho.*,
        COUNT(DISTINCT h.id) as hospital_count,
        COUNT(DISTINCT c.id) as contract_count
      FROM hospital_owners ho
      LEFT JOIN hospitals h ON h.id::text = ANY(
        SELECT jsonb_array_elements_text(ho.hospital_ids::jsonb)
      )
      LEFT JOIN contracts c ON c.contract_id = ANY(
        SELECT jsonb_array_elements_text(ho.contract_ids::jsonb)
      )
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND ho.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` GROUP BY ho.id`;
    query += ` ORDER BY ho.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owners',
      error: error.message
    });
  }
});

// Get owner by ID
router.get('/owners/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { pool } = require('../config/database');
    
    const query = `
      SELECT * FROM hospital_owners WHERE id = $1
    `;
    
    const result = await pool.query(query, [ownerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner',
      error: error.message
    });
  }
});

// Record payout
router.post('/owners/payouts', [
  body('owner_id').notEmpty().withMessage('Owner ID is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('period_start').isISO8601().withMessage('Valid period start date is required'),
  body('period_end').isISO8601().withMessage('Valid period end date is required')
], validate, async (req, res) => {
  try {
    const result = await crmService.recordPayout(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record payout',
      error: error.message
    });
  }
});

// Get owner analytics
router.get('/owners/:ownerId/analytics', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { period = '30days' } = req.query;
    
    const result = await crmService.getOwnerAnalytics(ownerId, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner analytics',
      error: error.message
    });
  }
});

// Get owner payouts
router.get('/owners/:ownerId/payouts', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        op.*,
        h.name as hospital_name
      FROM owner_payouts op
      LEFT JOIN hospitals h ON op.hospital_id = h.id
      WHERE op.owner_id = $1
    `;
    
    const params = [ownerId];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND op.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY op.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
});

// ==================== PATIENT CRM ROUTES ====================

// Register or update patient
router.post('/patients', [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required')
], validate, async (req, res) => {
  try {
    const result = await crmService.upsertPatient(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process patient',
      error: error.message
    });
  }
});

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const { hospital_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        p.*,
        h.name as hospital_name,
        COUNT(DISTINCT a.id) as appointment_count,
        COUNT(DISTINCT f.id) as feedback_count
      FROM patients p
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      LEFT JOIN appointments a ON p.id = a.patient_id
      LEFT JOIN feedback f ON p.id = f.patient_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (hospital_id) {
      paramCount++;
      query += ` AND p.hospital_id = $${paramCount}`;
      params.push(hospital_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` GROUP BY p.id, h.name`;
    query += ` ORDER BY p.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
});

// Schedule appointment
router.post('/appointments', [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required'),
  body('appointment_date').isISO8601().withMessage('Valid appointment date is required'),
  body('appointment_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time format (HH:MM) is required'),
  body('department').notEmpty().withMessage('Department is required')
], validate, async (req, res) => {
  try {
    const result = await crmService.scheduleAppointment(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment',
      error: error.message
    });
  }
});

// Get appointments
router.get('/appointments', async (req, res) => {
  try {
    const { patient_id, hospital_id, status, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        h.name as hospital_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (patient_id) {
      paramCount++;
      query += ` AND a.patient_id = $${paramCount}`;
      params.push(patient_id);
    }
    
    if (hospital_id) {
      paramCount++;
      query += ` AND a.hospital_id = $${paramCount}`;
      params.push(hospital_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }
    
    if (date) {
      paramCount++;
      query += ` AND DATE(a.appointment_date) = $${paramCount}`;
      params.push(date);
    }
    
    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Submit feedback
router.post('/feedback', [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').notEmpty().withMessage('Comments are required')
], validate, async (req, res) => {
  try {
    const result = await crmService.submitFeedback(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Get feedback
router.get('/feedback', async (req, res) => {
  try {
    const { hospital_id, patient_id, rating, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        f.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        h.name as hospital_name
      FROM feedback f
      LEFT JOIN patients p ON f.patient_id = p.id
      LEFT JOIN hospitals h ON f.hospital_id = h.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (hospital_id) {
      paramCount++;
      query += ` AND f.hospital_id = $${paramCount}`;
      params.push(hospital_id);
    }
    
    if (patient_id) {
      paramCount++;
      query += ` AND f.patient_id = $${paramCount}`;
      params.push(patient_id);
    }
    
    if (rating) {
      paramCount++;
      query += ` AND f.rating = $${paramCount}`;
      params.push(rating);
    }
    
    query += ` ORDER BY f.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// ==================== LOYALTY PROGRAM ROUTES ====================

// Award loyalty points
router.post('/loyalty/award', [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be positive'),
  body('reason').notEmpty().withMessage('Reason is required')
], validate, async (req, res) => {
  try {
    const result = await crmService.awardLoyaltyPoints(
      req.body.patient_id,
      req.body.points,
      req.body.reason
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to award points',
      error: error.message
    });
  }
});

// Redeem loyalty points
router.post('/loyalty/redeem', [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('reward_id').notEmpty().withMessage('Reward ID is required')
], validate, async (req, res) => {
  try {
    const result = await crmService.redeemLoyaltyPoints(
      req.body.patient_id,
      req.body.reward_id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to redeem points',
      error: error.message
    });
  }
});

// Get loyalty rewards
router.get('/loyalty/rewards', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const query = `
      SELECT * FROM loyalty_rewards 
      WHERE is_active = true 
      ORDER BY points_required ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards',
      error: error.message
    });
  }
});

// ==================== COMMUNICATION CAMPAIGN ROUTES ====================

// Create campaign
router.post('/campaigns', [
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('type').notEmpty().withMessage('Campaign type is required'),
  body('message_template').notEmpty().withMessage('Message template is required'),
  body('channels').isArray().withMessage('Channels must be an array')
], validate, async (req, res) => {
  try {
    const result = await crmService.createCampaign(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// Get campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT * FROM communication_campaigns
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// Send campaign
router.post('/campaigns/:campaignId/send', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await crmService.sendCampaign(campaignId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send campaign',
      error: error.message
    });
  }
});

// Create reminder
router.post('/reminders', [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('reminder_date').isISO8601().withMessage('Valid reminder date is required'),
  body('type').notEmpty().withMessage('Reminder type is required')
], validate, async (req, res) => {
  try {
    const result = await crmService.createReminder(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create reminder',
      error: error.message
    });
  }
});

module.exports = router;
