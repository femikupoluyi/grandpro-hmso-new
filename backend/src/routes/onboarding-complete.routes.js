// Complete Digital Sourcing & Partner Onboarding Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const onboardingService = require('../services/onboarding.service');
const { body, param, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept documents and images
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX allowed.'));
    }
  }
});

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

// Get onboarding dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await onboardingService.getOnboardingDashboard(req.query);
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Submit new application
router.post('/applications', [
  body('hospital_name').notEmpty().withMessage('Hospital name is required'),
  body('registration_number').notEmpty().withMessage('Registration number is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone_number').matches(/^\+?234\d{10}$|^0\d{10}$/).withMessage('Invalid Nigerian phone number'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('owner_first_name').notEmpty().withMessage('Owner first name is required'),
  body('owner_last_name').notEmpty().withMessage('Owner last name is required'),
  body('owner_email').isEmail().withMessage('Valid owner email is required'),
  body('owner_phone').matches(/^\+?234\d{10}$|^0\d{10}$/).withMessage('Invalid owner phone number'),
  body('bed_capacity').isInt({ min: 1 }).withMessage('Bed capacity must be a positive number'),
  body('staff_count').isInt({ min: 1 }).withMessage('Staff count must be a positive number'),
  body('years_in_operation').isInt({ min: 0 }).withMessage('Years in operation must be non-negative'),
  body('annual_revenue').isFloat({ min: 0 }).withMessage('Annual revenue must be non-negative')
], validate, async (req, res) => {
  try {
    const result = await onboardingService.submitApplication(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// Get application by ID
router.get('/applications/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { pool } = require('../config/database');
    
    const query = `
      SELECT 
        ha.*,
        os.current_stage,
        os.overall_progress,
        COUNT(d.id) as documents_count
      FROM hospital_applications ha
      LEFT JOIN onboarding_status os ON ha.application_id = os.application_id
      LEFT JOIN documents d ON ha.application_id = d.application_id
      WHERE ha.application_id = $1
      GROUP BY ha.id, ha.application_id, os.current_stage, os.overall_progress
    `;
    
    const result = await pool.query(query, [applicationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
});

// Get all applications with filters
router.get('/applications', async (req, res) => {
  try {
    const { status, state, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        ha.*,
        os.current_stage,
        os.overall_progress
      FROM hospital_applications ha
      LEFT JOIN onboarding_status os ON ha.application_id = os.application_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND ha.status = $${paramCount}`;
      params.push(status);
    }
    
    if (state) {
      paramCount++;
      query += ` AND ha.state = $${paramCount}`;
      params.push(state);
    }
    
    query += ` ORDER BY ha.submitted_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM hospital_applications ha
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 0;
    
    if (status) {
      countParamCount++;
      countQuery += ` AND ha.status = $${countParamCount}`;
      countParams.push(status);
    }
    
    if (state) {
      countParamCount++;
      countQuery += ` AND ha.state = $${countParamCount}`;
      countParams.push(state);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Upload document
router.post('/documents/upload', upload.single('document'), [
  body('application_id').notEmpty().withMessage('Application ID is required'),
  body('document_type').notEmpty().withMessage('Document type is required')
], validate, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const result = await onboardingService.uploadDocument(
      req.body.application_id,
      req.body.document_type,
      req.file
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Get documents for application
router.get('/documents/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { pool } = require('../config/database');
    
    const result = await pool.query(
      'SELECT * FROM documents WHERE application_id = $1 ORDER BY uploaded_at DESC',
      [applicationId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
});

// Run evaluation
router.post('/evaluation/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await onboardingService.evaluateApplication(applicationId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate application',
      error: error.message
    });
  }
});

// Get evaluation scores
router.get('/evaluation/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { pool } = require('../config/database');
    
    const scoresResult = await pool.query(
      'SELECT * FROM evaluation_scores WHERE application_id = $1',
      [applicationId]
    );
    
    const appResult = await pool.query(
      'SELECT evaluation_score, status FROM hospital_applications WHERE application_id = $1',
      [applicationId]
    );
    
    res.json({
      success: true,
      data: {
        scores: scoresResult.rows,
        totalScore: appResult.rows[0]?.evaluation_score,
        status: appResult.rows[0]?.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation scores',
      error: error.message
    });
  }
});

// Get evaluation criteria
router.get('/evaluation/criteria', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const result = await pool.query(
      'SELECT * FROM evaluation_criteria WHERE is_active = true ORDER BY weight DESC'
    );
    
    if (result.rows.length === 0) {
      // Return default criteria
      const defaultCriteria = [
        { name: 'Infrastructure', weight: 25, description: 'Hospital facilities and capacity' },
        { name: 'Financial_Stability', weight: 20, description: 'Revenue and financial health' },
        { name: 'Compliance', weight: 25, description: 'Regulatory compliance and documentation' },
        { name: 'Geographic_Coverage', weight: 15, description: 'Location strategic importance' },
        { name: 'Technology_Readiness', weight: 15, description: 'IT infrastructure and digital readiness' }
      ];
      
      return res.json({
        success: true,
        data: defaultCriteria
      });
    }
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation criteria',
      error: error.message
    });
  }
});

// Generate contract
router.post('/contract/generate/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await onboardingService.generateContract(applicationId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate contract',
      error: error.message
    });
  }
});

// Get contract
router.get('/contract/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { pool } = require('../config/database');
    
    const result = await pool.query(
      `SELECT c.*, ha.hospital_name, ha.owner_first_name, ha.owner_last_name
       FROM contracts c
       JOIN hospital_applications ha ON c.application_id = ha.application_id
       WHERE c.contract_id = $1`,
      [contractId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract',
      error: error.message
    });
  }
});

// Sign contract
router.post('/contract/sign', [
  body('contract_id').notEmpty().withMessage('Contract ID is required'),
  body('signer_name').notEmpty().withMessage('Signer name is required'),
  body('signer_email').isEmail().withMessage('Valid signer email is required'),
  body('signature').notEmpty().withMessage('Signature is required')
], validate, async (req, res) => {
  try {
    const signatureData = {
      ...req.body,
      ip_address: req.ip
    };
    
    const result = await onboardingService.signContract(
      req.body.contract_id,
      signatureData
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sign contract',
      error: error.message
    });
  }
});

// Get onboarding checklist
router.get('/checklist/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { pool } = require('../config/database');
    
    const result = await pool.query(
      'SELECT * FROM onboarding_checklist WHERE application_id = $1 ORDER BY id',
      [applicationId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch checklist',
      error: error.message
    });
  }
});

// Get onboarding status
router.get('/status/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { pool } = require('../config/database');
    
    const result = await pool.query(
      'SELECT * FROM onboarding_status WHERE application_id = $1',
      [applicationId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status',
      error: error.message
    });
  }
});

// Statistics endpoint
router.get('/statistics', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending,
        AVG(CAST(evaluation_score AS FLOAT)) as avg_score
      FROM hospital_applications
    `;
    
    const result = await pool.query(statsQuery);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
