const express = require('express');
const { body, validationResult } = require('express-validator');
const { sql, pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all hospitals (public)
router.get('/', async (req, res) => {
  try {
    const { state, status, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        h.id, h.name, h.registration_number, h.address, h.city, h.state,
        h.phone_number, h.email, h.bed_capacity, h.staff_count, h.specialties,
        h.status, h.evaluation_score, h.created_at,
        u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM hospitals h
      LEFT JOIN users u ON u.id = h.owner_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (state) {
      params.push(state);
      query += ` AND h.state = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND h.status = $${params.length}`;
    }
    
    query += ` ORDER BY h.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const { rows: hospitals } = await pool.query(query, params);
    
    res.json({
      hospitals,
      count: hospitals.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// Get single hospital
router.get('/:id', async (req, res) => {
  try {
    const hospitals = await sql`
      SELECT 
        h.*,
        u.first_name as owner_first_name, 
        u.last_name as owner_last_name,
        u.email as owner_email,
        u.phone_number as owner_phone
      FROM hospitals h
      LEFT JOIN users u ON u.id = h.owner_id
      WHERE h.id = ${req.params.id}
    `;
    
    if (hospitals.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Get staff count
    const staffCount = await sql`
      SELECT COUNT(*) as count
      FROM hospital_staff
      WHERE hospital_id = ${req.params.id} AND is_active = true
    `;
    
    // Get active contracts
    const contracts = await sql`
      SELECT id, contract_number, status, start_date, end_date
      FROM contracts
      WHERE hospital_id = ${req.params.id} AND status IN ('active', 'signed')
      ORDER BY created_at DESC
    `;
    
    res.json({
      ...hospitals[0],
      active_staff_count: staffCount[0].count,
      contracts
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
});

// Create new hospital (requires authentication)
router.post('/', authMiddleware, [
  body('name').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('phoneNumber').notEmpty().trim(),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name, registrationNumber, taxId, address, city, state, postalCode,
      phoneNumber, email, website, bedCapacity, staffCount, specialties
    } = req.body;
    
    // Check if hospital already exists
    if (registrationNumber) {
      const existing = await sql`
        SELECT id FROM hospitals WHERE registration_number = ${registrationNumber}
      `;
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Hospital with this registration number already exists' });
      }
    }
    
    // Create hospital
    const newHospital = await sql`
      INSERT INTO hospitals (
        name, registration_number, tax_id, address, city, state, postal_code,
        phone_number, email, website, bed_capacity, staff_count, specialties,
        owner_id, status
      ) VALUES (
        ${name}, ${registrationNumber}, ${taxId}, ${address}, ${city}, ${state}, ${postalCode},
        ${phoneNumber}, ${email}, ${website}, ${bedCapacity}, ${staffCount}, ${specialties || []},
        ${req.user.id}, 'pending'
      ) RETURNING *
    `;
    
    res.status(201).json({
      message: 'Hospital created successfully',
      hospital: newHospital[0]
    });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ error: 'Failed to create hospital' });
  }
});

// Update hospital
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission
    const hospitals = await sql`
      SELECT owner_id FROM hospitals WHERE id = ${id}
    `;
    
    if (hospitals.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    if (hospitals[0].owner_id !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = [
      'name', 'address', 'city', 'state', 'postal_code', 'phone_number',
      'email', 'website', 'bed_capacity', 'staff_count', 'specialties'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const query = `
      UPDATE hospitals 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const { rows: updated } = await pool.query(query, values);
    
    res.json({
      message: 'Hospital updated successfully',
      hospital: updated[0]
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({ error: 'Failed to update hospital' });
  }
});

// Get hospital statistics
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Basic stats
    const staffStats = await sql`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff
      FROM hospital_staff
      WHERE hospital_id = ${id}
    `;
    
    // Sample statistics (these would be from actual operational tables in production)
    const stats = {
      staff: staffStats[0],
      patients: {
        total: Math.floor(Math.random() * 1000) + 100,
        active: Math.floor(Math.random() * 200) + 50,
        new_this_month: Math.floor(Math.random() * 50) + 10
      },
      revenue: {
        current_month: Math.floor(Math.random() * 5000000) + 1000000, // In Naira
        last_month: Math.floor(Math.random() * 5000000) + 1000000,
        year_to_date: Math.floor(Math.random() * 50000000) + 10000000
      },
      occupancy: {
        current: Math.floor(Math.random() * 40) + 60, // Percentage
        average_stay: Math.floor(Math.random() * 5) + 3 // Days
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching hospital stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
