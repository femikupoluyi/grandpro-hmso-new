const express = require('express');
const router = express.Router();
const pool = require('../../../database');

// Get all invoices
router.get('/invoices', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                p.patient_number,
                h.name as hospital_name
            FROM invoices i
            LEFT JOIN patients p ON p.id = i.patient_id
            LEFT JOIN hospitals h ON h.id = i.hospital_id
            ORDER BY i.created_at DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            summary: {
                total_amount: result.rows.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
                pending: result.rows.filter(r => r.payment_status === 'pending').length,
                paid: result.rows.filter(r => r.payment_status === 'paid').length,
                overdue: result.rows.filter(r => r.payment_status === 'overdue').length
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoices'
        });
    }
});

// Create new invoice
router.post('/invoices', async (req, res) => {
    const {
        patient_id,
        hospital_id,
        invoice_number,
        total_amount,
        payment_method,
        insurance_claim_id
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO invoices 
            (patient_id, hospital_id, invoice_number, total_amount, payment_method, insurance_claim_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [patient_id, hospital_id, invoice_number || `INV-${Date.now()}`, total_amount, payment_method, insurance_claim_id]);
        
        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create invoice'
        });
    }
});

// Get revenue summary
router.get('/revenue', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_invoices,
                SUM(total_amount) as total_revenue,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as collected,
                SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending,
                AVG(total_amount) as average_invoice_amount
            FROM invoices
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);
        
        res.json({
            success: true,
            data: result.rows[0],
            period: '30 days'
        });
    } catch (error) {
        console.error('Error fetching revenue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue data'
        });
    }
});

module.exports = router;
