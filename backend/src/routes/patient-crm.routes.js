const express = require('express');
const router = express.Router();
const patientCRMService = require('../services/patient-crm.service');
const communicationService = require('../services/communication.service');
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

// Get all patients (root endpoint)
router.get('/', async (req, res) => {
  try {
    // Mock data for now - replace with actual database query
    const patients = [
      {
        id: 1,
        patient_id: 'PAT2025001',
        first_name: 'Chioma',
        last_name: 'Nwosu',
        email: 'chioma.nwosu@example.com',
        phone: '+234 806 555 1234',
        age: 32,
        gender: 'Female',
        blood_group: 'O+',
        last_visit: '2025-10-01',
        loyalty_points: 250,
        status: 'active'
      },
      {
        id: 2,
        patient_id: 'PAT2025002',
        first_name: 'Tunde',
        last_name: 'Bakare',
        email: 'tunde.bakare@example.com',
        phone: '+234 807 666 2345',
        age: 45,
        gender: 'Male',
        blood_group: 'A+',
        last_visit: '2025-09-28',
        loyalty_points: 180,
        status: 'active'
      },
      {
        id: 3,
        patient_id: 'PAT2025003',
        first_name: 'Amina',
        last_name: 'Yusuf',
        email: 'amina.yusuf@example.com',
        phone: '+234 808 999 3456',
        age: 28,
        gender: 'Female',
        blood_group: 'B+',
        last_visit: '2025-10-03',
        loyalty_points: 320,
        status: 'active'
      }
    ];
    
    res.json({
      success: true,
      data: patients,
      total: patients.length
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

// Register patient profile
router.post('/profile', [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required'),
  body('emergency_contact.phone').optional().matches(/^\+234\d{10}$/),
  body('nin').optional().isLength({ min: 11, max: 11 })
], validate, async (req, res) => {
  try {
    const profile = await patientCRMService.registerPatientProfile(req.body);
    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get patient profile
router.get('/:patientId/profile', [
  param('patientId').notEmpty()
], validate, async (req, res) => {
  try {
    const profile = await patientCRMService.getPatientProfile(req.params.patientId);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(error.message === 'Patient not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

// Schedule appointment
router.post('/appointments', [
  body('patient_id').notEmpty(),
  body('hospital_id').notEmpty(),
  body('doctor_id').notEmpty(),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Time must be HH:MM format')
], validate, async (req, res) => {
  try {
    const appointment = await patientCRMService.scheduleAppointment(req.body);
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Process appointment reminders (scheduled job endpoint)
router.post('/appointments/reminders/process', async (req, res) => {
  try {
    const results = await patientCRMService.processAppointmentReminders();
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Submit feedback
router.post('/:patientId/feedback', [
  param('patientId').notEmpty(),
  body('hospital_id').notEmpty(),
  body('feedback_type').optional().isIn(['SERVICE', 'FACILITY', 'STAFF', 'GENERAL', 'COMPLAINT']),
  body('ratings.overall').optional().isInt({ min: 1, max: 5 }),
  body('feedback_text').notEmpty().withMessage('Feedback text is required')
], validate, async (req, res) => {
  try {
    const feedback = await patientCRMService.submitFeedback({
      patient_id: req.params.patientId,
      ...req.body
    });
    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get feedback summary
router.get('/feedback/summary', [
  query('hospital_id').notEmpty(),
  query('period').optional().isIn(['7 days', '30 days', '90 days', '1 year'])
], validate, async (req, res) => {
  try {
    const summary = await patientCRMService.getFeedbackSummary(
      req.query.hospital_id,
      req.query.period || '30 days'
    );
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get loyalty points
router.get('/:patientId/loyalty', [
  param('patientId').notEmpty()
], validate, async (req, res) => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    const result = await sql.query(`
      SELECT 
        lp.*,
        (SELECT COUNT(*) FROM loyalty_transactions WHERE patient_id = $1) as total_transactions
      FROM loyalty_points lp
      WHERE lp.patient_id = $1
    `, [req.params.patientId]);

    res.json({
      success: true,
      data: result[0] || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get loyalty transactions
router.get('/:patientId/loyalty/transactions', [
  param('patientId').notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    const transactions = await sql.query(`
      SELECT *
      FROM loyalty_transactions
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [req.params.patientId, req.query.limit || 50]);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Award loyalty points
router.post('/:patientId/loyalty/award', [
  param('patientId').notEmpty(),
  body('hospital_id').notEmpty(),
  body('points').isInt({ min: 1 }).withMessage('Points must be positive'),
  body('description').notEmpty()
], validate, async (req, res) => {
  try {
    const result = await patientCRMService.awardLoyaltyPoints(
      req.params.patientId,
      req.body.hospital_id,
      req.body.points,
      req.body.reference_type || 'MANUAL',
      req.body.reference_id || null,
      req.body.description
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get available rewards
router.get('/loyalty/rewards', [
  query('hospital_id').notEmpty(),
  query('patient_id').optional()
], validate, async (req, res) => {
  try {
    const rewards = await patientCRMService.getAvailableRewards(
      req.query.hospital_id,
      req.query.patient_id
    );
    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Redeem reward
router.post('/:patientId/loyalty/redeem', [
  param('patientId').notEmpty(),
  body('reward_id').isInt().withMessage('Valid reward ID required'),
  body('hospital_id').notEmpty()
], validate, async (req, res) => {
  try {
    const redemption = await patientCRMService.redeemPoints(
      req.params.patientId,
      req.body.reward_id,
      req.body.hospital_id
    );
    res.json({
      success: true,
      data: redemption
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Send communication to patient
router.post('/:patientId/communications', [
  param('patientId').notEmpty(),
  body('channel').isIn(['EMAIL', 'SMS', 'WHATSAPP']),
  body('message').notEmpty()
], validate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { channel, message, subject, category } = req.body;

    // Get patient details
    const patient = await patientCRMService.getPatientProfile(patientId);
    
    // Send communication
    let result;
    switch (channel) {
      case 'SMS':
        result = await communicationService.sendSMS(patient.phone, message);
        break;
      case 'WHATSAPP':
        result = await communicationService.sendWhatsApp(patient.phone, message);
        break;
      case 'EMAIL':
        result = await communicationService.sendEmail(patient.email, subject || 'Notification', message);
        break;
    }

    // Log communication
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    await sql.query(`
      INSERT INTO patient_communications (
        patient_id,
        hospital_id,
        communication_type,
        category,
        subject,
        message,
        status,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      patientId,
      patient.hospitalId || req.body.hospital_id,
      channel,
      category || 'GENERAL',
      subject,
      message,
      'SENT'
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get communication history
router.get('/:patientId/communications', [
  param('patientId').notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    const history = await sql.query(`
      SELECT *
      FROM patient_communications
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [req.params.patientId, req.query.limit || 50]);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update communication preferences
router.patch('/:patientId/preferences', [
  param('patientId').notEmpty(),
  body('communication_preferences').isObject()
], validate, async (req, res) => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    const result = await sql.query(`
      UPDATE patient_profiles
      SET communication_preferences = $1,
          updated_at = NOW()
      WHERE patient_id = $2
      RETURNING *
    `, [JSON.stringify(req.body.communication_preferences), req.params.patientId]);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Patient Appointments
router.get('/appointments', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.*,
                p.patient_number,
                h.name as hospital_name
            FROM appointments a
            LEFT JOIN patients p ON p.id = a.patient_id
            LEFT JOIN hospitals h ON h.id = a.hospital_id
            ORDER BY a.appointment_date DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch appointments'
        });
    }
});

// Loyalty Programs
router.get('/loyalty', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                lp.*,
                p.patient_number
            FROM loyalty_programs lp
            LEFT JOIN patients p ON p.id = lp.patient_id
            ORDER BY lp.points DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            tiers: {
                bronze: result.rows.filter(r => r.tier === 'Bronze').length,
                silver: result.rows.filter(r => r.tier === 'Silver').length,
                gold: result.rows.filter(r => r.tier === 'Gold').length,
                platinum: result.rows.filter(r => r.tier === 'Platinum').length
            }
        });
    } catch (error) {
        console.error('Error fetching loyalty programs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch loyalty programs'
        });
    }
});

module.exports = router;
