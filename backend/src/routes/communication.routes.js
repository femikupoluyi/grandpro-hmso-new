const express = require('express');
const router = express.Router();
const communicationService = require('../services/communication.service');
const { body, param, query, validationResult } = require('express-validator');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

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

// Send single communication
router.post('/send', [
  body('recipient').notEmpty().withMessage('Recipient is required'),
  body('channel').isIn(['EMAIL', 'SMS', 'WHATSAPP']).withMessage('Invalid channel'),
  body('message').notEmpty().withMessage('Message is required')
], validate, async (req, res) => {
  try {
    const { recipient, channel, message, subject, metadata } = req.body;
    
    let result;
    switch (channel) {
      case 'SMS':
        result = await communicationService.sendSMS(recipient, message, metadata);
        break;
      case 'WHATSAPP':
        result = await communicationService.sendWhatsApp(recipient, message, null, metadata);
        break;
      case 'EMAIL':
        result = await communicationService.sendEmail(recipient, subject || 'Notification', message, null, metadata);
        break;
    }

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

// Send bulk communications
router.post('/send-bulk', [
  body('recipients').isArray().withMessage('Recipients must be an array'),
  body('channel').isIn(['EMAIL', 'SMS', 'WHATSAPP']).withMessage('Invalid channel'),
  body('message').notEmpty().withMessage('Message is required')
], validate, async (req, res) => {
  try {
    const { recipients, channel, message, options } = req.body;
    
    const results = await communicationService.sendBulk(
      recipients,
      channel,
      message,
      options || {}
    );

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

// Create campaign
router.post('/campaigns', [
  body('hospital_id').notEmpty(),
  body('campaign_name').notEmpty(),
  body('campaign_type').isIn(['HEALTH_PROMOTION', 'APPOINTMENT_REMINDER', 'FOLLOW_UP', 'MARKETING', 'SURVEY']),
  body('target_audience').isIn(['ALL_PATIENTS', 'ACTIVE_PATIENTS', 'INACTIVE_PATIENTS', 'SPECIFIC_CONDITION', 'CUSTOM']),
  body('message_template').notEmpty(),
  body('channels').isArray()
], validate, async (req, res) => {
  try {
    const campaignData = req.body;
    
    const result = await sql.query(`
      INSERT INTO communication_campaigns (
        hospital_id,
        campaign_name,
        campaign_type,
        target_audience,
        audience_criteria,
        message_template,
        channels,
        scheduled_date,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      campaignData.hospital_id,
      campaignData.campaign_name,
      campaignData.campaign_type,
      campaignData.target_audience,
      JSON.stringify(campaignData.audience_criteria || {}),
      campaignData.message_template,
      campaignData.channels,
      campaignData.scheduled_date || null,
      'DRAFT',
      campaignData.created_by || null
    ]);

    res.status(201).json({
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

// Get campaigns
router.get('/campaigns', [
  query('hospital_id').optional(),
  query('status').optional().isIn(['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
], validate, async (req, res) => {
  try {
    let query = 'SELECT * FROM communication_campaigns WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (req.query.hospital_id) {
      query += ` AND hospital_id = $${++paramIndex}`;
      params.push(req.query.hospital_id);
    }

    if (req.query.status) {
      query += ` AND status = $${++paramIndex}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY created_at DESC';

    const campaigns = await sql.query(query, params);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Execute campaign
router.post('/campaigns/:campaignId/execute', [
  param('campaignId').isNumeric()
], validate, async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Get campaign details
    const campaignResult = await sql.query(`
      SELECT * FROM communication_campaigns WHERE id = $1
    `, [campaignId]);

    if (campaignResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = campaignResult[0];

    // Update campaign status
    await sql.query(`
      UPDATE communication_campaigns
      SET status = 'IN_PROGRESS', updated_at = NOW()
      WHERE id = $1
    `, [campaignId]);

    // Get target recipients based on audience criteria
    let recipientQuery;
    switch (campaign.target_audience) {
      case 'ALL_PATIENTS':
        recipientQuery = `
          SELECT p.id, p.email, p.phone, p."firstName", p."lastName"
          FROM "Patient" p
          WHERE p."hospitalId" = $1
        `;
        break;
      case 'ACTIVE_PATIENTS':
        recipientQuery = `
          SELECT DISTINCT p.id, p.email, p.phone, p."firstName", p."lastName"
          FROM "Patient" p
          JOIN "Appointment" a ON p.id = a."patientId"
          WHERE p."hospitalId" = $1
          AND a.date >= CURRENT_DATE - INTERVAL '90 days'
        `;
        break;
      default:
        recipientQuery = `
          SELECT p.id, p.email, p.phone, p."firstName", p."lastName"
          FROM "Patient" p
          WHERE p."hospitalId" = $1
        `;
    }

    const recipients = await sql.query(recipientQuery, [campaign.hospital_id]);

    // Process message template
    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        const personalizedMessage = communicationService.replaceTemplateVars(
          campaign.message_template,
          {
            patientName: `${recipient.firstName} ${recipient.lastName}`,
            hospitalName: 'GrandPro Hospital'
          }
        );

        // Send via each channel
        for (const channel of campaign.channels) {
          await communicationService.sendToChannel(
            recipient,
            channel,
            personalizedMessage,
            { campaignId }
          );
        }

        // Log recipient
        await sql.query(`
          INSERT INTO campaign_recipients (
            campaign_id, patient_id, status, sent_at
          ) VALUES ($1, $2, 'SENT', NOW())
        `, [campaignId, recipient.id]);

        successCount++;
      } catch (error) {
        failedCount++;
        await sql.query(`
          INSERT INTO campaign_recipients (
            campaign_id, patient_id, status, error_message
          ) VALUES ($1, $2, 'FAILED', $3)
        `, [campaignId, recipient.id, error.message]);
      }
    }

    // Update campaign status
    await sql.query(`
      UPDATE communication_campaigns
      SET 
        status = 'COMPLETED',
        total_recipients = $1,
        successful_sends = $2,
        failed_sends = $3,
        updated_at = NOW()
      WHERE id = $4
    `, [recipients.length, successCount, failedCount, campaignId]);

    res.json({
      success: true,
      data: {
        campaignId,
        totalRecipients: recipients.length,
        successful: successCount,
        failed: failedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Process scheduled communications
router.post('/process-scheduled', async (req, res) => {
  try {
    const results = await communicationService.processScheduledCommunications();
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

// Get communication templates
router.get('/templates', [
  query('type').optional()
], validate, async (req, res) => {
  try {
    const templates = await communicationService.getTemplates(req.query.type);
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get communication statistics
router.get('/statistics', [
  query('hospital_id').optional(),
  query('period').optional().isIn(['today', '7days', '30days', '90days'])
], validate, async (req, res) => {
  try {
    const { hospital_id, period = '30days' } = req.query;
    
    let interval;
    switch (period) {
      case 'today':
        interval = '1 day';
        break;
      case '7days':
        interval = '7 days';
        break;
      case '90days':
        interval = '90 days';
        break;
      default:
        interval = '30 days';
    }

    // Get owner communication stats
    let ownerQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'READ' THEN 1 END) as read,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
      FROM owner_communications
      WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
    `;
    
    // Get patient communication stats
    let patientQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'READ' THEN 1 END) as read,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
      FROM patient_communications
      WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
    `;

    const params = [];
    if (hospital_id) {
      ownerQuery += ' AND hospital_id = $1';
      patientQuery += ' AND hospital_id = $1';
      params.push(hospital_id);
    }

    const [ownerStats, patientStats] = await Promise.all([
      sql.query(ownerQuery, params),
      sql.query(patientQuery, params)
    ]);

    // Get campaign stats
    let campaignQuery = `
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(total_recipients) as total_recipients,
        SUM(successful_sends) as successful_sends,
        SUM(failed_sends) as failed_sends
      FROM communication_campaigns
      WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
    `;
    
    if (hospital_id) {
      campaignQuery += ' AND hospital_id = $1';
    }
    
    const campaignStats = await sql.query(campaignQuery, params);

    res.json({
      success: true,
      data: {
        period,
        ownerCommunications: ownerStats[0],
        patientCommunications: patientStats[0],
        campaigns: campaignStats[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test communication endpoint
router.post('/test', [
  body('channel').isIn(['EMAIL', 'SMS', 'WHATSAPP']),
  body('recipient').notEmpty(),
  body('message').notEmpty()
], validate, async (req, res) => {
  try {
    const { channel, recipient, message } = req.body;
    
    let result;
    switch (channel) {
      case 'SMS':
        result = await communicationService.sendSMS(recipient, `[TEST] ${message}`);
        break;
      case 'WHATSAPP':
        result = await communicationService.sendWhatsApp(recipient, `[TEST] ${message}`);
        break;
      case 'EMAIL':
        result = await communicationService.sendEmail(
          recipient,
          '[TEST] Communication Test',
          `<h2>Test Message</h2><p>${message}</p>`
        );
        break;
    }

    res.json({
      success: true,
      message: 'Test communication sent',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
