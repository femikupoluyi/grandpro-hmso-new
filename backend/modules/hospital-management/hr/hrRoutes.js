const express = require('express');
const router = express.Router();
const pool = require('../../../database');

// Get all staff
router.get('/staff', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                hs.*,
                h.name as hospital_name
            FROM hospital_staff hs
            LEFT JOIN hospitals h ON h.id = hs.hospital_id
            ORDER BY hs.full_name ASC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            departments: [...new Set(result.rows.map(r => r.department))]
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff'
        });
    }
});

// Get staff schedules
router.get('/schedules', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ss.*,
                hs.full_name as staff_name,
                h.name as hospital_name
            FROM staff_schedules ss
            LEFT JOIN hospital_staff hs ON hs.id = ss.staff_id
            LEFT JOIN hospitals h ON h.id = ss.hospital_id
            WHERE ss.shift_date >= CURRENT_DATE
            ORDER BY ss.shift_date, ss.shift_start
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch schedules'
        });
    }
});

// Create new staff member
router.post('/staff', async (req, res) => {
    const {
        hospital_id,
        full_name,
        employee_id,
        department,
        position,
        qualification,
        phone,
        email
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO hospital_staff 
            (hospital_id, full_name, employee_id, department, position, qualification, phone, email)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [hospital_id, full_name, employee_id, department, position, qualification, phone, email]);
        
        res.status(201).json({
            success: true,
            message: 'Staff member added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding staff member:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add staff member'
        });
    }
});

module.exports = router;
