const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventory-enhanced.service');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Inventory API is working',
    endpoints: {
      items: {
        add: 'POST /api/inventory/items',
        list: 'GET /api/inventory/items',
        update: 'PUT /api/inventory/items/:id',
        reorderAlerts: 'GET /api/inventory/reorder-alerts'
      },
      stock: {
        movement: 'POST /api/inventory/stock-movement',
        audit: 'POST /api/inventory/audit',
        valuation: 'GET /api/inventory/valuation/:hospitalId'
      },
      dispensing: {
        dispense: 'POST /api/inventory/dispense',
        history: 'GET /api/inventory/dispensing/:patientId'
      },
      equipment: {
        add: 'POST /api/inventory/equipment',
        list: 'GET /api/inventory/equipment',
        maintenance: 'POST /api/inventory/equipment/maintenance'
      }
    }
  });
});

// Add inventory item
router.post('/items', async (req, res) => {
  try {
    const { hospital_id, name, category, quantity, unit, reorder_level, unit_price, expiry_date } = req.body;
    
    // Generate item code
    const item_code = `ITEM${Date.now()}`;
    
    const query = `
      INSERT INTO inventory_items (
        hospital_id, item_code, item_name, name, category, item_type, 
        unit_of_measure, unit, reorder_level, reorder_quantity, minimum_stock, 
        current_stock, unit_cost, unit_price, expiry_date, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *
    `;
    
    const values = [
      hospital_id, item_code, name, name, category || 'medication', 'drug',
      unit || 'tablets', unit, reorder_level || 10, reorder_level || 10, 5,
      quantity || 0, unit_price || 0, unit_price || 0, expiry_date
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      status: 'success',
      message: 'Inventory item added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory items
router.get('/items', async (req, res) => {
  try {
    const { hospital_id, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await inventoryService.getInventoryItems({
      hospital_id,
      category,
      search,
      limit,
      offset
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const result = await inventoryService.updateInventoryItem(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock movement
router.post('/stock-movement', async (req, res) => {
  try {
    const result = await inventoryService.recordStockMovement(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reorder alerts
router.get('/reorder-alerts', async (req, res) => {
  try {
    const { hospital_id } = req.query;
    const result = await inventoryService.getReorderAlerts(hospital_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dispense medication
router.post('/dispense', async (req, res) => {
  try {
    const result = await inventoryService.dispenseMedication(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dispensing history
router.get('/dispensing/:patientId', async (req, res) => {
  try {
    const result = await inventoryService.getDispensingHistory(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add equipment
router.post('/equipment', async (req, res) => {
  try {
    const result = await inventoryService.addEquipment(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get equipment
router.get('/equipment', async (req, res) => {
  try {
    const { hospital_id, department, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await inventoryService.getEquipment({
      hospital_id,
      department,
      status,
      limit,
      offset
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule equipment maintenance
router.post('/equipment/maintenance', async (req, res) => {
  try {
    const result = await inventoryService.scheduleEquipmentMaintenance(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expiring items
router.get('/expiring/:hospitalId', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await inventoryService.getExpiringItems(req.params.hospitalId, days);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perform stock audit
router.post('/audit', async (req, res) => {
  try {
    const result = await inventoryService.performStockAudit(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock valuation
router.get('/valuation/:hospitalId', async (req, res) => {
  try {
    const result = await inventoryService.getStockValuation(req.params.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy routes for compatibility
router.get('/', async (req, res) => {
  // Redirect to items
  return router.handle({ ...req, url: '/items' }, res);
});

router.post('/update-stock', async (req, res) => {
  // Redirect to stock-movement
  return router.handle({ ...req, url: '/stock-movement' }, res);
});

module.exports = router;
