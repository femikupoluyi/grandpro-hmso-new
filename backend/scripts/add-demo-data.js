const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function addDemoData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Add demo projects
    await client.query(`
      INSERT INTO projects (name, hospital_id, status, budget, start_date, end_date, description, project_manager, progress)
      VALUES 
      ('Lagos General Hospital ICU Expansion', (SELECT id FROM hospitals LIMIT 1), 'active', 50000000, '2025-09-01', '2026-03-01', 'Expanding ICU capacity from 10 to 30 beds', 'Dr. Adebayo Ogundimu', 45),
      ('Abuja Medical Centre Renovation', (SELECT id FROM hospitals LIMIT 1 OFFSET 1), 'planning', 30000000, '2025-11-01', '2026-06-01', 'Complete renovation of emergency department', 'Engr. Fatima Hassan', 0),
      ('Port Harcourt Clinic Digital Upgrade', (SELECT id FROM hospitals LIMIT 1 OFFSET 2), 'approved', 15000000, '2025-10-15', '2026-01-15', 'Installing new digital X-ray and MRI systems', 'Mr. Chidi Nwosu', 10)
    `);

    // Update hospital metrics
    await client.query(`
      UPDATE hospitals 
      SET bed_capacity = 150, 
          has_emergency = true,
          has_pharmacy = true,
          has_lab = true
      WHERE id IN (SELECT id FROM hospitals LIMIT 3)
    `);

    console.log('Demo data added successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error adding demo data:', error);
    await client.end();
    process.exit(1);
  }
}

addDemoData();
