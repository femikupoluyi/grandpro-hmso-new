/**
 * Pharmacy Integration Routes
 */

const express = require('express');
const router = express.Router();
const PharmacyIntegration = require('../integrations/pharmacyIntegration');

// Initialize pharmacy integration
const pharmacy = new PharmacyIntegration();

// Check drug availability
router.get('/availability/:drugId', async (req, res) => {
  try {
    const { drugId } = req.params;
    const { supplierId } = req.query;
    
    // Mock availability check for demo
    const availability = {
      drugId,
      drugName: 'Paracetamol 500mg',
      supplierId: supplierId || 'emzor',
      inStock: true,
      quantity: 5000,
      unitPrice: 50,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      manufacturer: 'Emzor Pharmaceuticals',
      batchNumber: 'BATCH-2025-001'
    };
    
    res.json({
      success: true,
      ...availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit restock order
router.post('/restock', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Mock restock order for demo
    const order = {
      orderId: `ORD-${Date.now()}`,
      status: 'confirmed',
      createdAt: new Date(),
      items: orderData.items || [
        {
          drugId: orderData.drugId,
          drugName: orderData.drugName,
          quantity: orderData.quantity,
          unitPrice: 50,
          totalPrice: orderData.quantity * 50
        }
      ],
      supplierId: orderData.supplierId || 'emzor',
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      deliveryAddress: 'Lagos General Hospital, Victoria Island',
      totalAmount: orderData.quantity * 50,
      paymentTerms: 'Net 30 days'
    };
    
    res.json({
      success: true,
      ...order,
      message: 'Restock order placed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Set auto-reorder rules
router.post('/auto-reorder', async (req, res) => {
  try {
    const { drugId, minimumStock, reorderQuantity, supplierId } = req.body;
    
    // Mock auto-reorder setup for demo
    const rule = {
      ruleId: `RULE-${Date.now()}`,
      drugId,
      drugName: 'Paracetamol 500mg',
      minimumStock,
      reorderQuantity,
      supplierId: supplierId || 'emzor',
      enabled: true,
      createdAt: new Date(),
      lastTriggered: null
    };
    
    res.json({
      success: true,
      ...rule,
      message: 'Auto-reorder rule created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get order status
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Mock order status for demo
    const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
      success: true,
      orderId,
      status: randomStatus,
      lastUpdated: new Date(),
      trackingNumber: randomStatus === 'shipped' ? `TRK-${Date.now()}` : null,
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      supplier: 'Emzor Pharmaceuticals'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get supplier catalog
router.get('/catalog', async (req, res) => {
  try {
    const { supplierId, category } = req.query;
    
    // Mock catalog for demo
    const catalog = [
      {
        drugId: 'DRUG001',
        name: 'Paracetamol 500mg',
        category: 'Analgesics',
        unitPrice: 50,
        packSize: '100 tablets',
        inStock: true
      },
      {
        drugId: 'DRUG002',
        name: 'Amoxicillin 250mg',
        category: 'Antibiotics',
        unitPrice: 150,
        packSize: '20 capsules',
        inStock: true
      },
      {
        drugId: 'DRUG003',
        name: 'Omeprazole 20mg',
        category: 'Gastrointestinal',
        unitPrice: 200,
        packSize: '30 tablets',
        inStock: true
      },
      {
        drugId: 'DRUG004',
        name: 'Metformin 500mg',
        category: 'Antidiabetic',
        unitPrice: 120,
        packSize: '60 tablets',
        inStock: true
      }
    ];
    
    const filtered = category 
      ? catalog.filter(item => item.category === category)
      : catalog;
    
    res.json({
      success: true,
      supplierId: supplierId || 'emzor',
      supplier: 'Emzor Pharmaceuticals',
      catalog: filtered,
      totalItems: filtered.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
