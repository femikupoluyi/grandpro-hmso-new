const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createTestAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check if test admin already exists
    const checkResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@grandpro-hmso.ng']
    );

    if (checkResult.rows.length > 0) {
      console.log('Test admin already exists');
      await client.end();
      process.exit(0);
    }

    // Create test admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const insertResult = await client.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, role, 
        is_active, phone_number, name, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, $8, NOW()
      ) RETURNING *`,
      [
        'admin@grandpro-hmso.ng',
        hashedPassword,
        'Admin',
        'User',
        'ADMIN',
        true,
        '+2348012345678',
        'Admin User'
      ]
    );

    const admin = insertResult.rows[0];
    
    console.log('Test admin created successfully:');
    console.log('Email: admin@grandpro-hmso.ng');
    console.log('Password: Admin@123');
    console.log('Role: ADMIN');
    console.log('User ID:', admin.id);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test admin:', error);
    await client.end();
    process.exit(1);
  }
}

createTestAdmin();
