const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-enhanced.service');
const { authenticateToken } = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Billing API is working',
    endpoints: {
      accounts: {
        create: 'POST /api/billing/accounts',
        get: 'GET /api/billing/accounts/:patientId'
      },
      invoices: {
        create: 'POST /api/billing/invoices',
        get: 'GET /api/billing/invoices/:id',
        list: 'GET /api/billing/invoices'
      },
      payments: {
        process: 'POST /api/billing/payments',
        history: 'GET /api/billing/payments/history/:patientId'
      },
      insurance: {
        claim: 'POST /api/billing/insurance-claims',
        status: 'GET /api/billing/insurance-claims/:id'
      },
      nhis: {
        billing: 'POST /api/billing/nhis',
        claims: 'GET /api/billing/nhis/claims/:patientId'
      },
      hmo: {
        billing: 'POST /api/billing/hmo',
        authorization: 'POST /api/billing/hmo/authorization'
      }
    }
  });
});

// Create billing account
router.post('/accounts', async (req, res) => {
  try {
    const result = await billingService.createBillingAccount(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get billing account
router.get('/accounts/:patientId', async (req, res) => {
  try {
    const result = await billingService.getBillingAccount(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const result = await billingService.createInvoice(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const result = await billingService.getInvoice(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List invoices
router.get('/invoices', async (req, res) => {
  try {
    const { hospital_id, patient_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await billingService.getInvoices({
      hospital_id,
      patient_id,
      status,
      limit,
      offset
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process payment
router.post('/payments', async (req, res) => {
  try {
    const result = await billingService.processPayment(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
router.get('/payments/history/:patientId', async (req, res) => {
  try {
    const result = await billingService.getPaymentHistory(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit insurance claim
router.post('/insurance-claims', async (req, res) => {
  try {
    const result = await billingService.submitInsuranceClaim(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insurance claim status
router.get('/insurance-claims/:id', async (req, res) => {
  try {
    const result = await billingService.getInsuranceClaimStatus(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NHIS billing
router.post('/nhis', async (req, res) => {
  try {
    const result = await billingService.processNHISBilling(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get NHIS claims
router.get('/nhis/claims/:patientId', async (req, res) => {
  try {
    const result = await billingService.getNHISClaims(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HMO billing
router.post('/hmo', async (req, res) => {
  try {
    const result = await billingService.processHMOBilling(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HMO authorization
router.post('/hmo/authorization', async (req, res) => {
  try {
    const result = await billingService.requestHMOAuthorization(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { hospital_id, start_date, end_date } = req.query;
    const result = await billingService.getRevenueAnalytics({
      hospital_id,
      start_date,
      end_date
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get outstanding payments
router.get('/outstanding/:hospitalId', async (req, res) => {
  try {
    const result = await billingService.getOutstandingPayments(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
