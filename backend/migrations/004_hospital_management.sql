-- Migration: Hospital Management Core Operations
-- Description: Creates tables for EMR, billing, inventory, HR, and analytics
-- Author: GrandPro HMSO Development Team
-- Date: 2025-10-02

-- ============================================
-- ELECTRONIC MEDICAL RECORDS (EMR)
-- ============================================

-- Patient medical records
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_group VARCHAR(5),
    genotype VARCHAR(5),
    marital_status VARCHAR(20),
    
    -- Contact Information
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    postal_code VARCHAR(20),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Insurance Information
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    nhis_number VARCHAR(50),
    hmo_provider VARCHAR(100),
    hmo_plan VARCHAR(100),
    
    -- Medical History
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications TEXT[],
    past_surgeries TEXT[],
    family_medical_history JSONB,
    
    -- System Fields
    hospital_id UUID REFERENCES hospitals(id),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT patient_number_format CHECK (patient_number ~ '^GP[0-9]{10}$')
);

-- Medical encounters/visits
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_type VARCHAR(50) NOT NULL, -- OUTPATIENT, INPATIENT, EMERGENCY, CONSULTATION
    encounter_date TIMESTAMPTZ NOT NULL,
    department VARCHAR(100),
    assigned_doctor_id UUID,
    assigned_nurse_id UUID,
    
    -- Vital Signs
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    pulse_rate INTEGER,
    temperature_celsius DECIMAL(4,1),
    respiratory_rate INTEGER,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,1),
    bmi DECIMAL(4,1),
    oxygen_saturation INTEGER,
    
    -- Clinical Information
    chief_complaint TEXT,
    presenting_symptoms TEXT[],
    physical_examination JSONB,
    provisional_diagnosis TEXT[],
    final_diagnosis TEXT[],
    treatment_plan TEXT,
    prescriptions JSONB,
    lab_orders JSONB,
    imaging_orders JSONB,
    procedures_performed JSONB,
    
    -- Outcome
    encounter_status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED
    discharge_summary TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    referral_to VARCHAR(255),
    
    -- System Fields
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Clinical notes
CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL, -- PROGRESS, NURSING, DISCHARGE, CONSULTATION
    note_content TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(200),
    author_role VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_confidential BOOLEAN DEFAULT false
);

-- ============================================
-- BILLING & REVENUE MANAGEMENT
-- ============================================

-- Billing accounts
CREATE TABLE IF NOT EXISTS billing_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- CASH, INSURANCE, CORPORATE, NHIS
    primary_payer VARCHAR(100),
    secondary_payer VARCHAR(100),
    credit_limit DECIMAL(12,2),
    current_balance DECIMAL(12,2) DEFAULT 0,
    total_billed DECIMAL(12,2) DEFAULT 0,
    total_paid DECIMAL(12,2) DEFAULT 0,
    last_payment_date DATE,
    account_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Service price list
CREATE TABLE IF NOT EXISTS service_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    service_category VARCHAR(100),
    department VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    nhis_price DECIMAL(10,2),
    hmo_price DECIMAL(10,2),
    vat_applicable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bills/Invoices
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    encounter_id UUID REFERENCES encounters(id),
    billing_account_id UUID REFERENCES billing_accounts(id),
    bill_date DATE NOT NULL,
    due_date DATE,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2),
    
    -- Payment Information
    payment_method VARCHAR(50), -- CASH, CARD, TRANSFER, INSURANCE
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, CANCELLED
    insurance_claim_number VARCHAR(100),
    insurance_approved_amount DECIMAL(12,2),
    
    -- System Fields
    hospital_id UUID REFERENCES hospitals(id),
    created_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bill line items
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    service_id UUID REFERENCES service_prices(id),
    service_code VARCHAR(50),
    service_name VARCHAR(200),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 7.5, -- Nigerian VAT
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    bill_id UUID REFERENCES bills(id),
    patient_id UUID REFERENCES patients(id),
    payment_date TIMESTAMPTZ NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    card_last_four VARCHAR(4),
    receipt_number VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'COMPLETED',
    notes TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    collected_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Item categories
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(50) NOT NULL, -- DRUG, CONSUMABLE, EQUIPMENT
    parent_category_id UUID REFERENCES item_categories(id),
    description TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    category_id UUID REFERENCES item_categories(id),
    item_type VARCHAR(50) NOT NULL, -- DRUG, CONSUMABLE, EQUIPMENT
    
    -- Drug specific fields
    drug_class VARCHAR(100),
    dosage_form VARCHAR(50),
    strength VARCHAR(50),
    
    -- Stock Information
    unit_of_measure VARCHAR(50) NOT NULL,
    reorder_level INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    minimum_stock INTEGER NOT NULL,
    maximum_stock INTEGER,
    current_stock INTEGER DEFAULT 0,
    
    -- Pricing
    unit_cost DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    
    -- Storage
    storage_conditions VARCHAR(200),
    shelf_location VARCHAR(100),
    
    -- System Fields
    is_controlled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    item_id UUID REFERENCES inventory_items(id),
    transaction_type VARCHAR(50) NOT NULL, -- PURCHASE, SALE, ADJUSTMENT, TRANSFER, EXPIRED
    transaction_date TIMESTAMPTZ NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    
    -- Reference Information
    reference_type VARCHAR(50), -- PO, INVOICE, PRESCRIPTION, ADJUSTMENT
    reference_id UUID,
    supplier_id UUID,
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Stock Levels
    stock_before INTEGER,
    stock_after INTEGER,
    
    -- System Fields
    performed_by UUID,
    approved_by UUID,
    notes TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    
    -- Business Information
    business_registration VARCHAR(100),
    tax_id VARCHAR(50),
    payment_terms INTEGER DEFAULT 30, -- Days
    credit_limit DECIMAL(12,2),
    
    -- Performance
    rating DECIMAL(3,2),
    total_orders INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    
    -- System Fields
    is_active BOOLEAN DEFAULT true,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Status
    order_status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED, RECEIVED, CANCELLED
    payment_status VARCHAR(50) DEFAULT 'UNPAID',
    
    -- System Fields
    requested_by UUID,
    approved_by UUID,
    received_by UUID,
    notes TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- HR & ROSTERING
-- ============================================

-- Staff members
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Employment Information
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    staff_category VARCHAR(50), -- MEDICAL, NURSING, ADMIN, SUPPORT
    employment_type VARCHAR(50), -- FULL_TIME, PART_TIME, CONTRACT
    employment_date DATE NOT NULL,
    
    -- Professional Information
    qualification VARCHAR(200),
    license_number VARCHAR(100),
    license_expiry DATE,
    specialization VARCHAR(200),
    years_of_experience INTEGER,
    
    -- Compensation
    salary_grade VARCHAR(20),
    basic_salary DECIMAL(12,2),
    allowances JSONB,
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    
    -- System Fields
    reports_to UUID REFERENCES staff(id),
    is_active BOOLEAN DEFAULT true,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work schedules/rosters
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL, -- MORNING, AFTERNOON, NIGHT, ON_CALL
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    schedule_status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    notes TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_staff_schedule UNIQUE (staff_id, schedule_date, shift_type)
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    schedule_id UUID REFERENCES work_schedules(id),
    attendance_status VARCHAR(50), -- PRESENT, ABSENT, LATE, HALF_DAY, HOLIDAY, LEAVE
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_staff_attendance UNIQUE (staff_id, attendance_date)
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- ANNUAL, SICK, MATERNITY, PATERNITY, STUDY
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    approved_by UUID REFERENCES staff(id),
    approval_date TIMESTAMPTZ,
    approval_notes TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_number VARCHAR(50) UNIQUE NOT NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    payroll_month INTEGER NOT NULL,
    payroll_year INTEGER NOT NULL,
    
    -- Earnings
    basic_salary DECIMAL(12,2) NOT NULL,
    housing_allowance DECIMAL(10,2) DEFAULT 0,
    transport_allowance DECIMAL(10,2) DEFAULT 0,
    medical_allowance DECIMAL(10,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL,
    
    -- Deductions
    tax DECIMAL(10,2) DEFAULT 0,
    pension DECIMAL(10,2) DEFAULT 0,
    nhf DECIMAL(10,2) DEFAULT 0, -- National Housing Fund
    loan_repayment DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- Net Pay
    net_salary DECIMAL(12,2) NOT NULL,
    
    -- Payment Information
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSED, PAID
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- System Fields
    processed_by UUID,
    approved_by UUID,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_staff_payroll UNIQUE (staff_id, payroll_month, payroll_year)
);

-- ============================================
-- ANALYTICS & REPORTING
-- ============================================

-- Daily operational metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    hospital_id UUID REFERENCES hospitals(id),
    
    -- Patient Metrics
    total_patients_registered INTEGER DEFAULT 0,
    outpatient_visits INTEGER DEFAULT 0,
    inpatient_admissions INTEGER DEFAULT 0,
    emergency_visits INTEGER DEFAULT 0,
    discharges INTEGER DEFAULT 0,
    bed_occupancy_rate DECIMAL(5,2),
    average_length_of_stay DECIMAL(5,2),
    
    -- Financial Metrics
    total_revenue DECIMAL(15,2) DEFAULT 0,
    cash_revenue DECIMAL(15,2) DEFAULT 0,
    insurance_revenue DECIMAL(15,2) DEFAULT 0,
    outstanding_bills DECIMAL(15,2) DEFAULT 0,
    collections DECIMAL(15,2) DEFAULT 0,
    
    -- Inventory Metrics
    drugs_dispensed INTEGER DEFAULT 0,
    stock_outs INTEGER DEFAULT 0,
    expired_items INTEGER DEFAULT 0,
    inventory_value DECIMAL(15,2) DEFAULT 0,
    
    -- Staff Metrics
    staff_present INTEGER DEFAULT 0,
    staff_absent INTEGER DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    
    -- Service Metrics
    lab_tests_performed INTEGER DEFAULT 0,
    imaging_studies_performed INTEGER DEFAULT 0,
    surgeries_performed INTEGER DEFAULT 0,
    average_waiting_time_minutes INTEGER,
    patient_satisfaction_score DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_daily_metrics UNIQUE (metric_date, hospital_id)
);

-- Department performance
CREATE TABLE IF NOT EXISTS department_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(100) NOT NULL,
    metric_month INTEGER NOT NULL,
    metric_year INTEGER NOT NULL,
    hospital_id UUID REFERENCES hospitals(id),
    
    -- Activity Metrics
    patient_visits INTEGER DEFAULT 0,
    procedures_performed INTEGER DEFAULT 0,
    average_consultation_time INTEGER,
    
    -- Financial Metrics
    revenue_generated DECIMAL(15,2) DEFAULT 0,
    expenses DECIMAL(15,2) DEFAULT 0,
    profit_margin DECIMAL(5,2),
    
    -- Quality Metrics
    patient_satisfaction DECIMAL(3,2),
    clinical_outcomes_score DECIMAL(3,2),
    error_rate DECIMAL(5,2),
    
    -- Staff Metrics
    staff_utilization_rate DECIMAL(5,2),
    staff_satisfaction DECIMAL(3,2),
    training_hours INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_dept_performance UNIQUE (department_name, metric_month, metric_year, hospital_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- EMR Indexes
CREATE INDEX idx_patients_hospital ON patients(hospital_id);
CREATE INDEX idx_patients_number ON patients(patient_number);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_encounters_date ON encounters(encounter_date);
CREATE INDEX idx_encounters_hospital ON encounters(hospital_id);
CREATE INDEX idx_clinical_notes_encounter ON clinical_notes(encounter_id);

-- Billing Indexes
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_encounter ON bills(encounter_id);
CREATE INDEX idx_bills_date ON bills(bill_date);
CREATE INDEX idx_bills_status ON bills(payment_status);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Inventory Indexes
CREATE INDEX idx_inventory_items_hospital ON inventory_items(hospital_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_stock_transactions_item ON stock_transactions(item_id);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(transaction_date);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);

-- HR Indexes
CREATE INDEX idx_staff_hospital ON staff(hospital_id);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_work_schedules_staff ON work_schedules(staff_id);
CREATE INDEX idx_work_schedules_date ON work_schedules(schedule_date);
CREATE INDEX idx_attendance_staff ON attendance(staff_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_payroll_staff ON payroll(staff_id);
CREATE INDEX idx_payroll_period ON payroll(payroll_year, payroll_month);

-- Analytics Indexes
CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);
CREATE INDEX idx_daily_metrics_hospital ON daily_metrics(hospital_id);
CREATE INDEX idx_dept_performance_period ON department_performance(metric_year, metric_month);

-- ============================================
-- SAMPLE DATA FOR NIGERIAN CONTEXT
-- ============================================

-- Insert sample service prices
INSERT INTO service_prices (service_code, service_name, service_category, unit_price, nhis_price, hmo_price, effective_date, hospital_id)
SELECT 
    'CONS001', 'General Consultation', 'CONSULTATION', 5000, 3000, 3500, '2025-01-01', h.id
FROM hospitals h WHERE h.name = 'Lagos Central Hospital'
ON CONFLICT (service_code) DO NOTHING;

INSERT INTO service_prices (service_code, service_name, service_category, unit_price, nhis_price, hmo_price, effective_date, hospital_id)
SELECT 
    'LAB001', 'Complete Blood Count', 'LABORATORY', 3500, 2500, 2800, '2025-01-01', h.id
FROM hospitals h WHERE h.name = 'Lagos Central Hospital'
ON CONFLICT (service_code) DO NOTHING;

INSERT INTO service_prices (service_code, service_name, service_category, unit_price, nhis_price, hmo_price, effective_date, hospital_id)
SELECT 
    'XRAY001', 'Chest X-Ray', 'RADIOLOGY', 8000, 6000, 6500, '2025-01-01', h.id
FROM hospitals h WHERE h.name = 'Lagos Central Hospital'
ON CONFLICT (service_code) DO NOTHING;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

COMMENT ON TABLE patients IS 'Core patient demographic and medical information';
COMMENT ON TABLE encounters IS 'Patient visits and medical encounters';
COMMENT ON TABLE bills IS 'Patient bills and invoices';
COMMENT ON TABLE inventory_items IS 'Hospital inventory items including drugs and equipment';
COMMENT ON TABLE staff IS 'Hospital staff information';
COMMENT ON TABLE work_schedules IS 'Staff work schedules and rosters';
COMMENT ON TABLE daily_metrics IS 'Daily operational metrics for analytics';
