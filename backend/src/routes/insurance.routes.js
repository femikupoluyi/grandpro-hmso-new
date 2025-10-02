const express = require('express');
const router = express.Router();

// Mock insurance providers data
const insuranceProviders = [
  {
    id: 1,
    name: 'NHIS Nigeria',
    type: 'Government',
    coverage_types: ['Basic', 'Maternal', 'Child Health'],
    active: true,
    integration_status: 'active'
  },
  {
    id: 2,
    name: 'Hygeia HMO',
    type: 'Private HMO',
    coverage_types: ['Basic', 'Premium', 'Corporate'],
    active: true,
    integration_status: 'active'
  },
  {
    id: 3,
    name: 'Avon Healthcare',
    type: 'Private HMO',
    coverage_types: ['Individual', 'Family', 'Corporate'],
    active: true,
    integration_status: 'pending'
  },
  {
    id: 4,
    name: 'AXA Mansard Health',
    type: 'Private Insurance',
    coverage_types: ['Comprehensive', 'Premium'],
    active: true,
    integration_status: 'active'
  }
];

// Get all insurance providers
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: insuranceProviders,
    total: insuranceProviders.length
  });
});

// Submit insurance claim
router.post('/claims/submit', async (req, res) => {
  const { provider_id, patient_id, hospital_id, services, amount } = req.body;

  res.json({
    success: true,
    message: 'Claim submitted successfully',
    claim: {
      id: `CLM${Date.now()}`,
      provider_id,
      patient_id,
      hospital_id,
      services,
      amount,
      status: 'pending',
      submitted_at: new Date(),
      expected_response: '3-5 business days'
    }
  });
});

// Check claim status
router.get('/claims/:claimId/status', (req, res) => {
  const { claimId } = req.params;
  
  res.json({
    success: true,
    claim: {
      id: claimId,
      status: 'processing',
      submitted_at: new Date(Date.now() - 86400000),
      last_updated: new Date(),
      progress: 60,
      notes: 'Under review by insurance provider'
    }
  });
});

// Verify insurance coverage
router.post('/coverage/verify', async (req, res) => {
  const { provider_id, member_number, service_code } = req.body;

  res.json({
    success: true,
    coverage: {
      is_covered: true,
      coverage_percentage: 80,
      copay_amount: 5000,
      deductible_remaining: 10000,
      pre_authorization_required: service_code?.startsWith('SURG'),
      member_status: 'active',
      validity: {
        from: new Date(Date.now() - 30 * 86400000),
        to: new Date(Date.now() + 335 * 86400000)
      }
    }
  });
});

// Get authorization
router.post('/authorization/request', async (req, res) => {
  const { provider_id, member_number, service_details, urgency } = req.body;

  res.json({
    success: true,
    authorization: {
      id: `AUTH${Date.now()}`,
      status: urgency === 'emergency' ? 'approved' : 'pending',
      valid_until: new Date(Date.now() + 7 * 86400000),
      services_approved: service_details,
      notes: urgency === 'emergency' 
        ? 'Emergency authorization granted' 
        : 'Standard review in progress'
    }
  });
});

// HMO enrollment
router.post('/hmo/enroll', async (req, res) => {
  const { patient_id, hmo_id, plan_type } = req.body;

  res.json({
    success: true,
    enrollment: {
      id: `ENR${Date.now()}`,
      patient_id,
      hmo_id,
      plan_type,
      member_number: `HMO${Date.now().toString().slice(-8)}`,
      effective_date: new Date(),
      status: 'active'
    }
  });
});

module.exports = router;
