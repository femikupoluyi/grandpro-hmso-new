const express = require('express');
const router = express.Router();

// Get inventory items
router.get('/', async (req, res) => {
  res.json({ message: 'Inventory items', items: [] });
});

// Update stock
router.post('/update-stock', async (req, res) => {
  res.json({ message: 'Stock updated', success: true });
});

module.exports = router;
