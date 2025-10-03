const express = require('express');
const router = express.Router();
const pool = require('../../../database');

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ii.*,
                h.name as hospital_name,
                CASE 
                    WHEN ii.quantity = 0 THEN 'Out of Stock'
                    WHEN ii.quantity <= ii.reorder_level THEN 'Low Stock'
                    ELSE 'In Stock'
                END as stock_status
            FROM inventory_items ii
            LEFT JOIN hospitals h ON h.id = ii.hospital_id
            ORDER BY ii.item_name ASC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            summary: {
                total_items: result.rowCount,
                out_of_stock: result.rows.filter(r => r.quantity === 0).length,
                low_stock: result.rows.filter(r => r.quantity > 0 && r.quantity <= r.reorder_level).length,
                in_stock: result.rows.filter(r => r.quantity > r.reorder_level).length
            }
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory'
        });
    }
});

// Add new inventory item
router.post('/items', async (req, res) => {
    const {
        hospital_id,
        item_name,
        category,
        quantity,
        unit,
        reorder_level,
        supplier
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO inventory_items 
            (hospital_id, item_name, category, quantity, unit, reorder_level, supplier)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [hospital_id, item_name, category, quantity, unit, reorder_level, supplier]);
        
        res.status(201).json({
            success: true,
            message: 'Inventory item added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add inventory item'
        });
    }
});

// Update stock quantity
router.put('/items/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { quantity, action } = req.body; // action: 'add' or 'remove'

    try {
        const updateQuery = action === 'add' 
            ? `UPDATE inventory_items SET quantity = quantity + $1, last_restocked = CURRENT_DATE WHERE id = $2 RETURNING *`
            : `UPDATE inventory_items SET quantity = GREATEST(0, quantity - $1) WHERE id = $2 RETURNING *`;
            
        const result = await pool.query(updateQuery, [quantity, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inventory item not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update stock'
        });
    }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ii.*,
                h.name as hospital_name
            FROM inventory_items ii
            LEFT JOIN hospitals h ON h.id = ii.hospital_id
            WHERE ii.quantity <= ii.reorder_level
            ORDER BY (ii.quantity::float / NULLIF(ii.reorder_level, 0)) ASC
            LIMIT 50
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            urgent: result.rows.filter(r => r.quantity === 0).length
        });
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch low stock items'
        });
    }
});

module.exports = router;
