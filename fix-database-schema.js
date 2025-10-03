const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function fixDatabaseSchema() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        port: process.env.DATABASE_PORT || 5432,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Create audit_logs table
        console.log('Creating audit_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                action VARCHAR(100),
                resource VARCHAR(100),
                resource_id VARCHAR(100),
                ip_address VARCHAR(45),
                user_agent TEXT,
                request_method VARCHAR(10),
                request_path TEXT,
                request_body TEXT,
                response_status INTEGER,
                response_time_ms INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB
            )
        `);
        console.log('✓ audit_logs table created');

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        `);
        console.log('✓ Indexes created');

        // Ensure hospitals table exists with all columns
        console.log('Ensuring hospitals table structure...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS hospitals (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(255),
                license_number VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                type VARCHAR(50) DEFAULT 'General',
                bed_capacity INTEGER DEFAULT 50,
                services_offered TEXT[],
                has_emergency BOOLEAN DEFAULT true,
                has_pharmacy BOOLEAN DEFAULT true,
                has_lab BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ hospitals table ensured');

        // Add sample hospitals if none exist
        const hospitalCount = await client.query('SELECT COUNT(*) FROM hospitals');
        if (hospitalCount.rows[0].count == 0) {
            console.log('Adding sample Nigerian hospitals...');
            await client.query(`
                INSERT INTO hospitals (name, code, address, city, state, phone, email, license_number, type, bed_capacity) VALUES
                ('Lagos University Teaching Hospital', 'LUTH001', 'Idi-Araba, Surulere', 'Lagos', 'Lagos', '+234-1-2345678', 'info@luth.gov.ng', 'LIC-LUTH-2025', 'Teaching Hospital', 500),
                ('National Hospital Abuja', 'NHA001', 'Plot 132, Central District', 'Abuja', 'FCT', '+234-9-1234567', 'info@nha.gov.ng', 'LIC-NHA-2025', 'National Hospital', 400),
                ('University College Hospital Ibadan', 'UCH001', 'Queen Elizabeth Road', 'Ibadan', 'Oyo', '+234-2-3456789', 'info@uch.gov.ng', 'LIC-UCH-2025', 'Teaching Hospital', 450),
                ('Aminu Kano Teaching Hospital', 'AKTH001', 'Zaria Road', 'Kano', 'Kano', '+234-64-123456', 'info@akth.gov.ng', 'LIC-AKTH-2025', 'Teaching Hospital', 350),
                ('Rivers State Hospital', 'RSH001', 'Old GRA', 'Port Harcourt', 'Rivers', '+234-84-234567', 'info@rsh.gov.ng', 'LIC-RSH-2025', 'State Hospital', 200)
            `);
            console.log('✓ Sample hospitals added');
        }

        // Ensure HospitalOwner table exists
        console.log('Creating HospitalOwner table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS HospitalOwner (
                id SERIAL PRIMARY KEY,
                hospital_id INTEGER REFERENCES hospitals(id),
                owner_name VARCHAR(255),
                owner_email VARCHAR(255),
                owner_phone VARCHAR(20),
                contract_status VARCHAR(50) DEFAULT 'Active',
                commission_rate DECIMAL(5,2) DEFAULT 10.0,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                last_payout_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ HospitalOwner table created');

        // Ensure applications table exists
        console.log('Creating applications table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                hospital_name VARCHAR(255) NOT NULL,
                owner_name VARCHAR(255) NOT NULL,
                owner_email VARCHAR(255) NOT NULL,
                owner_phone VARCHAR(20),
                status VARCHAR(50) DEFAULT 'Pending',
                score INTEGER DEFAULT 0,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP,
                reviewer_id INTEGER,
                notes TEXT,
                documents JSONB
            )
        `);
        console.log('✓ applications table created');

        // Ensure operations_metrics table exists
        console.log('Creating operations_metrics table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS operations_metrics (
                id SERIAL PRIMARY KEY,
                hospital_id INTEGER REFERENCES hospitals(id),
                metric_date DATE DEFAULT CURRENT_DATE,
                patient_inflow INTEGER DEFAULT 0,
                admissions INTEGER DEFAULT 0,
                discharges INTEGER DEFAULT 0,
                bed_occupancy_rate DECIMAL(5,2) DEFAULT 0,
                average_wait_time INTEGER DEFAULT 0,
                staff_utilization DECIMAL(5,2) DEFAULT 0,
                revenue DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ operations_metrics table created');

        // Ensure inventory table exists
        console.log('Creating inventory table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                hospital_id INTEGER REFERENCES hospitals(id),
                item_name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                quantity INTEGER DEFAULT 0,
                unit VARCHAR(50),
                reorder_level INTEGER DEFAULT 10,
                unit_price DECIMAL(10,2) DEFAULT 0,
                supplier VARCHAR(255),
                last_restock_date DATE,
                expiry_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ inventory table created');

        // Add sample inventory if none exists
        const inventoryCount = await client.query('SELECT COUNT(*) FROM inventory');
        if (inventoryCount.rows[0].count == 0) {
            console.log('Adding sample inventory items...');
            await client.query(`
                INSERT INTO inventory (hospital_id, item_name, category, quantity, unit, unit_price, supplier) VALUES
                (1, 'Paracetamol 500mg', 'Medicine', 1000, 'Tablets', 5.00, 'PharmaCo Nigeria'),
                (1, 'Surgical Gloves', 'Consumables', 500, 'Boxes', 250.00, 'MedSupply Ltd'),
                (1, 'Syringes 5ml', 'Consumables', 2000, 'Units', 10.00, 'MedEquip Nigeria'),
                (1, 'Bandages', 'Consumables', 300, 'Rolls', 50.00, 'Healthcare Supplies'),
                (1, 'IV Fluids', 'Medicine', 200, 'Bags', 150.00, 'PharmaCo Nigeria')
            `);
            console.log('✓ Sample inventory added');
        }

        console.log('\n✅ All database fixes completed successfully!');

    } catch (error) {
        console.error('Database fix error:', error);
    } finally {
        await client.end();
    }
}

fixDatabaseSchema();
