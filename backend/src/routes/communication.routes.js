const express = require('express');
const router = express.Router();
const communicationService = require('../services/communication.service');

// Send communication
router.post('/send', async (req, res) => {
  try {
    const result = await communicationService.sendCommunication(req.body);
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

// Send appointment reminder
router.post('/appointment-reminder/:appointmentId', async (req, res) => {
  try {
    const result = await communicationService.sendAppointmentReminder(req.params.appointmentId);
    res.json({
      success: true,
      data: result,
      message: 'Appointment reminder sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send feedback request
router.post('/feedback-request/:encounterId', async (req, res) => {
  try {
    const result = await communicationService.sendFeedbackRequest(req.params.encounterId);
    res.json({
      success: true,
      data: result,
      message: 'Feedback request sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send loyalty notification
router.post('/loyalty-notification', async (req, res) => {
  try {
    const { patientId, points, reason } = req.body;
    const result = await communicationService.sendLoyaltyNotification(patientId, points, reason);
    res.json({
      success: true,
      data: result,
      message: 'Loyalty notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send campaign
router.post('/campaign', async (req, res) => {
  try {
    const result = await communicationService.sendCampaign(req.body);
    res.json({
      success: true,
      data: result,
      message: `Campaign sent to ${result.successfulDeliveries} recipients`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get communication history
router.get('/history/:recipientType/:recipientId', async (req, res) => {
  try {
    const { recipientType, recipientId } = req.params;
    const result = await communicationService.getCommunicationHistory(recipientId, recipientType);
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

// Get communication templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'appointment_reminder',
        name: 'Appointment Reminder',
        channels: ['SMS', 'WHATSAPP', 'EMAIL'],
        variables: ['patient_name', 'doctor_name', 'date', 'time', 'hospital'],
        content: 'Dear {patient_name}, reminder for your appointment with {doctor_name} on {date} at {time} at {hospital}.'
      },
      {
        id: 'feedback_request',
        name: 'Feedback Request',
        channels: ['SMS', 'EMAIL'],
        variables: ['patient_name', 'hospital', 'link'],
        content: 'Dear {patient_name}, thank you for visiting {hospital}. Please share your feedback: {link}'
      },
      {
        id: 'loyalty_notification',
        name: 'Loyalty Points Update',
        channels: ['SMS', 'WHATSAPP'],
        variables: ['patient_name', 'points', 'balance', 'reason'],
        content: 'Hi {patient_name}! You earned {points} points for {reason}. New balance: {balance}'
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        channels: ['SMS', 'EMAIL'],
        variables: ['patient_name', 'amount', 'due_date'],
        content: 'Dear {patient_name}, payment of ₦{amount} is due on {due_date}. Please pay to avoid service interruption.'
      },
      {
        id: 'health_tip',
        name: 'Health Tip',
        channels: ['WHATSAPP'],
        variables: ['patient_name', 'tip'],
        content: 'Health Tip for {patient_name}: {tip}'
      },
      {
        id: 'vaccination_reminder',
        name: 'Vaccination Reminder',
        channels: ['SMS', 'WHATSAPP', 'EMAIL'],
        variables: ['patient_name', 'vaccine', 'due_date'],
        content: 'Dear {patient_name}, your {vaccine} vaccination is due on {due_date}. Please schedule an appointment.'
      },
      {
        id: 'medication_reminder',
        name: 'Medication Reminder',
        channels: ['SMS', 'WHATSAPP'],
        variables: ['patient_name', 'medication', 'time', 'instructions'],
        content: 'Hi {patient_name}, time to take your {medication}. {instructions}'
      },
      {
        id: 'insurance_expiry',
        name: 'Insurance Expiry Notice',
        channels: ['SMS', 'EMAIL'],
        variables: ['patient_name', 'provider', 'expiry_date'],
        content: 'Dear {patient_name}, your {provider} insurance expires on {expiry_date}. Please renew to maintain coverage.'
      }
    ];

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

// Get campaign statistics
router.get('/campaigns/stats', async (req, res) => {
  try {
    const stats = {
      total_campaigns: 24,
      active_campaigns: 2,
      total_recipients: 45000,
      avg_delivery_rate: 0.94,
      channels_usage: {
        sms: 0.65,
        whatsapp: 0.75,
        email: 0.45
      },
      recent_campaigns: [
        {
          id: 1,
          name: 'Hypertension Awareness Week',
          audience: 'PATIENTS',
          recipients: 3500,
          delivery_rate: 0.92,
          channels: ['SMS', 'WHATSAPP'],
          date: '2025-10-01'
        },
        {
          id: 2,
          name: 'COVID-19 Booster Reminder',
          audience: 'PATIENTS',
          recipients: 8000,
          delivery_rate: 0.95,
          channels: ['SMS', 'EMAIL'],
          date: '2025-09-15'
        },
        {
          id: 3,
          name: 'Hospital Owner Newsletter',
          audience: 'OWNERS',
          recipients: 150,
          delivery_rate: 0.98,
          channels: ['EMAIL'],
          date: '2025-09-01'
        }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
