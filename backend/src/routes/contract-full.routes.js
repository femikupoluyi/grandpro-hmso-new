const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate a contract
router.post('/generate', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      hospitalId,
      hospitalName,
      ownerName,
      ownerEmail,
      contractTerms,
      commissionRate,
      contractDuration,
      startDate
    } = req.body;
    
    await client.query('BEGIN');
    
    // Generate contract number
    const contractNumber = 'CNT' + Date.now().toString(36).toUpperCase();
    
    // Create contract record
    const contractResult = await client.query(
      `INSERT INTO contracts (
        hospital_id, hospital_name, owner_name, owner_email,
        contract_terms, commission_rate, duration_months,
        contract_number, contract_type, revenue_share_percentage,
        start_date, end_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DRAFT', NOW(), NOW())
      RETURNING *`,
      [
        hospitalId,
        hospitalName,
        ownerName,
        ownerEmail,
        contractTerms || 'Standard GrandPro HMSO Terms and Conditions',
        commissionRate || 15,
        contractDuration || 12,
        contractNumber,
        'SERVICE', // contract type
        commissionRate || 15, // revenue share percentage
        startDate || new Date(),
        new Date(new Date(startDate || new Date()).setMonth(
          new Date(startDate || new Date()).getMonth() + (contractDuration || 12)
        ))
      ]
    );
    
    const contract = contractResult.rows[0];
    
    // Generate PDF
    const doc = new PDFDocument();
    const fileName = `contract_${contract.id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    doc.pipe(fs.createWriteStream(filePath));
    
    // PDF Content
    doc.fontSize(20).text('HOSPITAL MANAGEMENT SERVICE CONTRACT', 100, 100);
    doc.fontSize(14).text('', 100, 140);
    doc.text(`Contract ID: ${contract.id}`, 100, 160);
    doc.text(`Date: ${new Date().toLocaleDateString('en-NG')}`, 100, 180);
    
    doc.text('', 100, 220);
    doc.fontSize(16).text('PARTIES', 100, 220);
    doc.fontSize(12);
    doc.text('This agreement is entered into between:', 100, 250);
    doc.text(`1. GrandPro HMSO (Service Provider)`, 100, 270);
    doc.text(`2. ${ownerName} representing ${hospitalName} (Client)`, 100, 290);
    
    doc.text('', 100, 330);
    doc.fontSize(16).text('TERMS AND CONDITIONS', 100, 330);
    doc.fontSize(12);
    doc.text(`Commission Rate: ${commissionRate}%`, 100, 360);
    doc.text(`Contract Duration: ${contractDuration} months`, 100, 380);
    doc.text(`Start Date: ${new Date(startDate || new Date()).toLocaleDateString('en-NG')}`, 100, 400);
    doc.text(`End Date: ${contract.end_date.toLocaleDateString('en-NG')}`, 100, 420);
    
    doc.text('', 100, 460);
    doc.text('CONTRACT TERMS:', 100, 460);
    doc.text(contractTerms || 'Standard GrandPro HMSO Terms and Conditions apply', 100, 480, {
      width: 400,
      align: 'justify'
    });
    
    doc.text('', 100, 580);
    doc.text('SIGNATURES:', 100, 580);
    doc.text('_____________________', 100, 620);
    doc.text('Service Provider', 100, 640);
    doc.text('_____________________', 300, 620);
    doc.text('Client', 300, 640);
    
    doc.end();
    
    // Update contract with PDF path
    await client.query(
      `UPDATE contracts 
       SET pdf_url = $1 
       WHERE id = $2`,
      [`/uploads/${fileName}`, contract.id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      contract: {
        ...contract,
        pdf_url: `/uploads/${fileName}`
      },
      message: 'Contract generated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Contract generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Sign a contract
router.post('/:id/sign', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { signatureData, signerName, signerRole } = req.body;
    
    await client.query('BEGIN');
    
    // Update contract status
    const contractResult = await client.query(
      `UPDATE contracts 
       SET status = 'signed', 
           signed_date = NOW(),
           signer_name = $2,
           signer_role = $3,
           signature_data = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, signerName, signerRole, signatureData]
    );
    
    if (contractResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }
    
    const contract = contractResult.rows[0];
    
    // Update hospital onboarding status if exists
    if (contract.hospital_id) {
      await client.query(
        `UPDATE OnboardingProgress 
         SET contract_signed = true, 
             updated_at = NOW()
         WHERE hospital_id = $1`,
        [contract.hospital_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      contract,
      message: 'Contract signed successfully'
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

// Get all contracts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, hospitalId } = req.query;
    
    let query = `
      SELECT c.*, h.name as hospital_name 
      FROM contracts c
      LEFT JOIN hospitals h ON c.hospital_id = h.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND c.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    if (hospitalId) {
      query += ` AND c.hospital_id = $${paramCount}`;
      values.push(hospitalId);
      paramCount++;
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      contracts: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get contract by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, h.name as hospital_name, h.address as hospital_address
       FROM contracts c
       LEFT JOIN hospitals h ON c.hospital_id = h.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }
    
    res.json({
      success: true,
      contract: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
