const express = require('express');
const { body, validationResult } = require('express-validator');
const { sql } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Submit hospital application (public)
router.post('/submit', [
  body('hospitalName').notEmpty().trim(),
  body('ownerName').notEmpty().trim(),
  body('ownerEmail').isEmail().normalizeEmail(),
  body('ownerPhone').notEmpty().trim(),
  body('hospitalAddress').notEmpty().trim(),
  body('state').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      hospitalName, ownerName, ownerEmail, ownerPhone,
      hospitalAddress, state, bedCapacity, staffCount,
      registrationDocuments
    } = req.body;
    
    // Check if application already exists
    const existing = await sql`
      SELECT id FROM hospital_applications
      WHERE owner_email = ${ownerEmail} AND hospital_name = ${hospitalName}
    `;
    
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Application already submitted' });
    }
    
    // Create application
    const newApplication = await sql`
      INSERT INTO hospital_applications (
        hospital_name, owner_name, owner_email, owner_phone,
        hospital_address, state, bed_capacity, staff_count,
        registration_documents, status
      ) VALUES (
        ${hospitalName}, ${ownerName}, ${ownerEmail}, ${ownerPhone},
        ${hospitalAddress}, ${state}, ${bedCapacity}, ${staffCount},
        ${registrationDocuments || {}}, 'submitted'
      ) RETURNING *
    `;
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: newApplication[0]
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get all applications (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { status, state } = req.query;
    
    let query = `
      SELECT * FROM hospital_applications
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (state) {
      params.push(state);
      query += ` AND state = $${params.length}`;
    }
    
    query += ` ORDER BY submitted_at DESC`;
    
    const applications = await sql.unsafe(query, params);
    
    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Review application
router.patch('/:id/review', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { status, evaluationScore, evaluationNotes } = req.body;
    
    const updated = await sql`
      UPDATE hospital_applications
      SET 
        status = ${status},
        evaluation_score = ${evaluationScore},
        evaluation_notes = ${evaluationNotes},
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ${req.user.id}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({
      message: 'Application reviewed successfully',
      application: updated[0]
    });
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({ error: 'Failed to review application' });
  }
});

// Get application status (public with application ID)
router.get('/status/:id', async (req, res) => {
  try {
    const applications = await sql`
      SELECT 
        id, hospital_name, status, evaluation_score,
        submitted_at, reviewed_at
      FROM hospital_applications
      WHERE id = ${req.params.id}
    `;
    
    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ application: applications[0] });
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

module.exports = router;
