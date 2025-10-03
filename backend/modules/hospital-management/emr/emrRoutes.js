const express = require('express');
const router = express.Router();
const pool = require('../../../database');

// Get all patients
router.get('/patients', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                COUNT(DISTINCT mr.id) as total_visits
            FROM patients p
            LEFT JOIN medical_records mr ON mr.patient_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error fetching EMR patients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EMR patients'
        });
    }
});

// Get patient by ID
router.get('/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT * FROM patients WHERE id = $1
        `, [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patient'
        });
    }
});

// Create new medical record
router.post('/records', async (req, res) => {
    const {
        patient_id,
        hospital_id,
        visit_date,
        diagnosis,
        treatment,
        prescription,
        notes
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO medical_records 
            (patient_id, hospital_id, visit_date, diagnosis, treatment, prescription, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [patient_id, hospital_id, visit_date, diagnosis, treatment, prescription, notes]);
        
        res.status(201).json({
            success: true,
            message: 'Medical record created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating medical record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create medical record'
        });
    }
});

module.exports = router;
