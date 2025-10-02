-- Security and Compliance Database Schema
-- HIPAA/GDPR Compliant Tables for Audit, Access Control, and Data Protection

-- =====================================================
-- AUDIT & COMPLIANCE TABLES
-- =====================================================

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    method VARCHAR(10),
    path VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    request_body TEXT,
    response_code INTEGER,
    duration_ms INTEGER,
    is_sensitive BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_action (action)
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
    event_id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- unauthorized_access, data_breach, etc.
    user_id VARCHAR(100),
    ip_address INET,
    path VARCHAR(500),
    details JSONB,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_security_type (event_type),
    INDEX idx_security_severity (severity),
    INDEX idx_security_timestamp (timestamp)
);

-- Access control permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    permission_id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    actions TEXT[], -- ['read', 'write', 'delete', 'update']
    conditions JSONB, -- Additional conditions for access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_resource (role, resource)
);

-- User sessions for tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    terminated_reason VARCHAR(100),
    INDEX idx_session_user (user_id),
    INDEX idx_session_expires (expires_at)
);

-- Data access logs for HIPAA compliance
CREATE TABLE IF NOT EXISTS data_access_logs (
    access_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    patient_id UUID,
    record_type VARCHAR(100), -- 'medical_record', 'billing', 'prescription', etc.
    record_id VARCHAR(100),
    action VARCHAR(50), -- 'view', 'update', 'export', 'print'
    reason TEXT,
    accessed_fields TEXT[],
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_access_patient (patient_id),
    INDEX idx_access_user (user_id),
    INDEX idx_access_timestamp (timestamp)
);

-- Consent management for GDPR
CREATE TABLE IF NOT EXISTS patient_consents (
    consent_id SERIAL PRIMARY KEY,
    patient_id UUID NOT NULL,
    consent_type VARCHAR(100), -- 'data_processing', 'marketing', 'research'
    granted BOOLEAN DEFAULT FALSE,
    granted_date TIMESTAMP,
    revoked_date TIMESTAMP,
    expiry_date TIMESTAMP,
    purpose TEXT,
    data_categories TEXT[],
    third_parties TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consent_patient (patient_id),
    INDEX idx_consent_type (consent_type)
);

-- =====================================================
-- DATA PROTECTION TABLES
-- =====================================================

-- Encrypted data storage
CREATE TABLE IF NOT EXISTS encrypted_data (
    data_id SERIAL PRIMARY KEY,
    reference_type VARCHAR(100), -- 'patient', 'billing', 'medical_record'
    reference_id VARCHAR(100),
    field_name VARCHAR(100),
    encrypted_value TEXT,
    encryption_key_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_encrypted_reference (reference_type, reference_id)
);

-- Encryption keys management
CREATE TABLE IF NOT EXISTS encryption_keys (
    key_id VARCHAR(100) PRIMARY KEY,
    key_name VARCHAR(255),
    key_type VARCHAR(50), -- 'AES-256', 'RSA-2048'
    key_status VARCHAR(20) DEFAULT 'active', -- 'active', 'rotated', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by VARCHAR(100)
);

-- Data breach records
CREATE TABLE IF NOT EXISTS data_breaches (
    breach_id SERIAL PRIMARY KEY,
    discovered_date TIMESTAMP NOT NULL,
    breach_date TIMESTAMP,
    breach_type VARCHAR(100), -- 'unauthorized_access', 'data_theft', 'accidental_disclosure'
    affected_records INTEGER,
    affected_patients TEXT[],
    description TEXT,
    containment_actions TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_date TIMESTAMP,
    reported_to_authorities BOOLEAN DEFAULT FALSE,
    report_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'investigating', -- 'investigating', 'contained', 'resolved'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BACKUP & RECOVERY TABLES
-- =====================================================

-- Backup history
CREATE TABLE IF NOT EXISTS backup_history (
    backup_id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50), -- 'full', 'incremental', 'differential'
    backup_location VARCHAR(500),
    backup_size_bytes BIGINT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50), -- 'running', 'completed', 'failed'
    error_message TEXT,
    retention_days INTEGER DEFAULT 30,
    created_by VARCHAR(100),
    INDEX idx_backup_status (status),
    INDEX idx_backup_completed (completed_at)
);

-- Recovery operations
CREATE TABLE IF NOT EXISTS recovery_operations (
    recovery_id SERIAL PRIMARY KEY,
    backup_id INTEGER REFERENCES backup_history(backup_id),
    recovery_type VARCHAR(50), -- 'full', 'point_in_time', 'selective'
    target_timestamp TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50), -- 'running', 'completed', 'failed'
    recovered_records INTEGER,
    error_message TEXT,
    performed_by VARCHAR(100)
);

-- =====================================================
-- COMPLIANCE TRACKING TABLES
-- =====================================================

-- HIPAA compliance checklist
CREATE TABLE IF NOT EXISTS hipaa_compliance (
    requirement_id SERIAL PRIMARY KEY,
    category VARCHAR(100), -- 'Administrative', 'Physical', 'Technical'
    requirement TEXT NOT NULL,
    is_compliant BOOLEAN DEFAULT FALSE,
    evidence TEXT,
    last_reviewed TIMESTAMP,
    reviewed_by VARCHAR(100),
    next_review_date DATE,
    notes TEXT
);

-- GDPR compliance tracking
CREATE TABLE IF NOT EXISTS gdpr_compliance (
    requirement_id SERIAL PRIMARY KEY,
    article VARCHAR(50),
    requirement TEXT NOT NULL,
    is_compliant BOOLEAN DEFAULT FALSE,
    implementation_status VARCHAR(50), -- 'not_started', 'in_progress', 'completed'
    evidence TEXT,
    last_reviewed TIMESTAMP,
    reviewed_by VARCHAR(100),
    notes TEXT
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS retention_policies (
    policy_id SERIAL PRIMARY KEY,
    data_type VARCHAR(100), -- 'medical_records', 'billing', 'audit_logs'
    retention_period_days INTEGER NOT NULL,
    deletion_method VARCHAR(50), -- 'hard_delete', 'anonymize', 'archive'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECURITY CONFIGURATION TABLES
-- =====================================================

-- Password policies
CREATE TABLE IF NOT EXISTS password_policies (
    policy_id SERIAL PRIMARY KEY,
    min_length INTEGER DEFAULT 8,
    require_uppercase BOOLEAN DEFAULT TRUE,
    require_lowercase BOOLEAN DEFAULT TRUE,
    require_numbers BOOLEAN DEFAULT TRUE,
    require_special_chars BOOLEAN DEFAULT TRUE,
    max_age_days INTEGER DEFAULT 90,
    min_age_hours INTEGER DEFAULT 24,
    history_count INTEGER DEFAULT 5, -- Number of previous passwords to check
    max_failed_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Failed login attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    attempt_id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_failed_login_username (username),
    INDEX idx_failed_login_ip (ip_address),
    INDEX idx_failed_login_time (attempt_time)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_sensitive ON audit_logs(is_sensitive) WHERE is_sensitive = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_unresolved ON security_events(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_consents_active ON patient_consents(patient_id, consent_type) WHERE revoked_date IS NULL;

-- =====================================================
-- DEFAULT SECURITY CONFIGURATIONS
-- =====================================================

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, actions) VALUES
('ADMIN', 'all', ARRAY['read', 'write', 'delete', 'update']),
('DOCTOR', 'patients', ARRAY['read', 'write', 'update']),
('DOCTOR', 'emr', ARRAY['read', 'write', 'update']),
('DOCTOR', 'prescriptions', ARRAY['read', 'write']),
('NURSE', 'patients', ARRAY['read', 'update']),
('NURSE', 'vitals', ARRAY['read', 'write', 'update']),
('BILLING', 'billing', ARRAY['read', 'write', 'update']),
('BILLING', 'insurance', ARRAY['read', 'write']),
('PHARMACIST', 'prescriptions', ARRAY['read', 'update']),
('PHARMACIST', 'inventory', ARRAY['read', 'write', 'update']),
('PATIENT', 'own_records', ARRAY['read']),
('PATIENT', 'appointments', ARRAY['read', 'write'])
ON CONFLICT (role, resource) DO NOTHING;

-- Insert default password policy
INSERT INTO password_policies (
    min_length, require_uppercase, require_lowercase,
    require_numbers, require_special_chars, max_age_days
) VALUES (
    10, TRUE, TRUE, TRUE, TRUE, 60
) ON CONFLICT DO NOTHING;

-- Insert retention policies
INSERT INTO retention_policies (data_type, retention_period_days, deletion_method) VALUES
('medical_records', 2555, 'anonymize'),  -- 7 years
('billing_records', 2555, 'archive'),    -- 7 years
('audit_logs', 365, 'archive'),          -- 1 year
('security_events', 730, 'archive'),     -- 2 years
('session_data', 30, 'hard_delete'),     -- 30 days
('temp_files', 7, 'hard_delete')         -- 7 days
ON CONFLICT DO NOTHING;
