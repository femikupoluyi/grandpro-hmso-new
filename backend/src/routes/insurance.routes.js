/**
 * Insurance/HMO Integration Routes
 */

const express = require('express');
const router = express.Router();
const InsuranceIntegration = require('../integrations/insuranceIntegration');

// Initialize insurance integration
const insurance = new InsuranceIntegration();

// Check patient eligibility
router.get('/eligibility/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { providerId } = req.query;
    
    // Mock eligibility check for demo
    const eligibility = {
      eligible: true,
      patientId,
      providerId: providerId || 'NHIS',
      coveragePercentage: 80,
      coverageLimit: 1000000,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      benefits: [
        'General Consultation',
        'Laboratory Tests',
        'Essential Drugs',
        'Emergency Care'
      ]
    };
    
    res.json({
      success: true,
      ...eligibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit insurance claim
router.post('/claims/submit', async (req, res) => {
  try {
    const claimData = req.body;
    
    // Mock claim submission for demo
    const claim = {
      claimId: `CLM-${Date.now()}`,
      status: 'submitted',
      submittedAt: new Date(),
      patientId: claimData.patientId,
      providerId: claimData.providerId || 'NHIS',
      amount: claimData.amount,
      services: claimData.services,
      diagnosisCodes: claimData.diagnosisCodes,
      estimatedProcessingTime: '3-5 business days',
      trackingUrl: `https://track.nhis.gov.ng/claims/CLM-${Date.now()}`
    };
    
    res.json({
      success: true,
      ...claim,
      message: 'Claim submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get claim status
router.get('/claims/status/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    
    // Mock claim status for demo
    const statuses = ['submitted', 'processing', 'approved', 'paid'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
      success: true,
      claimId,
      status: randomStatus,
      lastUpdated: new Date(),
      approvedAmount: randomStatus === 'approved' || randomStatus === 'paid' ? 20000 : null,
      paymentDate: randomStatus === 'paid' ? new Date() : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get pre-authorization
router.post('/preauth', async (req, res) => {
  try {
    const { patientId, procedure, estimatedCost } = req.body;
    
    // Mock pre-authorization for demo
    const preauth = {
      authorizationId: `AUTH-${Date.now()}`,
      patientId,
      procedure,
      estimatedCost,
      approvedAmount: estimatedCost * 0.8,
      status: 'approved',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      conditions: ['Valid for 30 days', 'Subject to medical necessity']
    };
    
    res.json({
      success: true,
      ...preauth,
      message: 'Pre-authorization approved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
