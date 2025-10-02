const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register route
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, firstName, lastName, role || 'patient']
    );
    
    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
