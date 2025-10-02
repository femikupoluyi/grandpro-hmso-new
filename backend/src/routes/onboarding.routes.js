const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { sql, pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const onboardingService = require('../services/onboarding.service');
const documentService = require('../services/document.service');
const contractService = require('../services/contract.service');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

/**
 * @route   POST /api/onboarding/register
 * @desc    Register hospital owner and create application
 * @access  Public
 */
router.post('/register', [
  body('ownerEmail').isEmail().normalizeEmail(),
  body('ownerName').notEmpty().trim(),
  body('ownerPhone').notEmpty().trim(),
  body('hospitalName').notEmpty().trim(),
  body('hospitalAddress').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      ownerEmail, ownerName, ownerPhone, password,
      hospitalName, hospitalAddress, city, state,
      bedCapacity, staffCount
    } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if owner already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [ownerEmail]
      );

      let userId;
      if (existingUser.rows.length === 0) {
        // Create owner account
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);
        
        const nameParts = ownerName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        const userResult = await client.query(
          `INSERT INTO users (
            email, password_hash, first_name, last_name, 
            phone_number, role, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [ownerEmail, passwordHash, firstName, lastName, ownerPhone, 'hospital_owner', true]
        );
        userId = userResult.rows[0].id;
      } else {
        userId = existingUser.rows[0].id;
      }

      // Create application
      const appResult = await client.query(
        `INSERT INTO hospital_applications (
          hospital_name, owner_name, owner_email, owner_phone,
          hospital_address, state, bed_capacity, staff_count, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [hospitalName, ownerName, ownerEmail, ownerPhone, 
         hospitalAddress, state, bedCapacity, staffCount, 'submitted']
      );

      const application = appResult.rows[0];

      // Create onboarding status
      await onboardingService.updateOnboardingStage(application.id, 'application');

      // Create onboarding checklist
      await onboardingService.createOnboardingChecklist(application.id);

      // Calculate automatic scores
      const autoScores = await onboardingService.calculateAutomaticScores(
        application.id, 
        req.body
      );

      // Save automatic scores
      for (const score of autoScores) {
        await client.query(
          `INSERT INTO evaluation_scores 
          (application_id, criterion_id, score, weighted_score)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (application_id, criterion_id) DO UPDATE
          SET score = $3, weighted_score = $4`,
          [score.application_id, score.criterion_id, score.score, score.weighted_score]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Application submitted successfully',
        application: {
          id: application.id,
          status: application.status,
          hospital_name: application.hospital_name
        },
        userId: userId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register hospital' });
  }
});

/**
 * @route   POST /api/onboarding/documents/upload
 * @desc    Upload documents for application
 * @access  Private
 */
router.post('/documents/upload', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const { applicationId, documentType, expiryDate } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save document metadata
    const document = await documentService.saveDocumentMetadata({
      application_id: applicationId,
      hospital_id: req.body.hospitalId,
      document_type: documentType,
      document_name: file.originalname,
      file_path: file.filename,
      file_size: file.size,
      mime_type: file.mimetype,
      expiry_date: expiryDate || null,
      metadata: {
        uploaded_by: req.user.id,
        original_name: file.originalname
      }
    });

    // Update onboarding stage if this is the first document
    const docs = await documentService.getApplicationDocuments(applicationId);
    if (docs.length === 1) {
      await onboardingService.updateOnboardingStage(applicationId, 'document_submission');
    }

    res.json({
      message: 'Document uploaded successfully',
      document: document
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * @route   GET /api/onboarding/documents/:applicationId
 * @desc    Get all documents for an application
 * @access  Private
 */
router.get('/documents/:applicationId', authMiddleware, async (req, res) => {
  try {
    const documents = await documentService.getApplicationDocuments(req.params.applicationId);
    const requiredCheck = await documentService.checkRequiredDocuments(req.params.applicationId);

    res.json({
      documents,
      requirements: requiredCheck
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * @route   POST /api/onboarding/documents/verify
 * @desc    Verify a document
 * @access  Private (Admin only)
 */
router.post('/documents/verify', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { documentId, status, notes } = req.body;
    
    const document = await documentService.verifyDocument(
      documentId,
      req.user.id,
      status,
      notes
    );

    res.json({
      message: 'Document verification updated',
      document
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
});

/**
 * @route   POST /api/onboarding/evaluate
 * @desc    Submit evaluation scores for an application
 * @access  Private (Admin only)
 */
router.post('/evaluate', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { applicationId, scores } = req.body;

    // Save evaluation scores
    for (const score of scores) {
      await sql`
        INSERT INTO evaluation_scores (
          application_id, criterion_id, score, weighted_score,
          comments, evaluated_by
        ) VALUES (
          ${applicationId}, ${score.criterionId}, ${score.score},
          ${score.score * score.weight}, ${score.comments}, ${req.user.id}
        ) ON CONFLICT (application_id, criterion_id) DO UPDATE
        SET score = ${score.score}, 
            weighted_score = ${score.score * score.weight},
            comments = ${score.comments},
            evaluated_by = ${req.user.id},
            evaluated_at = CURRENT_TIMESTAMP
      `;
    }

    // Calculate overall score
    const overallScore = await onboardingService.calculateOverallScore(applicationId);

    // Update application status based on score
    await sql`
      UPDATE hospital_applications
      SET 
        evaluation_score = ${overallScore.percentage / 10},
        status = ${overallScore.status === 'approved' ? 'approved' : 'under_review'}
      WHERE id = ${applicationId}
    `;

    // Update onboarding stage
    await onboardingService.updateOnboardingStage(
      applicationId, 
      overallScore.status === 'approved' ? 'contract_negotiation' : 'evaluation'
    );

    res.json({
      message: 'Evaluation completed',
      overallScore
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to complete evaluation' });
  }
});

/**
 * @route   GET /api/onboarding/evaluation/:applicationId
 * @desc    Get evaluation details for an application
 * @access  Private
 */
router.get('/evaluation/:applicationId', authMiddleware, async (req, res) => {
  try {
    const criteria = await sql`
      SELECT 
        ec.*,
        es.score,
        es.weighted_score,
        es.comments,
        es.evaluated_at,
        u.first_name as evaluator_first_name,
        u.last_name as evaluator_last_name
      FROM evaluation_criteria ec
      LEFT JOIN evaluation_scores es ON es.criterion_id = ec.id 
        AND es.application_id = ${req.params.applicationId}
      LEFT JOIN users u ON u.id = es.evaluated_by
      ORDER BY ec.category, ec.criterion_name
    `;

    const overallScore = await onboardingService.calculateOverallScore(req.params.applicationId);

    res.json({
      criteria,
      overallScore
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation details' });
  }
});

/**
 * @route   POST /api/onboarding/contract/generate
 * @desc    Generate contract for approved application
 * @access  Private (Admin only)
 */
router.post('/contract/generate', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { applicationId, templateId, contractTerms } = req.body;

    // Get application details
    const application = await sql`
      SELECT * FROM hospital_applications WHERE id = ${applicationId}
    `;

    if (!application[0]) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Generate contract
    const contract = await contractService.generateContract(
      { ...application[0], ...contractTerms },
      templateId
    );

    // Update onboarding stage
    await onboardingService.updateOnboardingStage(applicationId, 'signature');

    res.json({
      message: 'Contract generated successfully',
      contract
    });
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
});

/**
 * @route   POST /api/onboarding/contract/sign
 * @desc    Add digital signature to contract
 * @access  Private
 */
router.post('/contract/sign', authMiddleware, async (req, res) => {
  try {
    const { contractId, signatureData } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const signature = await contractService.addDigitalSignature(
      contractId,
      req.user.id,
      signatureData,
      ipAddress,
      userAgent
    );

    // Check if onboarding is complete
    const contract = await sql`
      SELECT status, hospital_id FROM contracts WHERE id = ${contractId}
    `;

    if (contract[0].status === 'signed') {
      // Get application ID from hospital
      const app = await sql`
        SELECT id FROM hospital_applications 
        WHERE hospital_name = (
          SELECT name FROM hospitals WHERE id = ${contract[0].hospital_id}
        )
      `;
      
      if (app[0]) {
        await onboardingService.updateOnboardingStage(app[0].id, 'completed');
      }
    }

    res.json({
      message: 'Signature added successfully',
      signature: {
        id: signature.id,
        verification_code: signature.verification_code
      }
    });
  } catch (error) {
    console.error('Signature error:', error);
    res.status(500).json({ error: 'Failed to add signature' });
  }
});

/**
 * @route   GET /api/onboarding/status/:applicationId
 * @desc    Get onboarding status and checklist
 * @access  Private
 */
router.get('/status/:applicationId', authMiddleware, async (req, res) => {
  try {
    const status = await sql`
      SELECT * FROM onboarding_status 
      WHERE application_id = ${req.params.applicationId} 
      AND is_active = true
    `;

    const checklist = await sql`
      SELECT * FROM onboarding_checklist
      WHERE application_id = ${req.params.applicationId}
      ORDER BY due_date, priority DESC
    `;

    const completedTasks = checklist.filter(t => t.is_completed).length;
    const totalTasks = checklist.length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      status: status[0],
      checklist,
      progress: {
        completed: completedTasks,
        total: totalTasks,
        percentage: completionPercentage
      }
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

module.exports = router;
