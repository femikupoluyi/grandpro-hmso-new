const express = require('express');
const { sql } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = await sql`
      SELECT 
        id, email, first_name, last_name, middle_name, 
        phone_number, role, is_active, is_verified, 
        last_login, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `;

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const users = await sql`
      SELECT 
        id, email, first_name, last_name, middle_name, 
        phone_number, role, is_active, is_verified, 
        last_login, created_at
      FROM users
      WHERE id = ${req.user.id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, middleName, phoneNumber } = req.body;

    const updated = await sql`
      UPDATE users
      SET 
        first_name = ${firstName || sql`first_name`},
        last_name = ${lastName || sql`last_name`},
        middle_name = ${middleName || sql`middle_name`},
        phone_number = ${phoneNumber || sql`phone_number`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.user.id}
      RETURNING id, email, first_name, last_name, middle_name, phone_number, role
    `;

    res.json({
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
