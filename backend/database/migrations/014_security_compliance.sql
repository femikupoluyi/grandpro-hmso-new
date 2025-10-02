-- Migration: Security & Compliance Implementation
-- Purpose: Implement HIPAA/GDPR compliance, RBAC, audit logging, and security measures
-- Date: 2025-01-02

-- ============================================================================
-- STEP 1: CREATE SECURITY SCHEMA AND TABLES
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS compliance;

-- ============================================================================
-- STEP 2: ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================

-- Create application roles
CREATE ROLE IF NOT EXISTS super_admin;
CREATE ROLE IF NOT EXISTS hospital_admin;
CREATE ROLE IF NOT EXISTS doctor;
CREATE ROLE IF NOT EXISTS nurse;
CREATE ROLE IF NOT EXISTS pharmacist;
CREATE ROLE IF NOT EXISTS billing_clerk;
CREATE ROLE IF NOT EXISTS patient;
CREATE ROLE IF NOT EXISTS auditor;
CREATE ROLE IF NOT EXISTS data_analyst;

-- Create permissions table
CREATE TABLE IF NOT EXISTS security.permissions (
    permission_id SERIAL PRIMARY KEY,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Create role permissions mapping
CREATE TABLE IF NOT EXISTS security.role_permissions (
    role_permission_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    permission_id INT REFERENCES security.permissions(permission_id),
    granted_by VARCHAR(100),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_name, permission_id)
);

-- Create user roles mapping
CREATE TABLE IF NOT EXISTS security.user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    hospital_id VARCHAR(50),
    assigned_by VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_name, hospital_id)
);

-- ============================================================================
-- STEP 3: AUDIT LOGGING TABLES
-- ============================================================================

-- Comprehensive audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100),
    user_role VARCHAR(50),
    client_ip INET,
    user_agent TEXT,
    event_type VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, VIEW, CREATE, UPDATE, DELETE, EXPORT
    resource_type VARCHAR(100),      -- PATIENT_RECORD, PRESCRIPTION, BILLING, etc.
    resource_id VARCHAR(100),
    action VARCHAR(100),
    status VARCHAR(20),               -- SUCCESS, FAILED, BLOCKED
    error_message TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    session_id VARCHAR(100)
);

-- Create indexes for audit log queries
CREATE INDEX idx_audit_log_timestamp ON audit.audit_log(event_timestamp DESC);
CREATE INDEX idx_audit_log_user ON audit.audit_log(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_log_resource ON audit.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_event_type ON audit.audit_log(event_type);

-- Data access audit for HIPAA compliance
CREATE TABLE IF NOT EXISTS audit.data_access_log (
    access_id BIGSERIAL PRIMARY KEY,
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    patient_id VARCHAR(100),
    data_category VARCHAR(50), -- MEDICAL_RECORD, LAB_RESULT, PRESCRIPTION, BILLING
    access_type VARCHAR(20),   -- VIEW, DOWNLOAD, PRINT, SHARE
    purpose VARCHAR(100),      -- TREATMENT, PAYMENT, OPERATIONS, EMERGENCY
    legal_basis VARCHAR(100),  -- CONSENT, LEGITIMATE_INTEREST, VITAL_INTEREST
    ip_address INET,
    device_id VARCHAR(100),
    location VARCHAR(100),
    access_granted BOOLEAN,
    denial_reason TEXT
);

CREATE INDEX idx_data_access_patient ON audit.data_access_log(patient_id, accessed_at DESC);
CREATE INDEX idx_data_access_user ON audit.data_access_log(user_id, accessed_at DESC);

-- ============================================================================
-- STEP 4: ENCRYPTION KEY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS security.encryption_keys (
    key_id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_type VARCHAR(50) NOT NULL, -- MASTER, DATA, FIELD
    algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    key_version INT DEFAULT 1,
    encrypted_key BYTEA NOT NULL,  -- Key encrypted with master key
    key_metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- ============================================================================
-- STEP 5: DATA PRIVACY AND CONSENT MANAGEMENT (GDPR)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance.patient_consent (
    consent_id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    consent_type VARCHAR(50) NOT NULL, -- DATA_PROCESSING, MARKETING, RESEARCH, THIRD_PARTY_SHARING
    consent_status VARCHAR(20) NOT NULL, -- GRANTED, WITHDRAWN, EXPIRED
    consent_date TIMESTAMP NOT NULL,
    withdrawal_date TIMESTAMP,
    expiry_date TIMESTAMP,
    purpose TEXT,
    data_categories JSONB,
    third_parties JSONB,
    consent_method VARCHAR(50), -- WRITTEN, ELECTRONIC, VERBAL
    consent_version VARCHAR(20),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS compliance.data_retention_policies (
    policy_id SERIAL PRIMARY KEY,
    data_category VARCHAR(100) NOT NULL UNIQUE,
    retention_period_days INT NOT NULL,
    deletion_method VARCHAR(50), -- HARD_DELETE, SOFT_DELETE, ANONYMIZE
    legal_requirement TEXT,
    last_reviewed DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data subject requests (GDPR Article 15-22)
CREATE TABLE IF NOT EXISTS compliance.data_subject_requests (
    request_id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- ACCESS, RECTIFICATION, DELETION, PORTABILITY, RESTRICTION, OBJECTION
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- PENDING, IN_PROGRESS, COMPLETED, REJECTED
    response_date TIMESTAMP,
    response_method VARCHAR(50),
    notes TEXT,
    processed_by VARCHAR(100),
    verification_method VARCHAR(100),
    rejection_reason TEXT
);

-- ============================================================================
-- STEP 6: SECURITY POLICIES AND CONFIGURATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS security.security_policies (
    policy_id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) UNIQUE NOT NULL,
    policy_type VARCHAR(50) NOT NULL, -- PASSWORD, SESSION, ACCESS, ENCRYPTION
    policy_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default security policies
INSERT INTO security.security_policies (policy_name, policy_type, policy_value) VALUES
('password_policy', 'PASSWORD', '{
    "min_length": 12,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special": true,
    "max_age_days": 90,
    "history_count": 12,
    "max_attempts": 5,
    "lockout_duration_minutes": 30
}'::jsonb),
('session_policy', 'SESSION', '{
    "max_duration_minutes": 30,
    "idle_timeout_minutes": 15,
    "max_concurrent_sessions": 1,
    "require_2fa": true,
    "remember_me_days": 0
}'::jsonb),
('data_encryption', 'ENCRYPTION', '{
    "algorithm": "AES-256-GCM",
    "key_rotation_days": 90,
    "encrypt_at_rest": true,
    "encrypt_in_transit": true,
    "tls_version": "1.3",
    "pii_fields": ["ssn", "credit_card", "bank_account", "passport"]
}'::jsonb),
('audit_retention', 'AUDIT', '{
    "retention_days": 2555,
    "compress_after_days": 90,
    "archive_after_days": 365,
    "include_read_operations": true
}'::jsonb)
ON CONFLICT (policy_name) DO NOTHING;

-- ============================================================================
-- STEP 7: SENSITIVE DATA CLASSIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS security.data_classification (
    classification_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    sensitivity_level VARCHAR(20) NOT NULL, -- PUBLIC, INTERNAL, CONFIDENTIAL, HIGHLY_CONFIDENTIAL
    data_type VARCHAR(50), -- PII, PHI, FINANCIAL, OPERATIONAL
    encryption_required BOOLEAN DEFAULT FALSE,
    masking_required BOOLEAN DEFAULT FALSE,
    audit_required BOOLEAN DEFAULT FALSE,
    UNIQUE(table_name, column_name)
);

-- Classify sensitive columns
INSERT INTO security.data_classification (table_name, column_name, sensitivity_level, data_type, encryption_required, masking_required, audit_required) VALUES
('patients', 'social_security_number', 'HIGHLY_CONFIDENTIAL', 'PII', true, true, true),
('patients', 'date_of_birth', 'CONFIDENTIAL', 'PII', true, true, true),
('patients', 'medical_record_number', 'HIGHLY_CONFIDENTIAL', 'PHI', true, true, true),
('patient_visits', 'diagnosis', 'HIGHLY_CONFIDENTIAL', 'PHI', true, false, true),
('prescriptions', 'medication_details', 'CONFIDENTIAL', 'PHI', true, false, true),
('insurance_claims', 'claim_details', 'CONFIDENTIAL', 'FINANCIAL', true, false, true),
('billing', 'payment_details', 'HIGHLY_CONFIDENTIAL', 'FINANCIAL', true, true, true)
ON CONFLICT (table_name, column_name) DO NOTHING;

-- ============================================================================
-- STEP 8: BACKUP AND DISASTER RECOVERY CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS security.backup_configuration (
    config_id SERIAL PRIMARY KEY,
    backup_name VARCHAR(100) UNIQUE NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- FULL, INCREMENTAL, DIFFERENTIAL
    schedule_cron VARCHAR(100),
    retention_days INT,
    encryption_enabled BOOLEAN DEFAULT TRUE,
    compression_enabled BOOLEAN DEFAULT TRUE,
    storage_location VARCHAR(255),
    last_backup_at TIMESTAMP,
    next_backup_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.backup_history (
    backup_id BIGSERIAL PRIMARY KEY,
    backup_name VARCHAR(100),
    backup_type VARCHAR(50),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20), -- RUNNING, COMPLETED, FAILED
    size_bytes BIGINT,
    duration_seconds INT,
    error_message TEXT,
    file_path VARCHAR(500),
    checksum VARCHAR(64),
    metadata JSONB
);

-- ============================================================================
-- STEP 9: SECURITY INCIDENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS security.security_incidents (
    incident_id SERIAL PRIMARY KEY,
    incident_type VARCHAR(50) NOT NULL, -- UNAUTHORIZED_ACCESS, DATA_BREACH, MALWARE, PHISHING, SYSTEM_COMPROMISE
    severity VARCHAR(20) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reported_by VARCHAR(100),
    affected_systems JSONB,
    affected_users JSONB,
    affected_data JSONB,
    description TEXT,
    investigation_status VARCHAR(50), -- DETECTED, INVESTIGATING, CONTAINED, RESOLVED
    resolution TEXT,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    lessons_learned TEXT,
    reported_to_authorities BOOLEAN DEFAULT FALSE,
    authority_reference VARCHAR(100)
);

-- ============================================================================
-- STEP 10: CREATE ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for doctors (can see their patients)
CREATE POLICY doctor_patient_access ON patients
    FOR ALL
    TO doctor
    USING (
        patient_id IN (
            SELECT DISTINCT patient_id 
            FROM patient_visits 
            WHERE doctor_id = current_user
        )
    );

-- Create RLS policies for patients (can see only their own data)
CREATE POLICY patient_own_data ON patients
    FOR SELECT
    TO patient
    USING (user_id = current_user);

-- ============================================================================
-- STEP 11: CREATE SECURITY FUNCTIONS
-- ============================================================================

-- Function to log data access
CREATE OR REPLACE FUNCTION audit.log_data_access(
    p_user_id VARCHAR(100),
    p_patient_id VARCHAR(100),
    p_data_category VARCHAR(50),
    p_access_type VARCHAR(20),
    p_purpose VARCHAR(100)
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit.data_access_log (
        user_id, patient_id, data_category, 
        access_type, purpose, access_granted
    ) VALUES (
        p_user_id, p_patient_id, p_data_category,
        p_access_type, p_purpose, TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION security.encrypt_sensitive_data(
    p_data TEXT,
    p_key_name VARCHAR(100)
) RETURNS TEXT AS $$
DECLARE
    v_encrypted TEXT;
BEGIN
    -- In production, use pgcrypto extension
    -- For now, return a mock encrypted value
    v_encrypted := 'ENC:' || encode(digest(p_data, 'sha256'), 'hex');
    RETURN v_encrypted;
END;
$$ LANGUAGE plpgsql;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION security.check_permission(
    p_user_id VARCHAR(100),
    p_resource VARCHAR(100),
    p_action VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM security.user_roles ur
        JOIN security.role_permissions rp ON ur.role_name = rp.role_name
        JOIN security.permissions p ON rp.permission_id = p.permission_id
        WHERE ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND (ur.valid_to IS NULL OR ur.valid_to > CURRENT_TIMESTAMP)
        AND p.resource = p_resource
        AND p.action = p_action
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 12: CREATE AUDIT TRIGGERS
-- ============================================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            user_id, event_type, resource_type, 
            resource_id, action, status, new_values
        ) VALUES (
            current_user, 'CREATE', TG_TABLE_NAME,
            NEW.id::text, TG_OP, 'SUCCESS', to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            user_id, event_type, resource_type,
            resource_id, action, status, old_values, new_values
        ) VALUES (
            current_user, 'UPDATE', TG_TABLE_NAME,
            NEW.id::text, TG_OP, 'SUCCESS', to_jsonb(OLD), to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            user_id, event_type, resource_type,
            resource_id, action, status, old_values
        ) VALUES (
            current_user, 'DELETE', TG_TABLE_NAME,
            OLD.id::text, TG_OP, 'SUCCESS', to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 13: DEFAULT PERMISSIONS AND ROLES
-- ============================================================================

-- Insert default permissions
INSERT INTO security.permissions (resource, action, description) VALUES
('patients', 'VIEW', 'View patient records'),
('patients', 'CREATE', 'Create new patient records'),
('patients', 'UPDATE', 'Update patient records'),
('patients', 'DELETE', 'Delete patient records'),
('prescriptions', 'VIEW', 'View prescriptions'),
('prescriptions', 'CREATE', 'Create prescriptions'),
('prescriptions', 'APPROVE', 'Approve prescriptions'),
('billing', 'VIEW', 'View billing information'),
('billing', 'CREATE', 'Create bills'),
('billing', 'PROCESS', 'Process payments'),
('reports', 'VIEW', 'View reports'),
('reports', 'CREATE', 'Create reports'),
('reports', 'EXPORT', 'Export reports'),
('admin', 'MANAGE_USERS', 'Manage user accounts'),
('admin', 'MANAGE_ROLES', 'Manage roles and permissions'),
('admin', 'VIEW_AUDIT', 'View audit logs'),
('admin', 'SYSTEM_CONFIG', 'Configure system settings')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign permissions to roles
INSERT INTO security.role_permissions (role_name, permission_id)
SELECT 'super_admin', permission_id FROM security.permissions
ON CONFLICT DO NOTHING;

INSERT INTO security.role_permissions (role_name, permission_id)
SELECT 'doctor', permission_id 
FROM security.permissions 
WHERE resource IN ('patients', 'prescriptions') 
AND action IN ('VIEW', 'CREATE', 'UPDATE')
ON CONFLICT DO NOTHING;

INSERT INTO security.role_permissions (role_name, permission_id)
SELECT 'nurse', permission_id 
FROM security.permissions 
WHERE resource = 'patients' AND action IN ('VIEW', 'UPDATE')
ON CONFLICT DO NOTHING;

INSERT INTO security.role_permissions (role_name, permission_id)
SELECT 'billing_clerk', permission_id 
FROM security.permissions 
WHERE resource = 'billing'
ON CONFLICT DO NOTHING;

INSERT INTO security.role_permissions (role_name, permission_id)
SELECT 'patient', permission_id 
FROM security.permissions 
WHERE resource = 'patients' AND action = 'VIEW'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 14: DATA RETENTION POLICIES
-- ============================================================================

INSERT INTO compliance.data_retention_policies (data_category, retention_period_days, deletion_method, legal_requirement) VALUES
('medical_records', 2555, 'SOFT_DELETE', 'HIPAA requires 6 years minimum, Nigerian law requires 7 years'),
('billing_records', 2555, 'SOFT_DELETE', 'HIPAA requires 6 years for billing records'),
('audit_logs', 2555, 'ARCHIVE', 'HIPAA requires audit logs for 6 years minimum'),
('consent_records', 3650, 'SOFT_DELETE', 'GDPR requires consent records for duration of processing plus audit period'),
('employee_records', 2555, 'SOFT_DELETE', 'Employment law requires 7 years retention'),
('email_communications', 365, 'HARD_DELETE', 'Business communications retained for 1 year'),
('temporary_data', 30, 'HARD_DELETE', 'Temporary processing data deleted after 30 days'),
('backup_data', 365, 'HARD_DELETE', 'Backup retention for 1 year')
ON CONFLICT (data_category) DO NOTHING;

-- ============================================================================
-- STEP 15: CREATE COMPLIANCE VIEWS
-- ============================================================================

-- View for HIPAA compliance reporting
CREATE OR REPLACE VIEW compliance.hipaa_audit_summary AS
SELECT 
    DATE(event_timestamp) as audit_date,
    event_type,
    resource_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_attempts
FROM audit.audit_log
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(event_timestamp), event_type, resource_type;

-- View for GDPR data subject rights
CREATE OR REPLACE VIEW compliance.gdpr_subject_rights AS
SELECT 
    dsr.patient_id,
    dsr.request_type,
    dsr.request_date,
    dsr.status,
    dsr.response_date,
    pc.consent_status,
    pc.consent_date
FROM compliance.data_subject_requests dsr
LEFT JOIN compliance.patient_consent pc ON dsr.patient_id = pc.patient_id
WHERE dsr.request_date >= CURRENT_DATE - INTERVAL '90 days';

-- ============================================================================
-- GRANT PERMISSIONS TO SCHEMAS
-- ============================================================================

-- Grant usage on schemas to roles
GRANT USAGE ON SCHEMA security TO super_admin, auditor;
GRANT USAGE ON SCHEMA audit TO super_admin, auditor;
GRANT USAGE ON SCHEMA compliance TO super_admin, auditor, data_analyst;

-- Grant select on audit tables to auditor role
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA compliance TO auditor;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
