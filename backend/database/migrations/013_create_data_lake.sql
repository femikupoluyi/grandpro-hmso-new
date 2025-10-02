-- Migration: Create Data Lake and Analytics Infrastructure
-- Purpose: Set up centralized data lake with logical schemas for each module
-- Date: 2025-01-02

-- ============================================================================
-- STEP 1: CREATE DATA LAKE SCHEMAS
-- ============================================================================

-- Create main data lake schema
CREATE SCHEMA IF NOT EXISTS data_lake;
COMMENT ON SCHEMA data_lake IS 'Centralized data lake for analytics and reporting';

-- Create module-specific schemas within data lake
CREATE SCHEMA IF NOT EXISTS data_lake_sourcing;
CREATE SCHEMA IF NOT EXISTS data_lake_crm;
CREATE SCHEMA IF NOT EXISTS data_lake_operations;
CREATE SCHEMA IF NOT EXISTS data_lake_insurance;
CREATE SCHEMA IF NOT EXISTS data_lake_pharmacy;
CREATE SCHEMA IF NOT EXISTS data_lake_telemedicine;
CREATE SCHEMA IF NOT EXISTS data_lake_finance;

-- Create analytics-specific schemas
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS ml_models;
CREATE SCHEMA IF NOT EXISTS predictions;

-- ============================================================================
-- STEP 2: CREATE DATA LAKE TABLES (FACT AND DIMENSION TABLES)
-- ============================================================================

-- Dimension: Time
CREATE TABLE IF NOT EXISTS data_lake.dim_time (
    time_key SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    year INT NOT NULL,
    quarter INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week INT NOT NULL,
    day_of_month INT NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(100),
    fiscal_year INT,
    fiscal_quarter INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension: Hospital
CREATE TABLE IF NOT EXISTS data_lake.dim_hospital (
    hospital_key SERIAL PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL UNIQUE,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(50),
    ownership_type VARCHAR(50),
    bed_capacity INT,
    location_state VARCHAR(100),
    location_city VARCHAR(100),
    location_lga VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    established_date DATE,
    accreditation_status VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension: Patient
CREATE TABLE IF NOT EXISTS data_lake.dim_patient (
    patient_key SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL UNIQUE,
    age_group VARCHAR(20),
    gender VARCHAR(10),
    state_of_origin VARCHAR(100),
    state_of_residence VARCHAR(100),
    occupation_category VARCHAR(100),
    insurance_type VARCHAR(50),
    registration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension: Staff
CREATE TABLE IF NOT EXISTS data_lake.dim_staff (
    staff_key SERIAL PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    staff_category VARCHAR(50),
    specialization VARCHAR(100),
    qualification_level VARCHAR(50),
    years_of_experience INT,
    department VARCHAR(100),
    employment_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension: Drug/Medicine
CREATE TABLE IF NOT EXISTS data_lake.dim_drug (
    drug_key SERIAL PRIMARY KEY,
    drug_id VARCHAR(50) NOT NULL UNIQUE,
    drug_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    drug_category VARCHAR(100),
    drug_class VARCHAR(100),
    manufacturer VARCHAR(255),
    dosage_form VARCHAR(50),
    strength VARCHAR(50),
    unit_of_measure VARCHAR(20),
    requires_prescription BOOLEAN DEFAULT FALSE,
    is_controlled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Patient Visits
CREATE TABLE IF NOT EXISTS data_lake.fact_patient_visits (
    visit_key BIGSERIAL PRIMARY KEY,
    time_key INT REFERENCES data_lake.dim_time(time_key),
    hospital_key INT REFERENCES data_lake.dim_hospital(hospital_key),
    patient_key INT REFERENCES data_lake.dim_patient(patient_key),
    staff_key INT REFERENCES data_lake.dim_staff(staff_key),
    visit_type VARCHAR(50),
    department VARCHAR(100),
    diagnosis_code VARCHAR(20),
    diagnosis_description TEXT,
    treatment_outcome VARCHAR(50),
    visit_duration_minutes INT,
    wait_time_minutes INT,
    total_cost DECIMAL(12, 2),
    insurance_covered DECIMAL(12, 2),
    out_of_pocket DECIMAL(12, 2),
    is_emergency BOOLEAN DEFAULT FALSE,
    is_referral BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Drug Dispensing
CREATE TABLE IF NOT EXISTS data_lake.fact_drug_dispensing (
    dispensing_key BIGSERIAL PRIMARY KEY,
    time_key INT REFERENCES data_lake.dim_time(time_key),
    hospital_key INT REFERENCES data_lake.dim_hospital(hospital_key),
    patient_key INT REFERENCES data_lake.dim_patient(patient_key),
    drug_key INT REFERENCES data_lake.dim_drug(drug_key),
    prescription_id VARCHAR(50),
    quantity_dispensed DECIMAL(10, 2),
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(12, 2),
    insurance_covered DECIMAL(12, 2),
    dispensing_pharmacist VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Insurance Claims
CREATE TABLE IF NOT EXISTS data_lake.fact_insurance_claims (
    claim_key BIGSERIAL PRIMARY KEY,
    time_key INT REFERENCES data_lake.dim_time(time_key),
    hospital_key INT REFERENCES data_lake.dim_hospital(hospital_key),
    patient_key INT REFERENCES data_lake.dim_patient(patient_key),
    claim_id VARCHAR(50) UNIQUE NOT NULL,
    insurance_provider VARCHAR(100),
    claim_type VARCHAR(50),
    claim_amount DECIMAL(12, 2),
    approved_amount DECIMAL(12, 2),
    rejected_amount DECIMAL(12, 2),
    claim_status VARCHAR(50),
    submission_date DATE,
    approval_date DATE,
    processing_days INT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Inventory Movements
CREATE TABLE IF NOT EXISTS data_lake.fact_inventory_movements (
    movement_key BIGSERIAL PRIMARY KEY,
    time_key INT REFERENCES data_lake.dim_time(time_key),
    hospital_key INT REFERENCES data_lake.dim_hospital(hospital_key),
    drug_key INT REFERENCES data_lake.dim_drug(drug_key),
    movement_type VARCHAR(50), -- 'IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED'
    quantity DECIMAL(10, 2),
    unit_cost DECIMAL(10, 2),
    total_value DECIMAL(12, 2),
    supplier VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Telemedicine Sessions
CREATE TABLE IF NOT EXISTS data_lake.fact_telemedicine_sessions (
    session_key BIGSERIAL PRIMARY KEY,
    time_key INT REFERENCES data_lake.dim_time(time_key),
    patient_key INT REFERENCES data_lake.dim_patient(patient_key),
    staff_key INT REFERENCES data_lake.dim_staff(staff_key),
    session_id VARCHAR(50) UNIQUE NOT NULL,
    provider VARCHAR(100),
    session_type VARCHAR(50),
    duration_minutes INT,
    connection_quality VARCHAR(20),
    patient_satisfaction_score INT CHECK (patient_satisfaction_score BETWEEN 1 AND 5),
    prescription_issued BOOLEAN DEFAULT FALSE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    technical_issues BOOLEAN DEFAULT FALSE,
    session_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 3: CREATE ETL TRACKING AND METADATA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_lake.etl_job_runs (
    run_id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    source_schema VARCHAR(100),
    target_schema VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    records_processed BIGINT DEFAULT 0,
    records_inserted BIGINT DEFAULT 0,
    records_updated BIGINT DEFAULT 0,
    records_deleted BIGINT DEFAULT 0,
    error_count INT DEFAULT 0,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INT GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (end_time - start_time))::INT 
            ELSE NULL 
        END
    ) STORED,
    error_message TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_lake.data_quality_checks (
    check_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'COMPLETENESS', 'UNIQUENESS', 'VALIDITY', 'CONSISTENCY'
    check_query TEXT NOT NULL,
    expected_result VARCHAR(255),
    actual_result VARCHAR(255),
    passed BOOLEAN,
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 4: CREATE AGGREGATION TABLES FOR ANALYTICS
-- ============================================================================

-- Daily Hospital Metrics
CREATE TABLE IF NOT EXISTS analytics.hospital_daily_metrics (
    metric_date DATE NOT NULL,
    hospital_id VARCHAR(50) NOT NULL,
    total_visits INT DEFAULT 0,
    emergency_visits INT DEFAULT 0,
    admissions INT DEFAULT 0,
    discharges INT DEFAULT 0,
    bed_occupancy_rate DECIMAL(5, 2),
    average_wait_time_minutes INT,
    total_revenue DECIMAL(12, 2),
    total_insurance_claims DECIMAL(12, 2),
    drugs_dispensed INT DEFAULT 0,
    telemedicine_sessions INT DEFAULT 0,
    patient_satisfaction_avg DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (metric_date, hospital_id)
);

-- Drug Usage Analytics
CREATE TABLE IF NOT EXISTS analytics.drug_usage_analytics (
    analysis_date DATE NOT NULL,
    hospital_id VARCHAR(50) NOT NULL,
    drug_id VARCHAR(50) NOT NULL,
    total_dispensed DECIMAL(10, 2),
    total_ordered DECIMAL(10, 2),
    current_stock DECIMAL(10, 2),
    days_of_stock INT,
    reorder_point DECIMAL(10, 2),
    average_daily_usage DECIMAL(10, 2),
    forecast_7_days DECIMAL(10, 2),
    forecast_30_days DECIMAL(10, 2),
    stockout_risk VARCHAR(20), -- 'HIGH', 'MEDIUM', 'LOW', 'NONE'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (analysis_date, hospital_id, drug_id)
);

-- Patient Risk Scores
CREATE TABLE IF NOT EXISTS analytics.patient_risk_scores (
    patient_id VARCHAR(50) PRIMARY KEY,
    risk_category VARCHAR(50) NOT NULL, -- 'READMISSION', 'CHRONIC', 'MEDICATION_ADHERENCE'
    risk_score DECIMAL(5, 2) CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20), -- 'HIGH', 'MEDIUM', 'LOW'
    contributing_factors JSONB,
    recommended_interventions JSONB,
    last_calculated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Fraud Risk
CREATE TABLE IF NOT EXISTS analytics.insurance_fraud_risk (
    claim_id VARCHAR(50) PRIMARY KEY,
    fraud_risk_score DECIMAL(5, 2) CHECK (fraud_risk_score BETWEEN 0 AND 100),
    risk_indicators JSONB,
    anomaly_detected BOOLEAN DEFAULT FALSE,
    review_required BOOLEAN DEFAULT FALSE,
    review_status VARCHAR(50),
    reviewed_by VARCHAR(100),
    review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 5: CREATE ML MODEL METADATA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_models.model_registry (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL UNIQUE,
    model_type VARCHAR(50) NOT NULL, -- 'CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'TIME_SERIES'
    use_case VARCHAR(100) NOT NULL, -- 'DRUG_DEMAND_FORECAST', 'PATIENT_RISK', 'FRAUD_DETECTION', 'TRIAGE'
    version VARCHAR(20) NOT NULL,
    algorithm VARCHAR(100),
    training_dataset VARCHAR(255),
    accuracy_score DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall_score DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    model_path VARCHAR(500),
    is_active BOOLEAN DEFAULT FALSE,
    deployed_date DATE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models.prediction_logs (
    prediction_id BIGSERIAL PRIMARY KEY,
    model_id INT REFERENCES ml_models.model_registry(model_id),
    input_data JSONB NOT NULL,
    prediction_output JSONB NOT NULL,
    confidence_score DECIMAL(5, 4),
    actual_outcome JSONB,
    feedback_provided BOOLEAN DEFAULT FALSE,
    prediction_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 6: CREATE MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Hospital Performance Overview
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_hospital_performance AS
SELECT 
    h.hospital_id,
    h.hospital_name,
    h.location_state,
    COUNT(DISTINCT fv.patient_key) as total_patients,
    COUNT(fv.visit_key) as total_visits,
    AVG(fv.wait_time_minutes) as avg_wait_time,
    SUM(fv.total_cost) as total_revenue,
    AVG(CASE WHEN ft.patient_satisfaction_score IS NOT NULL 
        THEN ft.patient_satisfaction_score ELSE NULL END) as avg_satisfaction,
    COUNT(DISTINCT ft.session_key) as telemedicine_sessions
FROM data_lake.dim_hospital h
LEFT JOIN data_lake.fact_patient_visits fv ON h.hospital_key = fv.hospital_key
LEFT JOIN data_lake.fact_telemedicine_sessions ft ON fv.patient_key = ft.patient_key
WHERE h.is_active = TRUE
GROUP BY h.hospital_id, h.hospital_name, h.location_state;

-- Drug Inventory Status
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_drug_inventory_status AS
SELECT 
    d.drug_id,
    d.drug_name,
    d.drug_category,
    h.hospital_id,
    h.hospital_name,
    SUM(CASE WHEN fim.movement_type = 'IN' THEN fim.quantity ELSE 0 END) -
    SUM(CASE WHEN fim.movement_type = 'OUT' THEN fim.quantity ELSE 0 END) as current_stock,
    AVG(CASE WHEN fim.movement_type = 'OUT' THEN fim.quantity ELSE 0 END) as avg_daily_consumption,
    MAX(fim.created_at) as last_movement_date
FROM data_lake.dim_drug d
CROSS JOIN data_lake.dim_hospital h
LEFT JOIN data_lake.fact_inventory_movements fim 
    ON d.drug_key = fim.drug_key AND h.hospital_key = fim.hospital_key
GROUP BY d.drug_id, d.drug_name, d.drug_category, h.hospital_id, h.hospital_name;

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Time dimension indexes
CREATE INDEX idx_dim_time_date ON data_lake.dim_time(date);
CREATE INDEX idx_dim_time_year_month ON data_lake.dim_time(year, month);

-- Fact table indexes
CREATE INDEX idx_fact_visits_time ON data_lake.fact_patient_visits(time_key);
CREATE INDEX idx_fact_visits_hospital ON data_lake.fact_patient_visits(hospital_key);
CREATE INDEX idx_fact_visits_patient ON data_lake.fact_patient_visits(patient_key);

CREATE INDEX idx_fact_dispensing_time ON data_lake.fact_drug_dispensing(time_key);
CREATE INDEX idx_fact_dispensing_drug ON data_lake.fact_drug_dispensing(drug_key);

CREATE INDEX idx_fact_claims_time ON data_lake.fact_insurance_claims(time_key);
CREATE INDEX idx_fact_claims_status ON data_lake.fact_insurance_claims(claim_status);

CREATE INDEX idx_fact_inventory_time ON data_lake.fact_inventory_movements(time_key);
CREATE INDEX idx_fact_inventory_type ON data_lake.fact_inventory_movements(movement_type);

CREATE INDEX idx_fact_telemedicine_time ON data_lake.fact_telemedicine_sessions(time_key);

-- Analytics table indexes
CREATE INDEX idx_hospital_metrics_date ON analytics.hospital_daily_metrics(metric_date);
CREATE INDEX idx_drug_usage_date ON analytics.drug_usage_analytics(analysis_date);
CREATE INDEX idx_patient_risk_level ON analytics.patient_risk_scores(risk_level);
CREATE INDEX idx_fraud_risk_score ON analytics.insurance_fraud_risk(fraud_risk_score);

-- ============================================================================
-- STEP 8: CREATE FUNCTIONS FOR ETL OPERATIONS
-- ============================================================================

-- Function to populate time dimension
CREATE OR REPLACE FUNCTION data_lake.populate_time_dimension(
    start_date DATE,
    end_date DATE
) RETURNS VOID AS $$
DECLARE
    curr_date DATE;
BEGIN
    curr_date := start_date;
    
    WHILE curr_date <= end_date LOOP
        INSERT INTO data_lake.dim_time (
            date, year, quarter, month, month_name,
            week, day_of_month, day_of_week, day_name, is_weekend
        )
        VALUES (
            curr_date,
            EXTRACT(YEAR FROM curr_date),
            EXTRACT(QUARTER FROM curr_date),
            EXTRACT(MONTH FROM curr_date),
            TO_CHAR(curr_date, 'Month'),
            EXTRACT(WEEK FROM curr_date),
            EXTRACT(DAY FROM curr_date),
            EXTRACT(DOW FROM curr_date),
            TO_CHAR(curr_date, 'Day'),
            EXTRACT(DOW FROM curr_date) IN (0, 6)
        )
        ON CONFLICT (date) DO NOTHING;
        
        curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate patient risk score
CREATE OR REPLACE FUNCTION analytics.calculate_patient_risk_score(
    p_patient_id VARCHAR(50)
) RETURNS DECIMAL AS $$
DECLARE
    risk_score DECIMAL(5, 2);
    visit_count INT;
    chronic_conditions INT;
    missed_appointments INT;
BEGIN
    -- Basic risk calculation (to be enhanced with ML model)
    SELECT COUNT(*) INTO visit_count
    FROM data_lake.fact_patient_visits fv
    JOIN data_lake.dim_patient dp ON fv.patient_key = dp.patient_key
    WHERE dp.patient_id = p_patient_id
    AND fv.created_at >= CURRENT_DATE - INTERVAL '6 months';
    
    -- Simple risk score calculation
    risk_score := LEAST(100, visit_count * 10);
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: POPULATE INITIAL DATA
-- ============================================================================

-- Populate time dimension for 2024-2026
SELECT data_lake.populate_time_dimension('2024-01-01'::DATE, '2026-12-31'::DATE);

-- Add Nigerian holidays
UPDATE data_lake.dim_time 
SET is_holiday = TRUE, holiday_name = 'New Year''s Day'
WHERE EXTRACT(MONTH FROM date) = 1 AND EXTRACT(DAY FROM date) = 1;

UPDATE data_lake.dim_time 
SET is_holiday = TRUE, holiday_name = 'Democracy Day'
WHERE EXTRACT(MONTH FROM date) = 6 AND EXTRACT(DAY FROM date) = 12;

UPDATE data_lake.dim_time 
SET is_holiday = TRUE, holiday_name = 'Independence Day'
WHERE EXTRACT(MONTH FROM date) = 10 AND EXTRACT(DAY FROM date) = 1;

UPDATE data_lake.dim_time 
SET is_holiday = TRUE, holiday_name = 'Christmas Day'
WHERE EXTRACT(MONTH FROM date) = 12 AND EXTRACT(DAY FROM date) = 25;

UPDATE data_lake.dim_time 
SET is_holiday = TRUE, holiday_name = 'Boxing Day'
WHERE EXTRACT(MONTH FROM date) = 12 AND EXTRACT(DAY FROM date) = 26;

-- ============================================================================
-- STEP 10: CREATE VIEWS FOR REPORTING
-- ============================================================================

-- Executive Dashboard View
CREATE OR REPLACE VIEW analytics.v_executive_dashboard AS
SELECT 
    CURRENT_DATE as report_date,
    COUNT(DISTINCT h.hospital_id) as total_hospitals,
    COUNT(DISTINCT p.patient_id) as total_patients,
    COUNT(DISTINCT s.staff_id) as total_staff,
    SUM(fv.total_cost) as total_revenue_today,
    AVG(fv.wait_time_minutes) as avg_wait_time_today,
    COUNT(DISTINCT ft.session_id) as telemedicine_sessions_today
FROM data_lake.dim_hospital h
CROSS JOIN data_lake.dim_patient p
CROSS JOIN data_lake.dim_staff s
LEFT JOIN data_lake.fact_patient_visits fv 
    ON fv.time_key = (SELECT time_key FROM data_lake.dim_time WHERE date = CURRENT_DATE)
LEFT JOIN data_lake.fact_telemedicine_sessions ft
    ON ft.time_key = (SELECT time_key FROM data_lake.dim_time WHERE date = CURRENT_DATE);

-- Drug Demand Forecast View
CREATE OR REPLACE VIEW analytics.v_drug_demand_forecast AS
SELECT 
    drug_id,
    hospital_id,
    analysis_date,
    average_daily_usage,
    forecast_7_days,
    forecast_30_days,
    stockout_risk,
    CASE 
        WHEN stockout_risk = 'HIGH' THEN 'URGENT: Reorder immediately'
        WHEN stockout_risk = 'MEDIUM' THEN 'WARNING: Plan reorder within 3 days'
        WHEN stockout_risk = 'LOW' THEN 'OK: Monitor stock levels'
        ELSE 'GOOD: Adequate stock'
    END as action_required
FROM analytics.drug_usage_analytics
WHERE analysis_date = CURRENT_DATE;

-- ============================================================================
-- STEP 11: GRANT PERMISSIONS
-- ============================================================================

-- Create analytics role
CREATE ROLE analytics_reader;
GRANT USAGE ON SCHEMA data_lake TO analytics_reader;
GRANT USAGE ON SCHEMA analytics TO analytics_reader;
GRANT USAGE ON SCHEMA ml_models TO analytics_reader;
GRANT USAGE ON SCHEMA predictions TO analytics_reader;

GRANT SELECT ON ALL TABLES IN SCHEMA data_lake TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA ml_models TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA predictions TO analytics_reader;

-- Create ETL role
CREATE ROLE etl_processor;
GRANT ALL PRIVILEGES ON SCHEMA data_lake TO etl_processor;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO etl_processor;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA data_lake TO etl_processor;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO etl_processor;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
