const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sql } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Generate contract number
const generateContractNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GMHSO-${year}-${random}`;
};

// Get all contracts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { hospitalId, status } = req.query;
    
    let query = `
      SELECT 
        c.*,
        h.name as hospital_name,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM contracts c
      JOIN hospitals h ON h.id = c.hospital_id
      JOIN users u ON u.id = c.owner_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (hospitalId) {
      params.push(hospitalId);
      query += ` AND c.hospital_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }
    
    // Filter by user role
    if (req.user.role === 'hospital_owner') {
      params.push(req.user.id);
      query += ` AND c.owner_id = $${params.length}`;
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const contracts = await sql.unsafe(query, params);
    
    res.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Create new contract
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const {
      hospitalId, ownerId, startDate, endDate,
      contractValue, paymentTerms
    } = req.body;
    
    const contractNumber = generateContractNumber();
    
    const newContract = await sql`
      INSERT INTO contracts (
        contract_number, hospital_id, owner_id,
        start_date, end_date, contract_value,
        payment_terms, status
      ) VALUES (
        ${contractNumber}, ${hospitalId}, ${ownerId},
        ${startDate}, ${endDate}, ${contractValue},
        ${paymentTerms}, 'draft'
      ) RETURNING *
    `;
    
    res.status(201).json({
      message: 'Contract created successfully',
      contract: newContract[0]
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// Update contract status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'pending_signature', 'signed', 'active', 'expired', 'terminated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updated = await sql`
      UPDATE contracts
      SET 
        status = ${status},
        signed_date = ${status === 'signed' ? sql`CURRENT_TIMESTAMP` : sql`signed_date`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json({
      message: 'Contract status updated',
      contract: updated[0]
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

module.exports = router;
