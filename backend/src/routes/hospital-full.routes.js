const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Create a new hospital
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      address,
      city,
      state,
      phoneNumber,
      email,
      type,
      bedCapacity,
      servicesOffered,
      hasEmergency,
      hasPharmacy,
      hasLab,
      ownerName,
      ownerEmail,
      ownerPhone
    } = req.body;
    
    await client.query('BEGIN');
    
    // Generate unique code
    const code = 'HOSP' + Date.now().toString(36).toUpperCase();
    
    // Create hospital
    const hospitalResult = await client.query(
      `INSERT INTO hospitals (
        name, code, address, city, state, phone, email, 
        license_number, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      RETURNING *`,
      [name, code, address, city, state, phoneNumber, email, 
       'LIC' + Date.now().toString(36).toUpperCase()]
    );
    
    const hospital = hospitalResult.rows[0];
    
    // Create owner if provided
    if (ownerName && ownerEmail) {
      await client.query(
        `INSERT INTO HospitalOwner (
          hospital_id, owner_name, owner_email, owner_phone, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [hospital.id, ownerName, ownerEmail, ownerPhone]
      );
    }
    
    // Add services offered
    if (servicesOffered && Array.isArray(servicesOffered)) {
      for (const service of servicesOffered) {
        await client.query(
          `INSERT INTO departments (hospital_id, name, is_active, created_at)
           VALUES ($1, $2, true, NOW())`,
          [hospital.id, service]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      hospital,
      message: 'Hospital created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Hospital creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Get all hospitals
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, 
        COUNT(DISTINCT d.id) as department_count,
        COUNT(DISTINCT ho.id) as owner_count
       FROM hospitals h
       LEFT JOIN departments d ON h.id = d.hospital_id
       LEFT JOIN HospitalOwner ho ON h.id = ho.hospital_id
       WHERE h.status != 'deleted'
       GROUP BY h.id
       ORDER BY h.created_at DESC`
    );
    
    res.json({
      success: true,
      hospitals: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get hospital by ID
router.get('/:id', async (req, res) => {
  try {
    const hospitalResult = await pool.query(
      `SELECT h.*, 
        COUNT(DISTINCT d.id) as department_count,
        COUNT(DISTINCT s.id) as staff_count
       FROM hospitals h
       LEFT JOIN departments d ON h.id = d.hospital_id
       LEFT JOIN staff s ON h.id = s.hospital_id
       WHERE h.id = $1
       GROUP BY h.id`,
      [req.params.id]
    );
    
    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hospital not found' 
      });
    }
    
    // Get departments
    const departmentsResult = await pool.query(
      'SELECT * FROM departments WHERE hospital_id = $1',
      [req.params.id]
    );
    
    // Get owner info
    const ownerResult = await pool.query(
      'SELECT * FROM HospitalOwner WHERE hospital_id = $1',
      [req.params.id]
    );
    
    res.json({
      success: true,
      hospital: {
        ...hospitalResult.rows[0],
        departments: departmentsResult.rows,
        owner: ownerResult.rows[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update hospital
router.put('/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = [
      'name', 'address', 'city', 'state', 'phone_number', 
      'email', 'hospital_type', 'bed_capacity', 
      'has_emergency', 'has_pharmacy', 'has_lab', 'status'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      const query = `
        UPDATE hospitals 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          message: 'Hospital not found' 
        });
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        hospital: result.rows[0],
        message: 'Hospital updated successfully'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }
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

// Delete hospital (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE hospitals 
       SET status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND status != 'deleted'
       RETURNING id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hospital not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
