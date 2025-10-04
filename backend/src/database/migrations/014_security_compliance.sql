-- =====================================================
-- SECURITY & COMPLIANCE TABLES
-- =====================================================

-- Audit Logs Table (HIPAA/GDPR Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    event_level VARCHAR(20) DEFAULT 'INFO',
    resource_type VARCHAR(100),
    resource_id INTEGER,
    action VARCHAR(100),
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    metadata JSONB,
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_event_type (event_type),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_resource (resource_type, resource_id)
);

-- Audit Logs Archive (for long-term storage)
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    LIKE audit_logs INCLUDING ALL
);

-- Data Access Logs (HIPAA requirement)
CREATE TABLE IF NOT EXISTS data_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    patient_id INTEGER,
    record_type VARCHAR(100),
    record_id INTEGER,
    access_type VARCHAR(20), -- VIEW, CREATE, UPDATE, DELETE
    access_reason TEXT,
    access_granted BOOLEAN DEFAULT TRUE,
    ip_address INET,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_access_patient (patient_id),
    INDEX idx_access_user (user_id),
    INDEX idx_access_time (accessed_at)
);

-- Consent Management (GDPR Compliance)
CREATE TABLE IF NOT EXISTS patient_consents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    consent_type VARCHAR(100) NOT NULL, -- DATA_PROCESSING, MARKETING, RESEARCH
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP NOT NULL,
    withdrawal_date TIMESTAMP,
    purpose TEXT,
    data_categories TEXT[],
    retention_period INTEGER, -- days
    expiry_date DATE,
    consent_method VARCHAR(50), -- WRITTEN, ELECTRONIC, VERBAL
    witness_id INTEGER,
    document_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, consent_type)
);

-- Encryption Keys Management
CREATE TABLE IF NOT EXISTS encryption_keys (
    id SERIAL PRIMARY KEY,
    key_id VARCHAR(255) UNIQUE NOT NULL,
    key_type VARCHAR(50), -- MASTER, DATA, FIELD
    algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    key_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ROTATED, EXPIRED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by INTEGER,
    metadata JSONB
);

-- Encrypted PII Storage
CREATE TABLE IF NOT EXISTS encrypted_pii (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- PATIENT, STAFF, USER
    entity_id INTEGER NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    encrypted_value TEXT NOT NULL,
    encryption_key_id VARCHAR(255),
    iv TEXT,
    auth_tag TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, field_name)
);

-- Role Permissions (RBAC)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_name, permission_name, resource_type)
);

-- User Sessions (for session management and security)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    location_data JSONB,
    device_fingerprint VARCHAR(255),
    INDEX idx_session_user (user_id),
    INDEX idx_session_active (is_active, last_activity)
);

-- Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id SERIAL PRIMARY KEY,
    incident_type VARCHAR(100), -- UNAUTHORIZED_ACCESS, DATA_BREACH, SUSPICIOUS_ACTIVITY
    severity VARCHAR(20), -- CRITICAL, HIGH, MEDIUM, LOW
    user_id INTEGER,
    ip_address INET,
    description TEXT,
    affected_resources JSONB,
    detection_method VARCHAR(100),
    response_actions JSONB,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, CLOSED
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    reported_by VARCHAR(255),
    assigned_to VARCHAR(255)
);

-- Backup Logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50), -- FULL, INCREMENTAL, ARCHIVE
    schedule VARCHAR(50), -- DAILY, WEEKLY, MONTHLY, MANUAL
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(20), -- STARTED, COMPLETED, FAILED
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_days INTEGER DEFAULT 90
);

-- Failover Test Results
CREATE TABLE IF NOT EXISTS failover_tests (
    id SERIAL PRIMARY KEY,
    test_date TIMESTAMP NOT NULL,
    test_type VARCHAR(50), -- PLANNED, EMERGENCY
    all_passed BOOLEAN,
    test_results JSONB,
    recovery_time_seconds INTEGER,
    data_loss_check BOOLEAN,
    error_message TEXT,
    performed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Reports
CREATE TABLE IF NOT EXISTS compliance_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100), -- HIPAA, GDPR, AUDIT, SECURITY
    report_period_start DATE,
    report_period_end DATE,
    generated_by VARCHAR(255),
    report_data JSONB,
    findings JSONB,
    recommendations JSONB,
    status VARCHAR(50), -- DRAFT, FINAL, SUBMITTED
    file_path TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Retention Policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(100) NOT NULL,
    retention_period_days INTEGER NOT NULL,
    deletion_policy VARCHAR(50), -- HARD_DELETE, SOFT_DELETE, ANONYMIZE
    legal_basis TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_type)
);

-- Access Control Lists (ACL)
CREATE TABLE IF NOT EXISTS access_control_lists (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    resource_id INTEGER NOT NULL,
    user_id INTEGER,
    role_name VARCHAR(50),
    permissions TEXT[], -- Array of permissions
    grant_type VARCHAR(20), -- ALLOW, DENY
    priority INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    INDEX idx_acl_resource (resource_type, resource_id),
    INDEX idx_acl_user (user_id)
);

-- Security Configuration
CREATE TABLE IF NOT EXISTS security_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50), -- ENCRYPTION, AUTH, AUDIT, BACKUP
    is_encrypted BOOLEAN DEFAULT FALSE,
    description TEXT,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(255)
);

-- =====================================================
-- INSERT DEFAULT SECURITY CONFIGURATIONS
-- =====================================================

-- Default Role Permissions
INSERT INTO role_permissions (role_name, permission_name, resource_type, can_create, can_read, can_update, can_delete)
VALUES 
    ('SUPER_ADMIN', 'ALL', 'ALL', TRUE, TRUE, TRUE, TRUE),
    ('ADMIN', 'MANAGE_HOSPITAL', 'hospital', TRUE, TRUE, TRUE, FALSE),
    ('ADMIN', 'MANAGE_USERS', 'user', TRUE, TRUE, TRUE, FALSE),
    ('DOCTOR', 'MANAGE_PATIENTS', 'patient', TRUE, TRUE, TRUE, FALSE),
    ('DOCTOR', 'MANAGE_PRESCRIPTIONS', 'prescription', TRUE, TRUE, TRUE, FALSE),
    ('NURSE', 'VIEW_PATIENTS', 'patient', FALSE, TRUE, TRUE, FALSE),
    ('NURSE', 'MANAGE_VITALS', 'medical_record', TRUE, TRUE, TRUE, FALSE),
    ('PHARMACIST', 'MANAGE_MEDICATIONS', 'medication', FALSE, TRUE, TRUE, FALSE),
    ('BILLING_CLERK', 'MANAGE_INVOICES', 'invoice', TRUE, TRUE, TRUE, FALSE),
    ('PATIENT', 'VIEW_OWN_RECORDS', 'medical_record', FALSE, TRUE, FALSE, FALSE)
ON CONFLICT (role_name, permission_name, resource_type) DO NOTHING;

-- Default Data Retention Policies
INSERT INTO data_retention_policies (data_type, retention_period_days, deletion_policy, legal_basis)
VALUES 
    ('MEDICAL_RECORDS', 2555, 'SOFT_DELETE', 'HIPAA requires 7 years minimum'),
    ('AUDIT_LOGS', 2190, 'SOFT_DELETE', 'HIPAA requires 6 years minimum'),
    ('BILLING_RECORDS', 2555, 'SOFT_DELETE', 'Tax and legal requirements'),
    ('PATIENT_CONSENTS', 3650, 'SOFT_DELETE', 'GDPR requirement for consent records'),
    ('SECURITY_INCIDENTS', 1095, 'SOFT_DELETE', 'Security best practice 3 years'),
    ('BACKUP_LOGS', 365, 'HARD_DELETE', 'Operational requirement'),
    ('USER_SESSIONS', 90, 'HARD_DELETE', 'Security best practice')
ON CONFLICT (data_type) DO NOTHING;

-- Default Security Configuration
INSERT INTO security_config (config_key, config_value, config_type, description)
VALUES 
    ('PASSWORD_MIN_LENGTH', '12', 'AUTH', 'Minimum password length'),
    ('PASSWORD_COMPLEXITY', 'HIGH', 'AUTH', 'Requires uppercase, lowercase, numbers, and symbols'),
    ('SESSION_TIMEOUT_MINUTES', '30', 'AUTH', 'Session timeout after inactivity'),
    ('MAX_LOGIN_ATTEMPTS', '5', 'AUTH', 'Maximum failed login attempts before lockout'),
    ('LOCKOUT_DURATION_MINUTES', '30', 'AUTH', 'Account lockout duration'),
    ('MFA_REQUIRED', 'TRUE', 'AUTH', 'Multi-factor authentication required'),
    ('ENCRYPTION_ALGORITHM', 'AES-256-GCM', 'ENCRYPTION', 'Default encryption algorithm'),
    ('KEY_ROTATION_DAYS', '90', 'ENCRYPTION', 'Encryption key rotation period'),
    ('BACKUP_ENCRYPTION', 'TRUE', 'BACKUP', 'Enable backup encryption'),
    ('BACKUP_COMPRESSION', 'TRUE', 'BACKUP', 'Enable backup compression'),
    ('AUDIT_LEVEL', 'DETAILED', 'AUDIT', 'Level of audit logging'),
    ('GDPR_MODE', 'TRUE', 'COMPLIANCE', 'Enable GDPR compliance features'),
    ('HIPAA_MODE', 'TRUE', 'COMPLIANCE', 'Enable HIPAA compliance features')
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_consent_patient_type ON patient_consents(patient_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_encrypted_pii_lookup ON encrypted_pii(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_cleanup ON user_sessions(is_active, last_activity) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_incidents_open ON security_incidents(status, severity) WHERE status = 'OPEN';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_consents_updated_at
    BEFORE UPDATE ON patient_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encrypted_pii_updated_at
    BEFORE UPDATE ON encrypted_pii
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMPLIANCE REPORTING
-- =====================================================

-- Active User Sessions View
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    s.session_id,
    s.user_id,
    u.email,
    u.role,
    s.ip_address,
    s.login_time,
    s.last_activity,
    EXTRACT(EPOCH FROM (NOW() - s.last_activity))/60 as idle_minutes
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = TRUE
    AND s.logout_time IS NULL;

-- Recent Security Incidents View
CREATE OR REPLACE VIEW recent_security_incidents AS
SELECT 
    si.*,
    u.email as user_email
FROM security_incidents si
LEFT JOIN users u ON si.user_id = u.id
WHERE si.status IN ('OPEN', 'INVESTIGATING')
    OR si.reported_at > NOW() - INTERVAL '7 days'
ORDER BY si.severity DESC, si.reported_at DESC;

-- Consent Status View
CREATE OR REPLACE VIEW patient_consent_status AS
SELECT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    pc.consent_type,
    pc.consent_given,
    pc.consent_date,
    pc.expiry_date,
    CASE 
        WHEN pc.withdrawal_date IS NOT NULL THEN 'WITHDRAWN'
        WHEN pc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN pc.consent_given = TRUE THEN 'ACTIVE'
        ELSE 'NOT_GIVEN'
    END as consent_status
FROM patients p
LEFT JOIN patient_consents pc ON p.id = pc.patient_id;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON audit_logs TO PUBLIC;
GRANT SELECT ON compliance_reports TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
