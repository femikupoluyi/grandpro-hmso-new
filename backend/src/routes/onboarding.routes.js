const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const ContractPDFService = require('../services/contract-pdf.service');

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/onboarding');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.'));
    }
  }
});

// Hospital Owner Registration
router.post('/register', [
  body('hospital_name').notEmpty().trim(),
  body('owner_first_name').notEmpty().trim(),
  body('owner_last_name').notEmpty().trim(),
  body('owner_email').isEmail().normalizeEmail(),
  body('owner_phone').notEmpty().matches(/^(\+234|0)[789]\d{9}$/),
  body('hospital_address').notEmpty(),
  body('hospital_city').notEmpty(),
  body('hospital_state').notEmpty().isIn([
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
    'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
    'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
    'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate application number
      const appNumberResult = await client.query("SELECT 'APP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(NEXTVAL('onboarding_applications_id_seq')::TEXT, 5, '0') as app_number");
      const applicationNumber = appNumberResult.rows[0].app_number;

      // Insert application
      const result = await client.query(`
        INSERT INTO onboarding_applications (
          application_number, hospital_name, hospital_type, bed_capacity,
          owner_first_name, owner_last_name, owner_email, owner_phone, owner_nin,
          hospital_address, hospital_city, hospital_state, hospital_lga,
          cac_registration_number, tax_identification_number, nhis_number,
          years_in_operation, number_of_staff, specialties,
          has_emergency_unit, has_laboratory, has_pharmacy, has_radiology,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'draft')
        RETURNING *`,
        [
          applicationNumber,
          req.body.hospital_name,
          req.body.hospital_type || 'General',
          req.body.bed_capacity || 0,
          req.body.owner_first_name,
          req.body.owner_last_name,
          req.body.owner_email,
          req.body.owner_phone,
          req.body.owner_nin,
          req.body.hospital_address,
          req.body.hospital_city,
          req.body.hospital_state,
          req.body.hospital_lga,
          req.body.cac_registration_number,
          req.body.tax_identification_number,
          req.body.nhis_number,
          req.body.years_in_operation || 0,
          req.body.number_of_staff || 0,
          req.body.specialties || [],
          req.body.has_emergency_unit || false,
          req.body.has_laboratory || false,
          req.body.has_pharmacy || false,
          req.body.has_radiology || false
        ]
      );

      // Log status change
      await client.query(`
        INSERT INTO onboarding_status_history (application_id, to_status, notes)
        VALUES ($1, 'draft', 'Application created')`,
        [result.rows[0].id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Document Upload
router.post('/applications/:id/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { id } = req.params;
    const { document_type_id } = req.body;

    // Calculate file checksum
    const fileBuffer = await fs.readFile(req.file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO application_documents (
          application_id, document_type_id, document_name,
          original_filename, file_path, file_size, mime_type, checksum
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          id,
          document_type_id,
          req.body.document_name || req.file.originalname,
          req.file.originalname,
          req.file.path,
          req.file.size,
          req.file.mimetype,
          checksum
        ]
      );

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Document upload failed',
      error: error.message
    });
  }
});

// Automated Evaluation Scoring
router.post('/applications/:id/evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get application details
      const appResult = await client.query(
        'SELECT * FROM onboarding_applications WHERE id = $1',
        [id]
      );

      if (appResult.rows.length === 0) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const application = appResult.rows[0];

      // Get evaluation criteria
      const criteriaResult = await client.query(
        'SELECT * FROM evaluation_criteria'
      );

      const scores = [];

      // Automated scoring logic
      for (const criterion of criteriaResult.rows) {
        let score = 0;
        let maxScore = criterion.max_score;

        switch (criterion.criterion) {
          case 'Bed Capacity':
            if (application.bed_capacity >= 100) score = 100;
            else if (application.bed_capacity >= 50) score = 75;
            else if (application.bed_capacity >= 20) score = 50;
            else score = 25;
            break;

          case 'Emergency Unit':
            score = application.has_emergency_unit ? 100 : 0;
            break;

          case 'Years in Operation':
            if (application.years_in_operation >= 10) score = 100;
            else if (application.years_in_operation >= 5) score = 75;
            else if (application.years_in_operation >= 2) score = 50;
            else score = 25;
            break;

          case 'Staff Strength':
            if (application.number_of_staff >= 50) score = 100;
            else if (application.number_of_staff >= 25) score = 75;
            else if (application.number_of_staff >= 10) score = 50;
            else score = 25;
            break;

          case 'CAC Registration':
            score = application.cac_registration_number ? 100 : 0;
            break;

          case 'NHIS Certification':
            score = application.nhis_number ? 100 : 0;
            break;

          case 'Tax Compliance':
            score = application.tax_identification_number ? 100 : 0;
            break;

          default:
            score = 50; // Default middle score for unknown criteria
        }

        const weightedScore = (score * criterion.weight) / 100;

        // Insert score
        await client.query(`
          INSERT INTO evaluation_scores (
            application_id, criteria_id, score, max_possible_score,
            weighted_score, is_automated, evaluation_method
          ) VALUES ($1, $2, $3, $4, $5, true, 'automated')
          ON CONFLICT (application_id, criteria_id) 
          DO UPDATE SET 
            score = $3, 
            weighted_score = $5,
            evaluated_at = CURRENT_TIMESTAMP`,
          [id, criterion.id, score, maxScore, weightedScore * maxScore]
        );

        scores.push({
          criterion: criterion.criterion,
          score,
          maxScore,
          weightedScore: weightedScore * maxScore
        });
      }

      // Calculate total score
      const totalScoreResult = await client.query(
        'SELECT calculate_application_score($1) as total_score',
        [id]
      );

      const totalScore = totalScoreResult.rows[0].total_score;

      // Determine risk rating
      let riskRating;
      if (totalScore >= 80) riskRating = 'low';
      else if (totalScore >= 60) riskRating = 'medium';
      else riskRating = 'high';

      // Update application
      await client.query(`
        UPDATE onboarding_applications 
        SET status = 'scoring', 
            risk_rating = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [riskRating, id]
      );

      // Log status change
      await client.query(`
        INSERT INTO onboarding_status_history (application_id, from_status, to_status, notes)
        VALUES ($1, $2, 'scoring', 'Automated evaluation completed')`,
        [id, application.status]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Evaluation completed',
        data: {
          applicationId: id,
          totalScore: parseFloat(totalScore),
          riskRating,
          scores
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Evaluation failed',
      error: error.message
    });
  }
});

// Contract Generation
router.post('/applications/:id/generate-contract', async (req, res) => {
  try {
    const { id } = req.params;
    const { template_id } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get application
      const appResult = await client.query(
        'SELECT * FROM onboarding_applications WHERE id = $1',
        [id]
      );

      if (appResult.rows.length === 0) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const application = appResult.rows[0];

      // Get template
      const templateResult = await client.query(
        'SELECT * FROM contract_templates WHERE id = $1 AND is_active = true',
        [template_id || 1]
      );

      if (templateResult.rows.length === 0) {
        return res.status(404).json({ message: 'Contract template not found' });
      }

      const template = templateResult.rows[0];

      // Generate contract number
      const contractNumber = `CONT-${Date.now()}`;

      // Replace template variables
      let contractBody = template.template_body;
      const replacements = {
        '{{contract_date}}': new Date().toLocaleDateString('en-NG'),
        '{{hospital_name}}': application.hospital_name,
        '{{owner_name}}': `${application.owner_first_name} ${application.owner_last_name}`,
        '{{duration_months}}': template.contract_duration_months,
        '{{commission_rate}}': template.commission_rate,
        '{{payment_terms}}': template.payment_terms,
        '{{signature_date}}': new Date().toLocaleDateString('en-NG')
      };

      for (const [key, value] of Object.entries(replacements)) {
        contractBody = contractBody.replace(new RegExp(key, 'g'), value);
      }

      // Create contract
      const contractResult = await client.query(`
        INSERT INTO contracts (
          contract_number, application_id, template_id,
          owner_name, owner_email, contract_type,
          start_date, end_date, commission_rate,
          payment_schedule, final_contract_body, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
        RETURNING *`,
        [
          contractNumber,
          id,
          template.id,
          `${application.owner_first_name} ${application.owner_last_name}`,
          application.owner_email,
          template.template_type,
          new Date(),
          new Date(Date.now() + template.contract_duration_months * 30 * 24 * 60 * 60 * 1000),
          template.commission_rate,
          'monthly',
          contractBody
        ]
      );

      await client.query('COMMIT');

      // Generate PDF version of the contract
      try {
        const pdfResult = await ContractPDFService.generateContractPDF(
          contractResult.rows[0],
          application
        );
        
        // Update contract with PDF path
        await client.query(
          'UPDATE contracts SET signature_request_id = $1 WHERE id = $2',
          [pdfResult.filepath, contractResult.rows[0].id]
        );
        
        res.json({
          success: true,
          message: 'Contract generated successfully',
          data: {
            ...contractResult.rows[0],
            pdf_generated: true,
            pdf_filename: pdfResult.filename,
            pdf_size: pdfResult.size
          }
        });
      } catch (pdfError) {
        // If PDF generation fails, still return the contract
        console.error('PDF generation error:', pdfError);
        res.json({
          success: true,
          message: 'Contract generated successfully (PDF generation failed)',
          data: contractResult.rows[0]
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Contract generation failed',
      error: error.message
    });
  }
});

// Digital Signature
router.post('/contracts/:id/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const { signatory_name, signatory_email, signature_data, signatory_role } = req.body;

    if (!signature_data) {
      return res.status(400).json({ message: 'Signature data required' });
    }

    // Generate signature hash
    const signatureHash = crypto.createHash('sha256').update(signature_data).digest('hex');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert signature
      const signatureResult = await client.query(`
        INSERT INTO digital_signatures (
          contract_id, signatory_name, signatory_email,
          signatory_role, signature_data, signature_hash,
          signature_timestamp, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8)
        RETURNING *`,
        [
          id,
          signatory_name,
          signatory_email,
          signatory_role || 'owner',
          signature_data,
          signatureHash,
          req.ip,
          req.headers['user-agent']
        ]
      );

      // Update contract status
      await client.query(`
        UPDATE contracts 
        SET status = 'signed', 
            signed_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [id]
      );

      // Update application status
      await client.query(`
        UPDATE onboarding_applications 
        SET status = 'approved',
            approval_date = CURRENT_TIMESTAMP
        WHERE id = (SELECT application_id FROM contracts WHERE id = $1)`,
        [id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Contract signed successfully',
        data: signatureResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Signature failed',
      error: error.message
    });
  }
});

// Get onboarding status
router.get('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      // Get application with status history
      const result = await client.query(`
        SELECT 
          a.*,
          (SELECT json_agg(row_to_json(h.*) ORDER BY h.created_at DESC)
           FROM onboarding_status_history h
           WHERE h.application_id = a.id) as status_history,
          (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) as document_count,
          (SELECT COUNT(*) FROM evaluation_scores WHERE application_id = a.id) as evaluation_count
        FROM onboarding_applications a
        WHERE a.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status',
      error: error.message
    });
  }
});

// List applications
router.get('/applications', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) as document_count,
        (SELECT COUNT(*) FROM evaluation_scores WHERE application_id = a.id) as evaluation_count
      FROM onboarding_applications a
    `;

    const params = [];
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM onboarding_applications';
      if (status) {
        countQuery += ' WHERE status = $1';
      }
      const countResult = await client.query(countQuery, params);

      const total = parseInt(countResult.rows[0].count || 0);
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit) || 1
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('List applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Download contract PDF
router.get('/contracts/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT signature_request_id as pdf_path, contract_number FROM contracts WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      const contract = result.rows[0];
      
      if (contract.pdf_path && contract.pdf_path.includes('/')) {
        const fs = require('fs');
        if (fs.existsSync(contract.pdf_path)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${contract.contract_number}.pdf"`);
          const fileStream = fs.createReadStream(contract.pdf_path);
          fileStream.pipe(res);
        } else {
          res.status(404).json({ message: 'PDF file not found' });
        }
      } else {
        res.status(404).json({ message: 'PDF not generated for this contract' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message
    });
  }
});

// Get document types
router.get('/document-types', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM document_types ORDER BY is_required DESC, name'
      );
      res.json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Document types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document types',
      error: error.message
    });
  }
});

module.exports = router;
