const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const enhancedCRMService = require('../services/crm-enhanced.service');
const authMiddleware = require('../middleware/auth');

/**
 * Owner CRM Routes
 */

// Create owner contract
router.post('/owners/contracts',
  authMiddleware,
  [
    body('hospitalId').notEmpty(),
    body('ownerId').notEmpty(),
    body('contractType').isIn(['standard', 'premium', 'enterprise']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('revenueShare').isNumeric().isFloat({ min: 0, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const contract = await enhancedCRMService.createOwnerContract(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Process owner payout
router.post('/owners/:ownerId/payouts',
  authMiddleware,
  [
    body('period.start').isISO8601(),
    body('period.end').isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const payout = await enhancedCRMService.processOwnerPayout(
        req.params.ownerId,
        req.body.period
      );
      
      res.status(201).json({
        success: true,
        message: 'Payout processed successfully',
        data: payout
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Log owner communication
router.post('/owners/:ownerId/communications',
  authMiddleware,
  [
    body('communicationType').isIn(['email', 'call', 'meeting', 'notification']),
    body('subject').notEmpty(),
    body('message').notEmpty(),
    body('channel').isIn(['email', 'whatsapp', 'sms', 'in_app'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const communication = await enhancedCRMService.logOwnerCommunication({
        ownerId: req.params.ownerId,
        ...req.body
      });
      
      res.status(201).json({
        success: true,
        message: 'Communication logged successfully',
        data: communication
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Record owner satisfaction
router.post('/owners/:ownerId/satisfaction',
  authMiddleware,
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('category').isIn(['service', 'payment', 'support', 'platform', 'overall']),
    body('wouldRecommend').isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const satisfaction = await enhancedCRMService.recordOwnerSatisfaction(
        req.params.ownerId,
        req.body
      );
      
      res.status(201).json({
        success: true,
        message: 'Satisfaction feedback recorded',
        data: satisfaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Patient CRM Routes
 */

// Schedule appointment
router.post('/patients/appointments',
  authMiddleware,
  [
    body('patientId').notEmpty(),
    body('hospitalId').notEmpty(),
    body('doctorId').notEmpty(),
    body('appointmentDate').isISO8601(),
    body('appointmentTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('appointmentType').isIn(['consultation', 'follow_up', 'procedure', 'emergency'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const appointment = await enhancedCRMService.scheduleAppointment(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Appointment scheduled successfully',
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Collect patient feedback
router.post('/patients/:patientId/feedback',
  authMiddleware,
  [
    body('hospitalId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('wouldRecommend').isInt({ min: 0, max: 10 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const feedback = await enhancedCRMService.collectPatientFeedback({
        patientId: req.params.patientId,
        ...req.body
      });
      
      res.status(201).json({
        success: true,
        message: 'Feedback collected successfully',
        data: feedback
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Award loyalty points
router.post('/patients/:patientId/loyalty/award',
  authMiddleware,
  [
    body('points').isInt({ min: 1 }),
    body('reason').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await enhancedCRMService.awardLoyaltyPoints(
        req.params.patientId,
        req.body.points,
        req.body.reason
      );
      
      res.status(200).json({
        success: true,
        message: 'Loyalty points awarded',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Redeem loyalty reward
router.post('/patients/:patientId/loyalty/redeem',
  authMiddleware,
  [
    body('rewardId').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const redemption = await enhancedCRMService.redeemLoyaltyReward(
        req.params.patientId,
        req.body.rewardId
      );
      
      res.status(200).json({
        success: true,
        message: 'Reward redeemed successfully',
        data: redemption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Communication Campaign Routes
 */

// Create communication campaign
router.post('/campaigns',
  authMiddleware,
  [
    body('name').notEmpty(),
    body('targetAudience').isIn(['all_patients', 'high_value_patients', 'inactive_patients', 'all_owners']),
    body('channels').isArray(),
    body('message').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const campaign = await enhancedCRMService.createCommunicationCampaign(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Execute campaign
router.post('/campaigns/:campaignId/execute',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await enhancedCRMService.executeCampaign(req.params.campaignId);
      
      res.status(200).json({
        success: true,
        message: 'Campaign executed successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Analytics & Reporting Routes
 */

// Get CRM dashboard analytics
router.get('/analytics/dashboard',
  authMiddleware,
  async (req, res) => {
    try {
      const { period = '30days' } = req.query;
      
      // This would aggregate data from various CRM services
      const analytics = {
        owners: {
          total: 156,
          active: 148,
          newThisMonth: 12,
          averageSatisfaction: 4.3,
          totalPayouts: 15250000, // NGN
          pendingPayouts: 8
        },
        patients: {
          total: 15420,
          activeThisMonth: 3845,
          newRegistrations: 523,
          averageLoyaltyPoints: 425,
          appointmentsScheduled: 1256,
          appointmentNoShowRate: 0.08
        },
        communications: {
          totalSent: 45230,
          emailsSent: 28450,
          smsSent: 12340,
          whatsappSent: 4440,
          deliveryRate: 0.94,
          openRate: 0.68,
          clickRate: 0.23
        },
        feedback: {
          totalCollected: 3450,
          averageRating: 4.2,
          npsScore: 42,
          recommendationRate: 0.78,
          responseRate: 0.65
        },
        loyalty: {
          totalPointsAwarded: 523400,
          totalPointsRedeemed: 234500,
          activeMembers: 8234,
          tierDistribution: {
            platinum: 234,
            gold: 1245,
            silver: 3456,
            bronze: 3299
          }
        },
        campaigns: {
          totalCampaigns: 45,
          activeCampaigns: 5,
          completedThisMonth: 12,
          averageEngagement: 0.34,
          averageConversion: 0.12
        }
      };
      
      res.json({
        success: true,
        period,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get owner analytics
router.get('/analytics/owners/:ownerId',
  authMiddleware,
  async (req, res) => {
    try {
      const { period = '30days' } = req.query;
      
      const analytics = {
        revenue: {
          total: 4250000,
          thisMonth: 850000,
          growth: 0.15,
          averagePerPatient: 12500
        },
        patients: {
          total: 340,
          newThisMonth: 45,
          retention: 0.92,
          satisfaction: 4.4
        },
        payouts: {
          total: 2975000,
          pending: 425000,
          lastPayout: '2025-09-30',
          nextPayout: '2025-10-31'
        },
        performance: {
          occupancyRate: 0.78,
          averageStayLength: 3.2,
          readmissionRate: 0.05,
          qualityScore: 92
        }
      };
      
      res.json({
        success: true,
        ownerId: req.params.ownerId,
        period,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get patient journey analytics
router.get('/analytics/patients/:patientId/journey',
  authMiddleware,
  async (req, res) => {
    try {
      const journey = {
        registrationDate: '2024-06-15',
        totalVisits: 12,
        lastVisit: '2025-09-28',
        nextAppointment: '2025-10-15',
        loyaltyStatus: {
          tier: 'gold',
          points: 3450,
          lifetimePoints: 8750,
          rewardsRedeemed: 5
        },
        healthMetrics: {
          conditions: ['hypertension', 'diabetes'],
          medications: 4,
          allergies: ['penicillin'],
          lastCheckup: '2025-09-28'
        },
        engagement: {
          appointmentAttendance: 0.92,
          feedbackProvided: 8,
          averageRating: 4.5,
          communicationPreference: 'whatsapp'
        },
        financials: {
          totalSpent: 425000,
          insuranceCoverage: 0.70,
          outstandingBalance: 0,
          paymentMethod: 'insurance'
        }
      };
      
      res.json({
        success: true,
        patientId: req.params.patientId,
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
