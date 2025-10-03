/**
 * Complete CRM Routes
 * Comprehensive Owner and Patient CRM functionality
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const {
  Owner,
  Patient,
  CommunicationLog,
  Campaign,
  Appointment,
  Feedback,
  LoyaltyTransaction,
  Payout
} = require('../models/crm-enhanced.model');
const { Op } = require('sequelize');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============= OWNER CRM ROUTES =============

// Create new owner
router.post('/owners', [
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^(\+234|0)[789]\d{9}$/),
  body('hospital_id').optional().isInt()
], validate, async (req, res) => {
  try {
    const ownerData = {
      ...req.body,
      owner_code: `OWN-${Date.now()}`
    };
    
    const owner = await Owner.create(ownerData);
    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: owner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create owner',
      error: error.message
    });
  }
});

// Get all owners with filters
router.get('/owners', async (req, res) => {
  try {
    const { status, payment_status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { owner_code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    const { count, rows } = await Owner.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: Payout,
        as: 'payouts',
        limit: 5,
        order: [['created_at', 'DESC']]
      }]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
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

// Get owner statistics
router.get('/owners/stats', async (req, res) => {
  try {
    const totalOwners = await Owner.count();
    const activeOwners = await Owner.count({ where: { status: 'active' } });
    const totalLifetimeValue = await Owner.sum('lifetime_value') || 0;
    const averageSatisfaction = await Owner.aggregate('satisfaction_score', 'avg') || 0;
    
    const paymentStats = await Owner.findAll({
      attributes: [
        'payment_status',
        [Owner.sequelize.fn('COUNT', Owner.sequelize.col('id')), 'count']
      ],
      group: ['payment_status']
    });
    
    res.json({
      success: true,
      data: {
        totalOwners,
        activeOwners,
        inactiveOwners: totalOwners - activeOwners,
        totalLifetimeValue,
        averageSatisfaction: parseFloat(averageSatisfaction).toFixed(2),
        paymentStats: paymentStats.reduce((acc, stat) => {
          acc[stat.payment_status] = stat.dataValues.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner statistics',
      error: error.message
    });
  }
});

// Update owner
router.put('/owners/:id', [
  param('id').isInt()
], validate, async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }
    
    await owner.update(req.body);
    res.json({
      success: true,
      message: 'Owner updated successfully',
      data: owner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update owner',
      error: error.message
    });
  }
});

// ============= PATIENT CRM ROUTES =============

// Register new patient
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
    const patientData = {
      ...req.body,
      patient_code: `PAT-${Date.now()}`
    };
    
    const patient = await Patient.create(patientData);
    
    // Award welcome loyalty points
    if (patient) {
      await LoyaltyTransaction.create({
        patient_id: patient.id,
        transaction_type: 'earned',
        points: 100,
        balance_after: 100,
        description: 'Welcome bonus',
        reference_type: 'registration'
      });
      
      patient.loyalty_points = 100;
      await patient.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register patient',
      error: error.message
    });
  }
});

// Get all patients with filters
router.get('/patients', async (req, res) => {
  try {
    const { status, loyalty_tier, search, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (loyalty_tier) where.loyalty_tier = loyalty_tier;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { patient_code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    const { count, rows } = await Patient.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
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

// Get patient by ID
router.get('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: Appointment,
          as: 'appointments',
          limit: 10,
          order: [['appointment_date', 'DESC']]
        },
        {
          model: LoyaltyTransaction,
          as: 'loyaltyTransactions',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
});

// Update patient loyalty tier
router.post('/patients/:id/loyalty-tier', [
  param('id').isInt(),
  body('tier').isIn(['bronze', 'silver', 'gold', 'platinum'])
], validate, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const oldTier = patient.loyalty_tier;
    patient.loyalty_tier = req.body.tier;
    await patient.save();
    
    // Award bonus points for tier upgrade
    if (req.body.tier !== oldTier) {
      const bonusPoints = {
        silver: 200,
        gold: 500,
        platinum: 1000
      };
      
      if (bonusPoints[req.body.tier]) {
        await LoyaltyTransaction.create({
          patient_id: patient.id,
          transaction_type: 'earned',
          points: bonusPoints[req.body.tier],
          balance_after: patient.loyalty_points + bonusPoints[req.body.tier],
          description: `Tier upgrade to ${req.body.tier}`,
          reference_type: 'tier_upgrade'
        });
        
        patient.loyalty_points += bonusPoints[req.body.tier];
        await patient.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Loyalty tier updated successfully',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update loyalty tier',
      error: error.message
    });
  }
});

// ============= APPOINTMENT ROUTES =============

// Schedule appointment
router.post('/appointments', [
  body('patient_id').isInt(),
  body('hospital_id').isInt(),
  body('appointment_date').isISO8601(),
  body('appointment_time').matches(/^\d{2}:\d{2}$/),
  body('type').isIn(['consultation', 'follow_up', 'procedure', 'emergency', 'telemedicine'])
], validate, async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      appointment_code: `APT-${Date.now()}`
    };
    
    const appointment = await Appointment.create(appointmentData);
    
    // Send appointment confirmation
    await CommunicationLog.create({
      recipient_type: 'patient',
      recipient_id: req.body.patient_id,
      channel: 'sms',
      message_type: 'appointment_confirmation',
      subject: 'Appointment Scheduled',
      content: `Your appointment has been scheduled for ${req.body.appointment_date} at ${req.body.appointment_time}`,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment',
      error: error.message
    });
  }
});

// Get appointments with filters
router.get('/appointments', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      patient_id, 
      hospital_id,
      date_from,
      date_to,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (patient_id) where.patient_id = patient_id;
    if (hospital_id) where.hospital_id = hospital_id;
    if (date_from || date_to) {
      where.appointment_date = {};
      if (date_from) where.appointment_date[Op.gte] = date_from;
      if (date_to) where.appointment_date[Op.lte] = date_to;
    }
    
    const offset = (page - 1) * limit;
    const { count, rows } = await Appointment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']],
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'first_name', 'last_name', 'phone']
      }]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
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

// Send appointment reminders
router.post('/appointments/send-reminders', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    const appointments = await Appointment.findAll({
      where: {
        appointment_date: {
          [Op.between]: [tomorrow, endOfTomorrow]
        },
        status: ['scheduled', 'confirmed'],
        reminder_sent: false
      },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'first_name', 'last_name', 'phone', 'communication_preferences']
      }]
    });
    
    let remindersSent = 0;
    
    for (const appointment of appointments) {
      if (appointment.patient && appointment.patient.communication_preferences.sms) {
        await CommunicationLog.create({
          recipient_type: 'patient',
          recipient_id: appointment.patient_id,
          channel: 'sms',
          message_type: 'appointment_reminder',
          subject: 'Appointment Reminder',
          content: `Reminder: You have an appointment tomorrow at ${appointment.appointment_time}. Reply CONFIRM to confirm or CANCEL to cancel.`,
          status: 'pending'
        });
        
        appointment.reminder_sent = true;
        appointment.reminder_sent_at = new Date();
        await appointment.save();
        
        remindersSent++;
      }
    }
    
    res.json({
      success: true,
      message: `${remindersSent} reminders sent successfully`,
      data: {
        totalAppointments: appointments.length,
        remindersSent
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send appointment reminders',
      error: error.message
    });
  }
});

// ============= CAMPAIGN ROUTES =============

// Create campaign
router.post('/campaigns', [
  body('name').notEmpty().trim(),
  body('type').isIn(['promotional', 'educational', 'reminder', 'follow_up', 'survey']),
  body('target_audience').isIn(['all_patients', 'all_owners', 'specific_segment', 'custom']),
  body('message_template').notEmpty()
], validate, async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    
    const offset = (page - 1) * limit;
    const { count, rows } = await Campaign.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
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

// Launch campaign
router.post('/campaigns/:id/launch', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Campaign cannot be launched in current status'
      });
    }
    
    // Get target recipients
    let recipients = [];
    if (campaign.target_audience === 'all_patients') {
      recipients = await Patient.findAll({
        where: { status: 'active' },
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'communication_preferences']
      });
    } else if (campaign.target_audience === 'all_owners') {
      recipients = await Owner.findAll({
        where: { status: 'active' },
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
      });
    }
    
    // Create communication logs for each recipient
    let messageCount = 0;
    for (const recipient of recipients) {
      for (const channel of campaign.channels) {
        const canSend = channel === 'email' ? recipient.email : 
                       channel === 'sms' || channel === 'whatsapp' ? recipient.phone : false;
        
        if (canSend) {
          await CommunicationLog.create({
            recipient_type: campaign.target_audience === 'all_patients' ? 'patient' : 'owner',
            recipient_id: recipient.id,
            campaign_id: campaign.id,
            channel,
            message_type: campaign.type,
            subject: campaign.name,
            content: campaign.message_template.replace('{name}', `${recipient.first_name} ${recipient.last_name}`),
            status: 'pending'
          });
          messageCount++;
        }
      }
    }
    
    campaign.status = 'active';
    campaign.start_date = new Date();
    campaign.total_recipients = recipients.length;
    campaign.messages_sent = messageCount;
    await campaign.save();
    
    res.json({
      success: true,
      message: 'Campaign launched successfully',
      data: {
        campaign,
        recipientsTargeted: recipients.length,
        messagesQueued: messageCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to launch campaign',
      error: error.message
    });
  }
});

// ============= FEEDBACK ROUTES =============

// Submit feedback
router.post('/feedback', [
  body('source_type').isIn(['patient', 'owner', 'staff']),
  body('source_id').isInt(),
  body('type').isIn(['complaint', 'suggestion', 'compliment', 'survey_response']),
  body('message').notEmpty()
], validate, async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    
    // Send acknowledgement
    await CommunicationLog.create({
      recipient_type: req.body.source_type,
      recipient_id: req.body.source_id,
      channel: 'email',
      message_type: 'feedback_acknowledgement',
      subject: 'Thank you for your feedback',
      content: 'We have received your feedback and will respond within 24-48 hours.',
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Get feedback with filters
router.get('/feedback', async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    
    const offset = (page - 1) * limit;
    const { count, rows } = await Feedback.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
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

// ============= PAYOUT ROUTES =============

// Create payout for owner
router.post('/payouts', [
  body('owner_id').isInt(),
  body('period_start').isISO8601(),
  body('period_end').isISO8601(),
  body('gross_revenue').isFloat({ min: 0 }),
  body('net_amount').isFloat({ min: 0 })
], validate, async (req, res) => {
  try {
    const payoutData = {
      ...req.body,
      payout_code: `PAY-${Date.now()}`
    };
    
    const payout = await Payout.create(payoutData);
    
    // Update owner's last contact date
    await Owner.update(
      { last_contact_date: new Date() },
      { where: { id: req.body.owner_id } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Payout created successfully',
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payout',
      error: error.message
    });
  }
});

// Get payouts for owner
router.get('/owners/:ownerId/payouts', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { owner_id: req.params.ownerId };
    
    if (status) where.status = status;
    
    const offset = (page - 1) * limit;
    const { count, rows } = await Payout.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
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

// Approve payout
router.post('/payouts/:id/approve', async (req, res) => {
  try {
    const payout = await Payout.findByPk(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }
    
    if (payout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payout cannot be approved in current status'
      });
    }
    
    payout.status = 'approved';
    payout.approved_at = new Date();
    payout.approved_by = req.user?.id || 1; // Get from auth middleware
    await payout.save();
    
    res.json({
      success: true,
      message: 'Payout approved successfully',
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve payout',
      error: error.message
    });
  }
});

// ============= COMMUNICATION LOG ROUTES =============

// Get communication history
router.get('/communications', async (req, res) => {
  try {
    const { 
      recipient_type,
      recipient_id,
      channel,
      status,
      page = 1,
      limit = 20 
    } = req.query;
    
    const where = {};
    if (recipient_type) where.recipient_type = recipient_type;
    if (recipient_id) where.recipient_id = recipient_id;
    if (channel) where.channel = channel;
    if (status) where.status = status;
    
    const offset = (page - 1) * limit;
    const { count, rows } = await CommunicationLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: Campaign,
        as: 'campaign',
        attributes: ['id', 'name', 'type']
      }]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communication history',
      error: error.message
    });
  }
});

// Send custom message
router.post('/communications/send', [
  body('recipient_type').isIn(['patient', 'owner', 'staff']),
  body('recipient_id').isInt(),
  body('channel').isIn(['sms', 'email', 'whatsapp']),
  body('subject').optional(),
  body('content').notEmpty()
], validate, async (req, res) => {
  try {
    const communication = await CommunicationLog.create({
      ...req.body,
      message_type: 'custom',
      status: 'pending'
    });
    
    // Here you would integrate with actual SMS/Email/WhatsApp providers
    // For now, we'll simulate sending
    setTimeout(async () => {
      communication.status = 'sent';
      communication.sent_at = new Date();
      await communication.save();
    }, 1000);
    
    res.json({
      success: true,
      message: 'Message queued for sending',
      data: communication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

module.exports = router;
