const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// Get onboarding status - Allow unauthenticated for demo
router.get('/status', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    
    // For demo, return empty success response if no specific hospital
    if (!hospitalId) {
      return res.json({
        success: true,
        onboardingStatuses: []
      });
    }
    
    let query = `
      SELECT 
        op.*,
        h.name as hospital_name,
        h.status as hospital_status,
        COUNT(DISTINCT od.id) as documents_count,
        COUNT(DISTINCT oc.id) as contracts_count
      FROM OnboardingProgress op
      LEFT JOIN hospitals h ON op.hospital_id = h.id
      LEFT JOIN OnboardingDocument od ON op.hospital_id = od.hospital_id
      LEFT JOIN OnboardingContract oc ON op.hospital_id = oc.hospital_id
    `;
    
    const values = [];
    if (hospitalId) {
      query += ' WHERE op.hospital_id = $1';
      values.push(hospitalId);
    }
    
    query += ' GROUP BY op.id, h.id ORDER BY op.created_at DESC';
    
    const result = await pool.query(query, values);
    
    // Calculate completion percentage
    const statuses = result.rows.map(row => {
      const steps = [
        row.application_submitted,
        row.documents_uploaded,
        row.evaluation_completed,
        row.contract_generated,
        row.contract_signed,
        row.setup_completed
      ];
      
      const completedSteps = steps.filter(Boolean).length;
      const totalSteps = steps.length;
      const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
      
      return {
        ...row,
        completion_percentage: completionPercentage,
        current_step: getCurrentStep(row)
      };
    });
    
    res.json({
      success: true,
      onboardingStatuses: statuses,
      total: result.rowCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create or update onboarding progress
router.post('/progress', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { hospitalId, step, completed } = req.body;
    
    await client.query('BEGIN');
    
    // Check if progress exists
    const existingResult = await client.query(
      'SELECT id FROM OnboardingProgress WHERE hospital_id = $1',
      [hospitalId]
    );
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing progress
      const stepColumn = getStepColumn(step);
      if (!stepColumn) {
        throw new Error('Invalid step name');
      }
      
      result = await client.query(
        `UPDATE OnboardingProgress 
         SET ${stepColumn} = $2, updated_at = NOW()
         WHERE hospital_id = $1
         RETURNING *`,
        [hospitalId, completed]
      );
    } else {
      // Create new progress
      result = await client.query(
        `INSERT INTO OnboardingProgress (
          hospital_id, application_submitted, documents_uploaded,
          evaluation_completed, contract_generated, contract_signed,
          setup_completed, created_at, updated_at
        ) VALUES ($1, false, false, false, false, false, false, NOW(), NOW())
        RETURNING *`,
        [hospitalId]
      );
      
      // Update the specific step if provided
      if (step) {
        const stepColumn = getStepColumn(step);
        result = await client.query(
          `UPDATE OnboardingProgress 
           SET ${stepColumn} = $2, updated_at = NOW()
           WHERE hospital_id = $1
           RETURNING *`,
          [hospitalId, completed]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      progress: result.rows[0],
      message: 'Onboarding progress updated'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Upload documents
router.post('/documents', authMiddleware, upload.array('documents', 10), async (req, res) => {
  const client = await pool.connect();
  try {
    const { hospitalId, documentTypes } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }
    
    await client.query('BEGIN');
    
    const uploadedDocs = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const documentType = Array.isArray(documentTypes) ? 
        documentTypes[i] || 'general' : 
        'general';
      
      const result = await client.query(
        `INSERT INTO OnboardingDocument (
          hospital_id, document_name, document_type, 
          file_path, uploaded_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
        [
          hospitalId,
          file.originalname,
          documentType,
          `/uploads/${file.filename}`
        ]
      );
      
      uploadedDocs.push(result.rows[0]);
    }
    
    // Update onboarding progress
    await client.query(
      `UPDATE OnboardingProgress 
       SET documents_uploaded = true, updated_at = NOW()
       WHERE hospital_id = $1`,
      [hospitalId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      documents: uploadedDocs,
      message: `${uploadedDocs.length} documents uploaded successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Get onboarding checklist
router.get('/checklist/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const checklistResult = await pool.query(
      `SELECT * FROM OnboardingChecklist 
       WHERE hospital_id = $1 
       ORDER BY step_order`,
      [req.params.hospitalId]
    );
    
    if (checklistResult.rows.length === 0) {
      // Create default checklist
      const defaultChecklist = [
        { step: 'Submit Application', order: 1 },
        { step: 'Upload Documents', order: 2 },
        { step: 'Evaluation & Scoring', order: 3 },
        { step: 'Contract Generation', order: 4 },
        { step: 'Contract Signing', order: 5 },
        { step: 'System Setup', order: 6 },
        { step: 'Training & Go-Live', order: 7 }
      ];
      
      for (const item of defaultChecklist) {
        await pool.query(
          `INSERT INTO OnboardingChecklist (
            hospital_id, step_name, step_order, is_completed, created_at
          ) VALUES ($1, $2, $3, false, NOW())`,
          [req.params.hospitalId, item.step, item.order]
        );
      }
      
      const newChecklistResult = await pool.query(
        `SELECT * FROM OnboardingChecklist 
         WHERE hospital_id = $1 
         ORDER BY step_order`,
        [req.params.hospitalId]
      );
      
      return res.json({
        success: true,
        checklist: newChecklistResult.rows
      });
    }
    
    res.json({
      success: true,
      checklist: checklistResult.rows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Helper functions
function getStepColumn(step) {
  const stepMap = {
    'application': 'application_submitted',
    'documents': 'documents_uploaded',
    'evaluation': 'evaluation_completed',
    'contract_generation': 'contract_generated',
    'contract_signing': 'contract_signed',
    'setup': 'setup_completed'
  };
  return stepMap[step];
}

function getCurrentStep(progress) {
  if (!progress.application_submitted) return 'Application Submission';
  if (!progress.documents_uploaded) return 'Document Upload';
  if (!progress.evaluation_completed) return 'Evaluation';
  if (!progress.contract_generated) return 'Contract Generation';
  if (!progress.contract_signed) return 'Contract Signing';
  if (!progress.setup_completed) return 'System Setup';
  return 'Completed';
}

module.exports = router;
