const express = require('express');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  res.json({ message: 'Users list', users: [] });
});

// Get user by ID
router.get('/:id', async (req, res) => {
  res.json({ message: 'User details', id: req.params.id });
});

module.exports = router;
