const express = require('express');
const router = express.Router();
const pool = require('../../../database');

// Get analytics dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Patient metrics
        const patientMetrics = await pool.query(`
            SELECT 
                COUNT(DISTINCT p.id) as total_patients,
                COUNT(DISTINCT a.id) as total_appointments,
                COUNT(DISTINCT CASE WHEN a.status = 'scheduled' THEN a.id END) as upcoming_appointments,
                COUNT(DISTINCT CASE WHEN DATE(a.appointment_date) = CURRENT_DATE THEN a.id END) as today_appointments
            FROM patients p
            LEFT JOIN appointments a ON a.patient_id = p.id
        `);

        // Revenue metrics
        const revenueMetrics = await pool.query(`
            SELECT 
                COUNT(*) as total_invoices,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_invoice_amount,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue
            FROM invoices
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        // Inventory metrics
        const inventoryMetrics = await pool.query(`
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN quantity <= reorder_level THEN 1 END) as low_stock,
                SUM(quantity) as total_items_in_stock
            FROM inventory_items
        `);

        // Hospital metrics
        const hospitalMetrics = await pool.query(`
            SELECT 
                COUNT(*) as total_hospitals,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_hospitals,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_hospitals,
                AVG(bed_capacity) as avg_bed_capacity
            FROM hospitals
        `);

        res.json({
            success: true,
            data: {
                patients: patientMetrics.rows[0],
                revenue: revenueMetrics.rows[0],
                inventory: inventoryMetrics.rows[0],
                hospitals: hospitalMetrics.rows[0],
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching analytics dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics dashboard'
        });
    }
});

// Get KPI metrics
router.get('/kpis', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                km.*,
                h.name as hospital_name
            FROM kpi_metrics km
            LEFT JOIN hospitals h ON h.id = km.hospital_id
            WHERE km.metric_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY km.metric_date DESC, km.category
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            categories: [...new Set(result.rows.map(r => r.category))]
        });
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch KPI metrics'
        });
    }
});

// Get occupancy rates
router.get('/occupancy', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                h.id,
                h.name,
                h.bed_capacity,
                COUNT(DISTINCT a.patient_id) as current_patients,
                CASE 
                    WHEN h.bed_capacity > 0 
                    THEN ROUND((COUNT(DISTINCT a.patient_id)::numeric / h.bed_capacity) * 100, 2)
                    ELSE 0
                END as occupancy_rate
            FROM hospitals h
            LEFT JOIN appointments a ON a.hospital_id = h.id 
                AND a.status = 'in-progress'
                AND DATE(a.appointment_date) = CURRENT_DATE
            GROUP BY h.id, h.name, h.bed_capacity
            ORDER BY occupancy_rate DESC
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            average_occupancy: result.rows.reduce((sum, h) => sum + parseFloat(h.occupancy_rate || 0), 0) / (result.rowCount || 1)
        });
    } catch (error) {
        console.error('Error fetching occupancy rates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch occupancy rates'
        });
    }
});

module.exports = router;
