-- CRM Module Database Schema for GrandPro HMSO
-- Nigerian Context with proper data types and relationships

-- ============================================
-- OWNER CRM TABLES
-- ============================================

-- Owner Communications Log
CREATE TABLE IF NOT EXISTS owner_communications (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES HospitalOwner(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_PERSON', 'LETTER')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'FAILED', 'READ', 'PENDING')),
    sent_by INTEGER REFERENCES User(id),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owner Payouts
CREATE TABLE IF NOT EXISTS owner_payouts (
    id SERIAL PRIMARY KEY,
    payout_number VARCHAR(50) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES HospitalOwner(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES Contract(id),
    payout_period VARCHAR(20) NOT NULL, -- Format: YYYY-MM
    amount_naira DECIMAL(15, 2) NOT NULL,
    revenue_share_amount DECIMAL(15, 2),
    fixed_fee_amount DECIMAL(15, 2),
    deductions DECIMAL(15, 2) DEFAULT 0,
    net_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('BANK_TRANSFER', 'CHEQUE', 'CASH')),
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    account_name VARCHAR(255),
    transaction_reference VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    scheduled_date DATE,
    paid_date DATE,
    notes TEXT,
    created_by INTEGER REFERENCES User(id),
    approved_by INTEGER REFERENCES User(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owner Satisfaction Surveys
CREATE TABLE IF NOT EXISTS owner_satisfaction (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES HospitalOwner(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    survey_type VARCHAR(50) DEFAULT 'QUARTERLY',
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    support_rating INTEGER CHECK (support_rating >= 1 AND support_rating <= 5),
    payment_rating INTEGER CHECK (payment_rating >= 1 AND payment_rating <= 5),
    feedback TEXT,
    improvements_suggested TEXT,
    survey_date DATE DEFAULT CURRENT_DATE,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PATIENT CRM TABLES
-- ============================================

-- Enhanced Patient Table
CREATE TABLE IF NOT EXISTS patient_profiles (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    nin VARCHAR(11), -- Nigerian National Identification Number
    blood_group VARCHAR(10),
    genotype VARCHAR(10),
    allergies TEXT[],
    chronic_conditions TEXT[],
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    preferred_language VARCHAR(50) DEFAULT 'English',
    communication_preferences JSONB DEFAULT '{"sms": true, "email": true, "whatsapp": true}'::jsonb,
    insurance_provider VARCHAR(255),
    insurance_number VARCHAR(100),
    hmo_provider VARCHAR(255),
    hmo_number VARCHAR(100),
    nhis_number VARCHAR(100), -- National Health Insurance Scheme
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Communications
CREATE TABLE IF NOT EXISTS patient_communications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION')),
    category VARCHAR(50) CHECK (category IN ('APPOINTMENT_REMINDER', 'MEDICATION_REMINDER', 'HEALTH_TIP', 'PROMOTION', 'SURVEY', 'RESULT_READY', 'GENERAL')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Appointments with Reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES Appointment(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) CHECK (reminder_type IN ('24_HOUR', '3_HOUR', '1_HOUR', 'CUSTOM')),
    communication_channel VARCHAR(50) CHECK (communication_channel IN ('SMS', 'WHATSAPP', 'EMAIL', 'ALL')),
    scheduled_time TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')),
    response TEXT, -- Patient's response if any
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Feedback
CREATE TABLE IF NOT EXISTS patient_feedback (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES Appointment(id),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('SERVICE', 'FACILITY', 'STAFF', 'GENERAL', 'COMPLAINT')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    doctor_rating INTEGER CHECK (doctor_rating >= 1 AND doctor_rating <= 5),
    nurse_rating INTEGER CHECK (nurse_rating >= 1 AND nurse_rating <= 5),
    facility_rating INTEGER CHECK (facility_rating >= 1 AND facility_rating <= 5),
    waiting_time_rating INTEGER CHECK (waiting_time_rating >= 1 AND waiting_time_rating <= 5),
    feedback_text TEXT,
    improvement_suggestions TEXT,
    would_recommend BOOLEAN,
    anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACKNOWLEDGED', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
    response_text TEXT,
    responded_by INTEGER REFERENCES User(id),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Program
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'BRONZE' CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
    tier_expiry_date DATE,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED')),
    points INTEGER NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- APPOINTMENT, PAYMENT, REFERRAL, etc.
    reference_id INTEGER,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Rewards
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    reward_name VARCHAR(255) NOT NULL,
    reward_type VARCHAR(50) CHECK (reward_type IN ('DISCOUNT', 'FREE_SERVICE', 'PRIORITY_ACCESS', 'GIFT')),
    points_required INTEGER NOT NULL,
    discount_percentage DECIMAL(5, 2),
    description TEXT,
    terms_conditions TEXT,
    valid_from DATE,
    valid_until DATE,
    max_redemptions_per_patient INTEGER DEFAULT 1,
    total_available INTEGER,
    total_redeemed INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    redemption_code VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'USED', 'EXPIRED', 'CANCELLED')),
    approved_by INTEGER REFERENCES User(id),
    used_at TIMESTAMP,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COMMUNICATION CAMPAIGN TABLES
-- ============================================

-- Campaign Management
CREATE TABLE IF NOT EXISTS communication_campaigns (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES Hospital(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) CHECK (campaign_type IN ('HEALTH_PROMOTION', 'APPOINTMENT_REMINDER', 'FOLLOW_UP', 'MARKETING', 'SURVEY')),
    target_audience VARCHAR(50) CHECK (target_audience IN ('ALL_PATIENTS', 'ACTIVE_PATIENTS', 'INACTIVE_PATIENTS', 'SPECIFIC_CONDITION', 'CUSTOM')),
    audience_criteria JSONB, -- Stores filtering criteria
    message_template TEXT NOT NULL,
    channels VARCHAR(50)[] DEFAULT ARRAY['SMS'], -- Can be multiple channels
    scheduled_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES User(id),
    approved_by INTEGER REFERENCES User(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES communication_campaigns(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES Patient(id) ON DELETE CASCADE,
    communication_id INTEGER REFERENCES patient_communications(id),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'OPTED_OUT')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_owner_communications_owner_id ON owner_communications(owner_id);
CREATE INDEX idx_owner_communications_hospital_id ON owner_communications(hospital_id);
CREATE INDEX idx_owner_communications_sent_at ON owner_communications(sent_at);

CREATE INDEX idx_owner_payouts_owner_id ON owner_payouts(owner_id);
CREATE INDEX idx_owner_payouts_hospital_id ON owner_payouts(hospital_id);
CREATE INDEX idx_owner_payouts_payout_period ON owner_payouts(payout_period);
CREATE INDEX idx_owner_payouts_status ON owner_payouts(status);

CREATE INDEX idx_patient_profiles_patient_id ON patient_profiles(patient_id);
CREATE INDEX idx_patient_profiles_hospital_id ON patient_profiles(hospital_id);
CREATE INDEX idx_patient_profiles_registration_number ON patient_profiles(registration_number);

CREATE INDEX idx_patient_communications_patient_id ON patient_communications(patient_id);
CREATE INDEX idx_patient_communications_scheduled_at ON patient_communications(scheduled_at);
CREATE INDEX idx_patient_communications_status ON patient_communications(status);

CREATE INDEX idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled_time ON appointment_reminders(scheduled_time);

CREATE INDEX idx_patient_feedback_patient_id ON patient_feedback(patient_id);
CREATE INDEX idx_patient_feedback_hospital_id ON patient_feedback(hospital_id);
CREATE INDEX idx_patient_feedback_status ON patient_feedback(status);

CREATE INDEX idx_loyalty_points_patient_id ON loyalty_points(patient_id);
CREATE INDEX idx_loyalty_transactions_patient_id ON loyalty_transactions(patient_id);
CREATE INDEX idx_reward_redemptions_patient_id ON reward_redemptions(patient_id);

CREATE INDEX idx_campaigns_hospital_id ON communication_campaigns(hospital_id);
CREATE INDEX idx_campaigns_status ON communication_campaigns(status);
CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
