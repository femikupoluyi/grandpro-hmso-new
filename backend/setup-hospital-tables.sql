-- Hospital Management Database Schema
-- For GrandPro HMSO System

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    genotype VARCHAR(10),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    next_of_kin_name VARCHAR(200),
    next_of_kin_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    nhis_number VARCHAR(50),
    allergies JSONB,
    chronic_conditions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20),
    role VARCHAR(50),
    department_id INTEGER REFERENCES departments(id),
    specialization VARCHAR(100),
    qualification VARCHAR(200),
    employment_date DATE,
    employment_type VARCHAR(50),
    salary_grade VARCHAR(20),
    base_salary DECIMAL(12, 2),
    allowances JSONB,
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    next_of_kin_name VARCHAR(200),
    next_of_kin_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Encounters table
CREATE TABLE IF NOT EXISTS encounters (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES staff(id),
    department_id INTEGER REFERENCES departments(id),
    encounter_type VARCHAR(50),
    encounter_date TIMESTAMP DEFAULT NOW(),
    chief_complaint TEXT,
    symptoms JSONB,
    vital_signs JSONB,
    diagnosis TEXT,
    treatment_plan TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Medical history table
CREATE TABLE IF NOT EXISTS medical_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    encounter_id INTEGER REFERENCES encounters(id),
    created_by VARCHAR(100),
    summary TEXT,
    complaint TEXT,
    diagnosis TEXT,
    treatment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    dosage_form VARCHAR(50),
    strength VARCHAR(50),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    encounter_id INTEGER REFERENCES encounters(id),
    doctor_id INTEGER REFERENCES staff(id),
    medication_id INTEGER,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration INTEGER,
    quantity INTEGER,
    instructions TEXT,
    prescribed_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lab tests table
CREATE TABLE IF NOT EXISTS lab_tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    reference_range VARCHAR(100),
    unit VARCHAR(50),
    cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lab orders table
CREATE TABLE IF NOT EXISTS lab_orders (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    encounter_id INTEGER REFERENCES encounters(id),
    doctor_id INTEGER REFERENCES staff(id),
    test_id INTEGER REFERENCES lab_tests(id),
    priority VARCHAR(50),
    clinical_info TEXT,
    order_date TIMESTAMP DEFAULT NOW(),
    completed_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING'
);

-- Lab results table
CREATE TABLE IF NOT EXISTS lab_results (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    lab_order_id INTEGER REFERENCES lab_orders(id),
    test_id INTEGER REFERENCES lab_tests(id),
    result_value VARCHAR(100),
    reference_range VARCHAR(100),
    unit VARCHAR(50),
    interpretation VARCHAR(50),
    test_date DATE,
    reported_by VARCHAR(100),
    verified_by VARCHAR(100),
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id),
    encounter_id INTEGER REFERENCES encounters(id),
    bill_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    nhis_number VARCHAR(50),
    hmo_provider VARCHAR(100),
    total_amount DECIMAL(12, 2),
    insurance_coverage DECIMAL(12, 2) DEFAULT 0,
    patient_amount DECIMAL(12, 2),
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    due_date DATE,
    last_payment_date DATE,
    created_by VARCHAR(100),
    hospital_id INTEGER DEFAULT 1,
    insurance_payment_received DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id),
    item_type VARCHAR(50),
    item_code VARCHAR(50),
    description TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(12, 2),
    insurance_covered DECIMAL(12, 2) DEFAULT 0,
    patient_pays DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id),
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    amount_paid DECIMAL(12, 2),
    reference_number VARCHAR(50),
    received_by VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insurance claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id),
    claim_number VARCHAR(50) UNIQUE,
    provider_type VARCHAR(50),
    provider_name VARCHAR(100),
    policy_number VARCHAR(50),
    claim_amount DECIMAL(12, 2),
    approved_amount DECIMAL(12, 2),
    denial_reason TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    submitted_date DATE,
    processed_date DATE,
    processed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    item_type VARCHAR(50),
    unit_of_measure VARCHAR(50),
    quantity_in_stock DECIMAL(12, 2),
    reorder_level DECIMAL(12, 2),
    reorder_quantity DECIMAL(12, 2),
    unit_cost DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    supplier_id INTEGER,
    expiry_date DATE,
    batch_number VARCHAR(50),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    medication_id INTEGER,
    hospital_id INTEGER DEFAULT 1,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id),
    movement_type VARCHAR(50),
    quantity DECIMAL(12, 2),
    reference_number VARCHAR(50),
    reason TEXT,
    performed_by VARCHAR(100),
    movement_date TIMESTAMP DEFAULT NOW(),
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    notes TEXT,
    previous_quantity DECIMAL(12, 2),
    new_quantity DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff roster table
CREATE TABLE IF NOT EXISTS staff_roster (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    department_id INTEGER REFERENCES departments(id),
    shift_type VARCHAR(50),
    start_time TIME,
    end_time TIME,
    roster_date DATE,
    week_number INTEGER,
    month INTEGER,
    year INTEGER,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, roster_date, shift_type)
);

-- Staff attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    roster_id INTEGER REFERENCES staff_roster(id),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    attendance_date DATE DEFAULT CURRENT_DATE,
    hours_worked DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    shift_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PRESENT',
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leave applications table
CREATE TABLE IF NOT EXISTS leave_applications (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    leave_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    days_requested INTEGER,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    applied_date DATE DEFAULT CURRENT_DATE,
    approved_by VARCHAR(100),
    approval_date DATE,
    approval_comments TEXT,
    relief_staff_id INTEGER REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    leave_type VARCHAR(50),
    year INTEGER,
    entitled_days INTEGER,
    used_days INTEGER DEFAULT 0,
    remaining_days INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, leave_type, year)
);

-- Wards table (for occupancy tracking)
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50),
    total_beds INTEGER,
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bed assignments table
CREATE TABLE IF NOT EXISTS bed_assignments (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id),
    patient_id INTEGER REFERENCES patients(id),
    bed_number VARCHAR(20),
    admission_date TIMESTAMP DEFAULT NOW(),
    discharge_date TIMESTAMP,
    admission_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'OCCUPIED',
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clinical alerts table
CREATE TABLE IF NOT EXISTS clinical_alerts (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    hospital_id INTEGER DEFAULT 1
);

-- Inventory alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id),
    alert_type VARCHAR(50),
    message TEXT,
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    hospital_id INTEGER DEFAULT 1
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    total_amount DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    received_date DATE,
    created_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    item_id INTEGER REFERENCES inventory_items(id),
    quantity_ordered DECIMAL(12, 2),
    quantity_received DECIMAL(12, 2),
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    received_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency visits table
CREATE TABLE IF NOT EXISTS emergency_visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    arrival_time TIMESTAMP DEFAULT NOW(),
    triage_level INTEGER,
    treatment_start_time TIMESTAMP,
    status VARCHAR(50),
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Medical equipment table
CREATE TABLE IF NOT EXISTS medical_equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Operating room schedule table
CREATE TABLE IF NOT EXISTS operating_room_schedule (
    id SERIAL PRIMARY KEY,
    or_name VARCHAR(100),
    surgery_date DATE,
    start_time TIME,
    end_time TIME,
    hospital_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Daily revenue table
CREATE TABLE IF NOT EXISTS daily_revenue (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    hospital_id INTEGER DEFAULT 1,
    cash_amount DECIMAL(12, 2) DEFAULT 0,
    card_amount DECIMAL(12, 2) DEFAULT 0,
    transfer_amount DECIMAL(12, 2) DEFAULT 0,
    insurance_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, hospital_id)
);

-- Equipment maintenance table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER,
    maintenance_type VARCHAR(50),
    scheduled_date DATE,
    description TEXT,
    assigned_to VARCHAR(100),
    priority VARCHAR(20),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Medication dispensing table
CREATE TABLE IF NOT EXISTS medication_dispensing (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES prescriptions(id),
    dispensed_by VARCHAR(100),
    quantity_dispensed INTEGER,
    dispensed_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Patient satisfaction table
CREATE TABLE IF NOT EXISTS patient_satisfaction (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    encounter_id INTEGER REFERENCES encounters(id),
    rating INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Communication logs table
CREATE TABLE IF NOT EXISTS communication_logs (
    id SERIAL PRIMARY KEY,
    recipient_id VARCHAR(100),
    recipient_type VARCHAR(50),
    message_type VARCHAR(50),
    message_content TEXT,
    channels JSONB,
    priority VARCHAR(20),
    status VARCHAR(50),
    sent_at TIMESTAMP,
    delivered_channels JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER,
    recipient_phone VARCHAR(20),
    message TEXT,
    provider VARCHAR(50),
    status VARCHAR(50),
    cost_naira DECIMAL(10, 2),
    sent_at TIMESTAMP
);

-- WhatsApp logs table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER,
    recipient_phone VARCHAR(20),
    message TEXT,
    template_used VARCHAR(100),
    status VARCHAR(50),
    sent_at TIMESTAMP
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER,
    recipient_email VARCHAR(100),
    subject VARCHAR(200),
    content TEXT,
    template_used VARCHAR(100),
    status VARCHAR(50),
    sent_at TIMESTAMP
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50),
    staff_id INTEGER,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO departments (name, description) VALUES 
    ('General Medicine', 'General medical consultations and treatment'),
    ('Surgery', 'Surgical procedures and operations'),
    ('Pediatrics', 'Child healthcare'),
    ('Emergency', 'Emergency medical services')
ON CONFLICT DO NOTHING;

INSERT INTO medications (name, dosage_form, strength, category) VALUES
    ('Amoxicillin', 'Capsule', '500mg', 'Antibiotic'),
    ('Paracetamol', 'Tablet', '500mg', 'Analgesic'),
    ('Ibuprofen', 'Tablet', '400mg', 'NSAID')
ON CONFLICT DO NOTHING;

INSERT INTO lab_tests (name, category, reference_range, unit, cost) VALUES
    ('Complete Blood Count', 'Hematology', '4.5-11.0', '10^9/L', 5000),
    ('Malaria Test', 'Parasitology', 'Negative', '', 2000),
    ('Blood Sugar', 'Chemistry', '70-110', 'mg/dL', 3000)
ON CONFLICT DO NOTHING;

INSERT INTO wards (name, ward_type, total_beds, hospital_id) VALUES
    ('General Ward A', 'GENERAL', 20, 1),
    ('ICU', 'INTENSIVE', 10, 1),
    ('Maternity Ward', 'MATERNITY', 15, 1),
    ('Pediatric Ward', 'PEDIATRIC', 25, 1)
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, contact_phone, contact_email, address) VALUES
    ('MediSupply Nigeria Ltd', '+2348012345678', 'info@medisupply.ng', 'Lagos, Nigeria'),
    ('PharmaCare Distribution', '+2348087654321', 'sales@pharmacare.ng', 'Abuja, Nigeria')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_registration ON patients(registration_number);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
