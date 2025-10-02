const express = require('express');
const router = express.Router();

// Get patient records
router.get('/patients', async (req, res) => {
  res.json({ message: 'Patient records', records: [] });
});

// Get patient by ID
router.get('/patients/:id', async (req, res) => {
  res.json({ message: 'Patient record', id: req.params.id });
});

module.exports = router;
