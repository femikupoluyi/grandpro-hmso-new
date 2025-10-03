const express = require('express');
const router = express.Router();
const pool = require('../../database');

// Hospital Applications
router.get('/applications', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ha.*,
                h.name as hospital_name,
                h.status as hospital_status
            FROM hospital_applications ha
            LEFT JOIN hospitals h ON h.id = ha.hospital_id
            ORDER BY ha.created_at DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch applications',
            message: error.message
        });
    }
});

// Contracts
router.get('/contracts', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                h.name as hospital_name,
                ds.signature_date,
                ds.signed_by
            FROM contracts c
            LEFT JOIN hospitals h ON h.id = c.hospital_id
            LEFT JOIN digital_signatures ds ON ds.contract_id = c.id
            ORDER BY c.created_at DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch contracts',
            message: error.message
        });
    }
});

// Onboarding Status
router.get('/onboarding/status', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                os.*,
                h.name as hospital_name,
                oc.completed_items,
                oc.total_items
            FROM onboarding_status os
            LEFT JOIN hospitals h ON h.id = os.hospital_id
            LEFT JOIN (
                SELECT 
                    hospital_id,
                    COUNT(CASE WHEN completed = true THEN 1 END) as completed_items,
                    COUNT(*) as total_items
                FROM onboarding_checklist
                GROUP BY hospital_id
            ) oc ON oc.hospital_id = os.hospital_id
            ORDER BY os.created_at DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            summary: {
                total_onboarding: result.rowCount,
                completed: result.rows.filter(r => r.current_step === 'completed').length,
                in_progress: result.rows.filter(r => r.current_step !== 'completed' && r.current_step !== 'pending').length,
                pending: result.rows.filter(r => r.current_step === 'pending').length
            }
        });
    } catch (error) {
        console.error('Error fetching onboarding status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch onboarding status',
            message: error.message
        });
    }
});

// Create new application
router.post('/applications', async (req, res) => {
    const {
        hospital_name,
        owner_name,
        owner_email,
        owner_phone,
        hospital_address,
        hospital_city,
        hospital_state,
        bed_capacity,
        staff_count,
        specialties
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO hospital_applications 
            (hospital_id, status, submitted_by, submission_date, review_notes)
            VALUES 
            (gen_random_uuid(), 'pending', $1, CURRENT_TIMESTAMP, 'Application submitted')
            RETURNING *
        `, [owner_email]);
        
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create application',
            message: error.message
        });
    }
});

// Update application status
router.put('/applications/:id', async (req, res) => {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    try {
        const result = await pool.query(`
            UPDATE hospital_applications 
            SET status = $1, review_notes = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [status, review_notes, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Application updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update application',
            message: error.message
        });
    }
});

// Create contract
router.post('/contracts', async (req, res) => {
    const {
        hospital_id,
        template_id,
        terms,
        start_date,
        end_date
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO contracts 
            (hospital_id, template_id, terms, start_date, end_date, status)
            VALUES 
            ($1, $2, $3, $4, $5, 'draft')
            RETURNING *
        `, [hospital_id, template_id, terms, start_date, end_date]);
        
        res.status(201).json({
            success: true,
            message: 'Contract created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating contract:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create contract',
            message: error.message
        });
    }
});

module.exports = router;
