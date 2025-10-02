const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { sql } = require('../config/database');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      hospitalId: user.hospital_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phoneNumber').notEmpty().trim(),
  body('role').isIn(['hospital_owner', 'patient', 'doctor', 'nurse', 'receptionist'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, middleName, phoneNumber, role } = req.body;

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, middle_name, 
        phone_number, role, is_active, is_verified
      ) VALUES (
        ${email}, ${passwordHash}, ${firstName}, ${lastName}, ${middleName},
        ${phoneNumber}, ${role}, true, false
      ) RETURNING id, email, first_name, last_name, role
    `;

    // Generate token
    const token = generateToken(newUser[0]);

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0],
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, role, is_active
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `;

    // Get hospital association if any
    let hospitalInfo = null;
    if (['doctor', 'nurse', 'receptionist', 'billing_officer', 'inventory_manager', 'hr_manager', 'hospital_admin'].includes(user.role)) {
      const hospitals = await sql`
        SELECT h.id, h.name 
        FROM hospital_staff hs
        JOIN hospitals h ON h.id = hs.hospital_id
        WHERE hs.user_id = ${user.id} AND hs.is_active = true
      `;
      if (hospitals.length > 0) {
        hospitalInfo = hospitals[0];
      }
    }

    // Generate token
    const token = generateToken({ ...user, hospital_id: hospitalInfo?.id });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        hospital: hospitalInfo
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const users = await sql`
      SELECT id, email, first_name, last_name, role, is_active
      FROM users 
      WHERE id = ${decoded.id}
    `;

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      valid: true,
      user: users[0]
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
