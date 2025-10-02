const express = require('express');
const router = express.Router();

// Get staff list
router.get('/staff', async (req, res) => {
  res.json({ message: 'Staff list', staff: [] });
});

// Get schedules
router.get('/schedules', async (req, res) => {
  res.json({ message: 'Staff schedules', schedules: [] });
});

module.exports = router;
