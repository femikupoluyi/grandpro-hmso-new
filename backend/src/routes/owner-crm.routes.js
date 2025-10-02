const express = require('express');
const router = express.Router();
const ownerCRMService = require('../services/owner-crm.service');
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

// Get owner profile
router.get('/:ownerId/profile', [
  param('ownerId').notEmpty().withMessage('Owner ID is required')
], validate, async (req, res) => {
  try {
    const profile = await ownerCRMService.getOwnerProfile(req.params.ownerId);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(error.message === 'Owner not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

// Create payout
router.post('/payouts', [
  body('owner_id').notEmpty().withMessage('Owner ID is required'),
  body('hospital_id').notEmpty().withMessage('Hospital ID is required'),
  body('amount_naira').isNumeric().withMessage('Amount must be numeric'),
  body('payout_period').matches(/^\d{4}-\d{2}$/).withMessage('Period must be YYYY-MM format')
], validate, async (req, res) => {
  try {
    const payout = await ownerCRMService.createPayout(req.body);
    res.status(201).json({
      success: true,
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Process monthly payouts (admin endpoint)
router.post('/payouts/process-monthly', async (req, res) => {
  try {
    const { period } = req.body;
    const results = await ownerCRMService.processMonthlyPayouts(period);
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

// Update payout status
router.patch('/payouts/:payoutId/status', [
  param('payoutId').notEmpty().withMessage('Valid payout ID required'),
  body('status').isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const payout = await ownerCRMService.updatePayoutStatus(
      req.params.payoutId,
      req.body.status,
      req.body
    );
    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get payout history
router.get('/payouts', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validate, async (req, res) => {
  try {
    const history = await ownerCRMService.getPayoutHistory(req.query);
    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send communication to owner
router.post('/:ownerId/communications', [
  param('ownerId').notEmpty(),
  body('channel').isIn(['EMAIL', 'SMS', 'WHATSAPP']).withMessage('Invalid channel'),
  body('message').notEmpty().withMessage('Message is required')
], validate, async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { channel, message, subject } = req.body;

    // Get owner details
    const owner = await ownerCRMService.getOwnerProfile(ownerId);
    
    // Send communication
    let result;
    switch (channel) {
      case 'SMS':
        result = await communicationService.sendSMS(owner.phone, message);
        break;
      case 'WHATSAPP':
        result = await communicationService.sendWhatsApp(owner.phone, message);
        break;
      case 'EMAIL':
        result = await communicationService.sendEmail(owner.email, subject || 'Notification', message);
        break;
    }

    // Log communication
    await ownerCRMService.logCommunication({
      owner_id: ownerId,
      hospital_id: owner.hospitalId,
      communication_type: channel,
      direction: 'OUTBOUND',
      subject,
      message,
      sent_by: req.user?.id || 'system'
    });

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
router.get('/:ownerId/communications', [
  param('ownerId').notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
  try {
    const history = await ownerCRMService.getCommunicationHistory(
      req.params.ownerId,
      req.query.limit || 50
    );
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

// Submit satisfaction survey
router.post('/:ownerId/satisfaction', [
  param('ownerId').notEmpty(),
  body('ratings.overall').isInt({ min: 1, max: 5 }),
  body('ratings.communication').isInt({ min: 1, max: 5 }),
  body('ratings.support').isInt({ min: 1, max: 5 }),
  body('ratings.payment').isInt({ min: 1, max: 5 })
], validate, async (req, res) => {
  try {
    const survey = await ownerCRMService.createSatisfactionSurvey({
      owner_id: req.params.ownerId,
      ...req.body
    });
    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get satisfaction metrics
router.get('/satisfaction/metrics', async (req, res) => {
  try {
    const metrics = await ownerCRMService.getSatisfactionMetrics(req.query.hospital_id);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Bulk communication to owners
router.post('/communications/bulk', [
  body('owner_ids').isArray().withMessage('Owner IDs must be an array'),
  body('channel').isIn(['EMAIL', 'SMS', 'WHATSAPP']).withMessage('Invalid channel'),
  body('message').notEmpty().withMessage('Message is required')
], validate, async (req, res) => {
  try {
    const { owner_ids, channel, message, subject } = req.body;
    
    // Get owner details
    const owners = await Promise.all(
      owner_ids.map(id => ownerCRMService.getOwnerProfile(id))
    );

    // Prepare recipients
    const recipients = owners.map(owner => ({
      id: owner.id,
      email: owner.email,
      phone: owner.phone
    }));

    // Send bulk communication
    const results = await communicationService.sendBulk(
      recipients,
      channel,
      message,
      { subject }
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

module.exports = router;
