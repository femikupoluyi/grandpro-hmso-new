const express = require('express');
const router = express.Router();
const emrService = require('../services/emr-enhanced.service');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'EMR API is working',
    endpoints: {
      patients: {
        register: 'POST /api/emr/patients',
        list: 'GET /api/emr/patients',
        getById: 'GET /api/emr/patients/:id',
        history: 'GET /api/emr/patients/:id/history'
      },
      records: {
        create: 'POST /api/emr/records',
        get: 'GET /api/emr/records/:id'
      },
      prescriptions: {
        create: 'POST /api/emr/prescriptions',
        getByPatient: 'GET /api/emr/prescriptions/patient/:patientId'
      },
      lab: {
        request: 'POST /api/emr/lab-requests',
        results: 'POST /api/emr/lab-results',
        getByPatient: 'GET /api/emr/lab-results/patient/:patientId'
      },
      referrals: {
        create: 'POST /api/emr/referrals',
        getByPatient: 'GET /api/emr/referrals/patient/:patientId'
      }
    }
  });
});

// Patient registration
router.post('/patients', async (req, res) => {
  try {
    const {
      first_name, last_name, date_of_birth, gender, phone, email,
      address, city, state, blood_group, genotype, allergies,
      chronic_conditions, emergency_contact_name, emergency_contact_phone,
      hospital_id
    } = req.body;
    
    const query = `
      INSERT INTO patients (
        first_name, last_name, date_of_birth, gender, phone, email,
        address, city, state, blood_group, genotype, allergies,
        chronic_conditions, emergency_contact_name, emergency_contact_phone,
        hospital_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      first_name, last_name, date_of_birth, gender, phone, email,
      address, city, state || 'Lagos', blood_group || null, genotype || null, 
      allergies || 'None', chronic_conditions || 'None',
      emergency_contact_name || null, emergency_contact_phone || null,
      hospital_id
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json({
      status: 'success',
      message: 'Patient registered successfully',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const { hospital_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Direct database query for now
    const query = hospital_id ? 
      `SELECT * FROM patients WHERE hospital_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3` :
      `SELECT * FROM patients ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    
    const params = hospital_id ? [hospital_id, limit, offset] : [limit, offset];
    const result = await pool.query(query, params);
    
    res.json({
      status: 'success',
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
router.get('/patients/:id', async (req, res) => {
  try {
    const result = await emrService.getPatientById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient history
router.get('/patients/:id/history', async (req, res) => {
  try {
    const result = await emrService.getPatientHistory(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create medical record
router.post('/records', async (req, res) => {
  try {
    const result = await emrService.createMedicalRecord(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medical record
router.get('/records/:id', async (req, res) => {
  try {
    const result = await emrService.getMedicalRecord(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create prescription
router.post('/prescriptions', async (req, res) => {
  try {
    const result = await emrService.createPrescription(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prescriptions by patient
router.get('/prescriptions/patient/:patientId', async (req, res) => {
  try {
    const result = await emrService.getPrescriptionsByPatient(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lab request
router.post('/lab-requests', async (req, res) => {
  try {
    const result = await emrService.createLabRequest(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit lab results
router.post('/lab-results', async (req, res) => {
  try {
    const result = await emrService.submitLabResults(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lab results by patient
router.get('/lab-results/patient/:patientId', async (req, res) => {
  try {
    const result = await emrService.getLabResultsByPatient(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create referral
router.post('/referrals', async (req, res) => {
  try {
    const result = await emrService.createReferral(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get referrals by patient
router.get('/referrals/patient/:patientId', async (req, res) => {
  try {
    const result = await emrService.getReferralsByPatient(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get clinical alerts
router.get('/alerts/patient/:patientId', async (req, res) => {
  try {
    const result = await emrService.getClinicalAlerts(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
