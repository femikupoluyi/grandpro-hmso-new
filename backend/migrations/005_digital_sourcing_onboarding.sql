-- Digital Sourcing & Partner Onboarding Module Schema
-- Date: October 2025
-- Description: Tables for hospital owner registration, applications, scoring, contracts, and onboarding

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS onboarding_status_history CASCADE;
DROP TABLE IF EXISTS digital_signatures CASCADE;
DROP TABLE IF EXISTS contract_templates CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS evaluation_scores CASCADE;
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS onboarding_applications CASCADE;
DROP TABLE IF EXISTS document_types CASCADE;
DROP TABLE IF EXISTS evaluation_criteria CASCADE;

-- Evaluation Criteria Table
CREATE TABLE evaluation_criteria (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    criterion VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 1.0,
    max_score INTEGER DEFAULT 100,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Types Table
CREATE TABLE document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    max_file_size_mb INTEGER DEFAULT 10,
    allowed_formats VARCHAR(255) DEFAULT 'pdf,jpg,png,doc,docx',
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Applications Table
CREATE TABLE onboarding_applications (
    id SERIAL PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(100),
    bed_capacity INTEGER,
    
    -- Owner Information
    owner_first_name VARCHAR(100) NOT NULL,
    owner_last_name VARCHAR(100) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    owner_nin VARCHAR(20), -- Nigerian National ID
    
    -- Hospital Details
    hospital_address TEXT NOT NULL,
    hospital_city VARCHAR(100) NOT NULL,
    hospital_state VARCHAR(50) NOT NULL,
    hospital_lga VARCHAR(100), -- Local Government Area
    postal_code VARCHAR(10),
    
    -- Registration Details
    cac_registration_number VARCHAR(50), -- Corporate Affairs Commission
    tax_identification_number VARCHAR(50),
    nhis_number VARCHAR(50), -- National Health Insurance Scheme
    
    -- Additional Information
    years_in_operation INTEGER,
    number_of_staff INTEGER,
    specialties TEXT[],
    has_emergency_unit BOOLEAN DEFAULT FALSE,
    has_laboratory BOOLEAN DEFAULT FALSE,
    has_pharmacy BOOLEAN DEFAULT FALSE,
    has_radiology BOOLEAN DEFAULT FALSE,
    
    -- Application Status
    status VARCHAR(50) DEFAULT 'draft',
    submission_date TIMESTAMP,
    review_date TIMESTAMP,
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    
    -- Scoring
    total_score DECIMAL(5,2) DEFAULT 0,
    score_percentile DECIMAL(5,2) DEFAULT 0,
    risk_rating VARCHAR(20), -- low, medium, high
    
    -- User tracking
    created_by INTEGER,
    reviewed_by INTEGER,
    approved_by INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'under_review', 'scoring', 'approved', 'rejected', 'on_hold', 'withdrawn'))
);

-- Application Documents Table
CREATE TABLE application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES onboarding_applications(id) ON DELETE CASCADE,
    document_type_id INTEGER REFERENCES document_types(id),
    document_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER,
    verified_date TIMESTAMP,
    verification_notes TEXT,
    
    -- Security
    checksum VARCHAR(64), -- SHA256 hash
    encrypted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evaluation Scores Table
CREATE TABLE evaluation_scores (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES onboarding_applications(id) ON DELETE CASCADE,
    criteria_id INTEGER REFERENCES evaluation_criteria(id),
    
    score DECIMAL(5,2) NOT NULL,
    max_possible_score DECIMAL(5,2) NOT NULL,
    weighted_score DECIMAL(5,2),
    
    -- Evaluation details
    evaluator_notes TEXT,
    evidence_documents TEXT[],
    
    -- Auto vs Manual
    is_automated BOOLEAN DEFAULT FALSE,
    evaluation_method VARCHAR(50), -- automated, manual, hybrid
    
    evaluated_by INTEGER,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(application_id, criteria_id)
);

-- Contract Templates Table
CREATE TABLE contract_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- standard, premium, custom
    
    -- Template content
    template_body TEXT NOT NULL,
    template_variables JSONB, -- Dynamic fields to be filled
    
    -- Terms
    commission_rate DECIMAL(5,2),
    contract_duration_months INTEGER,
    payment_terms VARCHAR(255),
    termination_clauses TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiry_date DATE,
    
    created_by INTEGER,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    application_id INTEGER REFERENCES onboarding_applications(id),
    template_id INTEGER REFERENCES contract_templates(id),
    
    -- Parties
    hospital_id INTEGER,
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    
    -- Contract Details
    contract_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renewal BOOLEAN DEFAULT FALSE,
    
    -- Financial Terms
    commission_rate DECIMAL(5,2),
    minimum_monthly_revenue DECIMAL(15,2),
    payment_schedule VARCHAR(50), -- monthly, quarterly
    bank_account_details JSONB,
    
    -- Contract Content
    final_contract_body TEXT,
    special_terms TEXT[],
    amendments JSONB[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    sent_for_signature_date TIMESTAMP,
    signed_date TIMESTAMP,
    effective_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Digital Signature Reference
    signature_request_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_contract_status CHECK (status IN ('draft', 'pending_signature', 'signed', 'active', 'expired', 'terminated', 'renewed'))
);

-- Digital Signatures Table
CREATE TABLE digital_signatures (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    
    -- Signature Details
    signatory_name VARCHAR(255) NOT NULL,
    signatory_email VARCHAR(255) NOT NULL,
    signatory_role VARCHAR(100), -- owner, witness, legal_rep
    
    -- Signature Data
    signature_data TEXT, -- Base64 encoded signature image
    signature_hash VARCHAR(64), -- SHA256 hash
    signature_timestamp TIMESTAMP,
    
    -- Verification
    ip_address VARCHAR(45),
    user_agent TEXT,
    location_data JSONB,
    
    -- External Service (if using DocuSign, HelloSign, etc.)
    external_service VARCHAR(50),
    external_signature_id VARCHAR(255),
    external_status VARCHAR(50),
    
    -- Certificate
    certificate_serial VARCHAR(100),
    certificate_issuer VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(contract_id, signatory_email)
);

-- Onboarding Status History Table
CREATE TABLE onboarding_status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES onboarding_applications(id) ON DELETE CASCADE,
    
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    
    changed_by INTEGER,
    change_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_applications_status ON onboarding_applications(status);
CREATE INDEX idx_applications_email ON onboarding_applications(owner_email);
CREATE INDEX idx_applications_submission_date ON onboarding_applications(submission_date);
CREATE INDEX idx_applications_hospital_name ON onboarding_applications(hospital_name);
CREATE INDEX idx_documents_application ON application_documents(application_id);
CREATE INDEX idx_scores_application ON evaluation_scores(application_id);
CREATE INDEX idx_contracts_application ON contracts(application_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_signatures_contract ON digital_signatures(contract_id);

-- Insert default evaluation criteria
INSERT INTO evaluation_criteria (category, criterion, description, weight, max_score, is_mandatory) VALUES
('Infrastructure', 'Bed Capacity', 'Number of available beds', 2.0, 100, TRUE),
('Infrastructure', 'Emergency Unit', 'Presence of 24/7 emergency services', 1.5, 100, TRUE),
('Infrastructure', 'Medical Equipment', 'Quality and availability of medical equipment', 1.5, 100, TRUE),
('Compliance', 'CAC Registration', 'Valid Corporate Affairs Commission registration', 3.0, 100, TRUE),
('Compliance', 'NHIS Certification', 'National Health Insurance Scheme certification', 2.0, 100, TRUE),
('Compliance', 'Tax Compliance', 'Up-to-date tax payments and TIN', 2.0, 100, TRUE),
('Experience', 'Years in Operation', 'Number of years hospital has been operational', 1.0, 100, FALSE),
('Experience', 'Staff Strength', 'Number of qualified medical staff', 1.5, 100, TRUE),
('Financial', 'Revenue History', 'Historical revenue and financial stability', 2.0, 100, FALSE),
('Financial', 'Insurance Coverage', 'Malpractice and liability insurance', 1.5, 100, TRUE),
('Quality', 'Patient Satisfaction', 'Historical patient satisfaction scores', 1.0, 100, FALSE),
('Quality', 'Clinical Outcomes', 'Track record of clinical outcomes', 1.5, 100, FALSE),
('Location', 'Accessibility', 'Easy access via major roads/transport', 1.0, 100, FALSE),
('Location', 'Service Area Coverage', 'Population served in catchment area', 1.0, 100, FALSE);

-- Insert default document types
INSERT INTO document_types (name, description, is_required, category) VALUES
('CAC Certificate', 'Corporate Affairs Commission registration certificate', TRUE, 'legal'),
('Tax Clearance Certificate', 'Valid tax clearance certificate', TRUE, 'financial'),
('NHIS Certificate', 'National Health Insurance Scheme certificate', TRUE, 'compliance'),
('Medical Practice License', 'Valid medical practice license', TRUE, 'compliance'),
('Facility Photos', 'Recent photographs of hospital facilities', TRUE, 'infrastructure'),
('Equipment List', 'Detailed list of medical equipment', TRUE, 'infrastructure'),
('Staff List', 'List of medical staff with qualifications', TRUE, 'operational'),
('Financial Statements', 'Last 2 years audited financial statements', FALSE, 'financial'),
('Insurance Certificate', 'Professional liability insurance certificate', TRUE, 'compliance'),
('Fire Safety Certificate', 'Valid fire safety certificate', TRUE, 'compliance'),
('Environmental Impact Assessment', 'EIA certificate where applicable', FALSE, 'compliance'),
('Waste Management Plan', 'Medical waste disposal plan and permits', TRUE, 'operational');

-- Insert sample contract template
INSERT INTO contract_templates (name, version, template_type, template_body, commission_rate, contract_duration_months, payment_terms) VALUES
('Standard Hospital Partnership Agreement', '1.0', 'standard', 
'This Hospital Partnership Agreement ("Agreement") is entered into as of {{contract_date}} between GrandPro HMSO ("Company") and {{hospital_name}} ("Partner")...

TERMS AND CONDITIONS:
1. Partnership Duration: {{duration_months}} months
2. Commission Rate: {{commission_rate}}% of gross revenue
3. Payment Terms: {{payment_terms}}
4. Service Standards: Partner agrees to maintain quality standards...
5. Reporting: Monthly operational and financial reports required...

NIGERIAN REGULATORY COMPLIANCE:
Partner certifies compliance with all Nigerian healthcare regulations including NHIS requirements...

SIGNATURES:
Company Representative: _______________________
Partner Representative: _______________________
Date: {{signature_date}}', 
10.0, 24, 'Net 30 days from monthly invoice');

-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'APP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(NEXTVAL('onboarding_applications_id_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total score
CREATE OR REPLACE FUNCTION calculate_application_score(app_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    total_weighted_score DECIMAL;
    max_weighted_score DECIMAL;
    final_score DECIMAL;
BEGIN
    SELECT 
        SUM(weighted_score),
        SUM(ec.weight * ec.max_score)
    INTO total_weighted_score, max_weighted_score
    FROM evaluation_scores es
    JOIN evaluation_criteria ec ON es.criteria_id = ec.id
    WHERE es.application_id = app_id;
    
    IF max_weighted_score > 0 THEN
        final_score := (total_weighted_score / max_weighted_score) * 100;
    ELSE
        final_score := 0;
    END IF;
    
    -- Update application with calculated score
    UPDATE onboarding_applications 
    SET total_score = final_score,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = app_id;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;
