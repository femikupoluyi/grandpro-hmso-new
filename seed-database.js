const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection from environment
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_InhJz3HWVO6E@ep-solitary-recipe-adrz8omw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create hospitals table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        capacity INTEGER,
        phone VARCHAR(20),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const defaultPassword = await bcrypt.hash('password123', 10);
    
    // Check existing columns in users table
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = result.rows.map(row => row.column_name);
    const hasPhone = columns.includes('phone');
    const hasStatus = columns.includes('status');
    
    // Build insert query based on available columns
    const insertColumns = ['email', 'password_hash', 'role', 'first_name', 'last_name'];
    const insertValues = [];
    
    if (hasPhone) insertColumns.push('phone');
    if (hasStatus) insertColumns.push('status');
    
    const insertQuery = `
      INSERT INTO users (${insertColumns.join(', ')})
      VALUES (${insertColumns.map((_, i) => '$' + (i + 1)).join(', ')})
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
    `;
    
    // Insert admin user
    const adminValues = ['admin@grandpro.com', hashedPassword, 'ADMIN', 'System', 'Administrator'];
    if (hasPhone) adminValues.push('+234-800-000-0000');
    if (hasStatus) adminValues.push('active');
    await pool.query(insertQuery, adminValues);
    
    // Insert hospital owner
    const ownerValues = ['john.owner@example.com', defaultPassword, 'HOSPITAL_OWNER', 'John', 'Adebayo'];
    if (hasPhone) ownerValues.push('+234-803-123-4567');
    if (hasStatus) ownerValues.push('active');
    await pool.query(insertQuery, ownerValues);
    
    // Insert doctor
    const doctorValues = ['dr.adebayo@luth.ng', defaultPassword, 'DOCTOR', 'Dr. Adebayo', 'Ogundimu'];
    if (hasPhone) doctorValues.push('+234-802-345-6789');
    if (hasStatus) doctorValues.push('active');
    await pool.query(insertQuery, doctorValues);
    
    // Insert nurse
    const nurseValues = ['nurse.funke@luth.ng', defaultPassword, 'NURSE', 'Funke', 'Adeyemi'];
    if (hasPhone) nurseValues.push('+234-801-234-5678');
    if (hasStatus) nurseValues.push('active');
    await pool.query(insertQuery, nurseValues);
    
    // Insert patient
    const patientValues = ['patient1@example.com', defaultPassword, 'PATIENT', 'Tunde', 'Bakare'];
    if (hasPhone) patientValues.push('+234-805-678-9012');
    if (hasStatus) patientValues.push('active');
    await pool.query(insertQuery, patientValues);
    
    // Insert billing clerk
    const billingValues = ['billing@luth.ng', defaultPassword, 'BILLING_CLERK', 'Grace', 'Okonkwo'];
    if (hasPhone) billingValues.push('+234-806-789-0123');
    if (hasStatus) billingValues.push('active');
    await pool.query(insertQuery, billingValues);
    
    // Check existing columns in hospitals table
    const hospitalResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hospitals'
    `);
    
    const hospitalColumns = hospitalResult.rows.map(row => row.column_name);
    const hasCapacity = hospitalColumns.includes('capacity');
    
    // Insert sample hospitals
    const hospitals = [
      {
        name: 'Lagos University Teaching Hospital',
        code: 'LUTH',
        address: 'Idi-Araba, Surulere',
        city: 'Lagos',
        state: 'Lagos',
        capacity: 500
      },
      {
        name: 'National Hospital Abuja',
        code: 'NHA',
        address: 'Central Business District',
        city: 'Abuja',
        state: 'FCT',
        capacity: 350
      },
      {
        name: 'University College Hospital',
        code: 'UCH',
        address: 'Queen Elizabeth Road, Ibadan',
        city: 'Ibadan',
        state: 'Oyo',
        capacity: 400
      },
      {
        name: 'St. Nicholas Hospital',
        code: 'SNH',
        address: '57 Campbell Street, Lagos Island',
        city: 'Lagos',
        state: 'Lagos',
        capacity: 150
      },
      {
        name: 'Reddington Hospital',
        code: 'RDH',
        address: '12 Idowu Martins Street, Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        capacity: 100
      }
    ];
    
    for (const hospital of hospitals) {
      const hospitalInsertColumns = ['name', 'code', 'address', 'city', 'state'];
      const hospitalInsertValues = [hospital.name, hospital.code, hospital.address, hospital.city, hospital.state];
      
      if (hasCapacity) {
        hospitalInsertColumns.push('capacity');
        hospitalInsertValues.push(hospital.capacity);
      }
      
      const hospitalInsertQuery = `
        INSERT INTO hospitals (${hospitalInsertColumns.join(', ')})
        VALUES (${hospitalInsertColumns.map((_, i) => '$' + (i + 1)).join(', ')})
        ON CONFLICT (code) DO UPDATE SET 
          name = EXCLUDED.name,
          address = EXCLUDED.address
      `;
      
      await pool.query(hospitalInsertQuery, hospitalInsertValues);
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📝 User Credentials:');
    console.log('------------------------');
    console.log('Admin: admin@grandpro.com / Admin123!');
    console.log('Hospital Owner: john.owner@example.com / password123');
    console.log('Doctor: dr.adebayo@luth.ng / password123');
    console.log('Nurse: nurse.funke@luth.ng / password123');
    console.log('Patient: patient1@example.com / password123');
    console.log('Billing Clerk: billing@luth.ng / password123');
    console.log('------------------------\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

// Run seeding
seedDatabase();
