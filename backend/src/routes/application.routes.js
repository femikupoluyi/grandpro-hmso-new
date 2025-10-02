const express = require('express');
const router = express.Router();

// Get all applications
router.get('/', async (req, res) => {
  res.json({ message: 'Applications list', applications: [] });
});

// Get application by ID
router.get('/:id', async (req, res) => {
  res.json({ message: 'Application details', id: req.params.id });
});

module.exports = router;
