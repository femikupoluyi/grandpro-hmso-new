-- GrandPro HMSO Data Lake Schema
-- Centralized analytics database with logical schemas for each module

-- Create separate schemas for data organization
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS ml_models;

-- =====================================================
-- ANALYTICS SCHEMA - Data Lake Tables
-- =====================================================

-- Fact table for patient visits
CREATE TABLE IF NOT EXISTS analytics.fact_patient_visits (
    visit_id SERIAL PRIMARY KEY,
    patient_id UUID,
    hospital_id UUID,
    doctor_id UUID,
    visit_date DATE,
    visit_time TIME,
    visit_type VARCHAR(50),
    diagnosis_code VARCHAR(20),
    treatment_cost DECIMAL(10,2),
    insurance_covered DECIMAL(10,2),
    patient_paid DECIMAL(10,2),
    visit_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact table for drug consumption
CREATE TABLE IF NOT EXISTS analytics.fact_drug_consumption (
    consumption_id SERIAL PRIMARY KEY,
    drug_id VARCHAR(50),
    drug_name VARCHAR(255),
    hospital_id UUID,
    consumption_date DATE,
    quantity_consumed INTEGER,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    supplier_id VARCHAR(50),
    reorder_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact table for insurance claims
CREATE TABLE IF NOT EXISTS analytics.fact_insurance_claims (
    claim_id SERIAL PRIMARY KEY,
    claim_reference VARCHAR(100),
    patient_id UUID,
    hospital_id UUID,
    provider_id VARCHAR(50),
    claim_date DATE,
    claim_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    claim_status VARCHAR(50),
    processing_days INTEGER,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact table for telemedicine sessions
CREATE TABLE IF NOT EXISTS analytics.fact_telemedicine_sessions (
    session_id SERIAL PRIMARY KEY,
    consultation_id VARCHAR(100),
    patient_id UUID,
    doctor_id UUID,
    session_date DATE,
    session_duration_minutes INTEGER,
    session_type VARCHAR(50),
    patient_satisfaction_score INTEGER,
    technical_issues BOOLEAN DEFAULT FALSE,
    prescription_issued BOOLEAN DEFAULT FALSE,
    follow_up_scheduled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension table for time
CREATE TABLE IF NOT EXISTS analytics.dim_time (
    time_id SERIAL PRIMARY KEY,
    full_date DATE UNIQUE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    month_name VARCHAR(20),
    week_of_year INTEGER,
    day_of_month INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    holiday_name VARCHAR(100)
);

-- Dimension table for hospitals
CREATE TABLE IF NOT EXISTS analytics.dim_hospitals (
    hospital_id UUID PRIMARY KEY,
    hospital_name VARCHAR(255),
    hospital_type VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    bed_capacity INTEGER,
    staff_count INTEGER,
    has_emergency BOOLEAN,
    has_pharmacy BOOLEAN,
    has_lab BOOLEAN,
    quality_rating DECIMAL(3,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension table for drugs
CREATE TABLE IF NOT EXISTS analytics.dim_drugs (
    drug_id VARCHAR(50) PRIMARY KEY,
    drug_name VARCHAR(255),
    drug_category VARCHAR(100),
    manufacturer VARCHAR(255),
    unit_price DECIMAL(10,2),
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    is_essential BOOLEAN,
    requires_prescription BOOLEAN,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated metrics table for daily statistics
CREATE TABLE IF NOT EXISTS analytics.daily_metrics (
    metric_date DATE,
    hospital_id UUID,
    total_patients INTEGER,
    total_admissions INTEGER,
    total_discharges INTEGER,
    bed_occupancy_rate DECIMAL(5,2),
    average_wait_time_minutes INTEGER,
    total_revenue DECIMAL(12,2),
    total_insurance_claims DECIMAL(12,2),
    drug_stock_value DECIMAL(12,2),
    staff_attendance_rate DECIMAL(5,2),
    patient_satisfaction_avg DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (metric_date, hospital_id)
);

-- =====================================================
-- STAGING SCHEMA - ETL Processing Tables
-- =====================================================

CREATE TABLE IF NOT EXISTS staging.patient_visits_staging (
    visit_id VARCHAR(100),
    patient_id VARCHAR(100),
    hospital_id VARCHAR(100),
    visit_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staging.drug_consumption_staging (
    transaction_id VARCHAR(100),
    hospital_id VARCHAR(100),
    consumption_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staging.insurance_claims_staging (
    claim_id VARCHAR(100),
    hospital_id VARCHAR(100),
    claim_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- =====================================================
-- ML_MODELS SCHEMA - Machine Learning Components
-- =====================================================

-- Model registry
CREATE TABLE IF NOT EXISTS ml_models.model_registry (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(255),
    model_type VARCHAR(100),
    version VARCHAR(50),
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    model_parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions tracking
CREATE TABLE IF NOT EXISTS ml_models.predictions (
    prediction_id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ml_models.model_registry(model_id),
    prediction_type VARCHAR(100),
    input_data JSONB,
    prediction_output JSONB,
    confidence_score DECIMAL(5,4),
    actual_outcome JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug demand forecasts
CREATE TABLE IF NOT EXISTS ml_models.drug_demand_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    hospital_id UUID,
    drug_id VARCHAR(50),
    forecast_date DATE,
    forecast_period_days INTEGER,
    predicted_demand INTEGER,
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,
    model_id INTEGER REFERENCES ml_models.model_registry(model_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient risk scores
CREATE TABLE IF NOT EXISTS ml_models.patient_risk_scores (
    score_id SERIAL PRIMARY KEY,
    patient_id UUID,
    risk_category VARCHAR(100),
    risk_score DECIMAL(5,4),
    risk_level VARCHAR(20),
    contributing_factors JSONB,
    recommended_interventions JSONB,
    model_id INTEGER REFERENCES ml_models.model_registry(model_id),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fraud detection alerts
CREATE TABLE IF NOT EXISTS ml_models.fraud_alerts (
    alert_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    fraud_type VARCHAR(100),
    risk_score DECIMAL(5,4),
    suspicious_patterns JSONB,
    investigation_status VARCHAR(50) DEFAULT 'pending',
    model_id INTEGER REFERENCES ml_models.model_registry(model_id),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triage predictions
CREATE TABLE IF NOT EXISTS ml_models.triage_predictions (
    triage_id SERIAL PRIMARY KEY,
    patient_id UUID,
    symptoms JSONB,
    predicted_urgency VARCHAR(50),
    recommended_department VARCHAR(100),
    confidence_score DECIMAL(5,4),
    model_id INTEGER REFERENCES ml_models.model_registry(model_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Fact tables indexes
CREATE INDEX idx_patient_visits_date ON analytics.fact_patient_visits(visit_date);
CREATE INDEX idx_patient_visits_hospital ON analytics.fact_patient_visits(hospital_id);
CREATE INDEX idx_drug_consumption_date ON analytics.fact_drug_consumption(consumption_date);
CREATE INDEX idx_drug_consumption_hospital ON analytics.fact_drug_consumption(hospital_id);
CREATE INDEX idx_insurance_claims_date ON analytics.fact_insurance_claims(claim_date);
CREATE INDEX idx_telemedicine_sessions_date ON analytics.fact_telemedicine_sessions(session_date);

-- Staging tables indexes
CREATE INDEX idx_staging_visits_status ON staging.patient_visits_staging(processing_status);
CREATE INDEX idx_staging_drugs_status ON staging.drug_consumption_staging(processing_status);
CREATE INDEX idx_staging_claims_status ON staging.insurance_claims_staging(processing_status);

-- ML tables indexes
CREATE INDEX idx_predictions_model ON ml_models.predictions(model_id);
CREATE INDEX idx_drug_forecasts_date ON ml_models.drug_demand_forecasts(forecast_date);
CREATE INDEX idx_patient_risk_patient ON ml_models.patient_risk_scores(patient_id);
CREATE INDEX idx_fraud_alerts_status ON ml_models.fraud_alerts(investigation_status);

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Populate time dimension for the next 2 years
INSERT INTO analytics.dim_time (full_date, year, quarter, month, month_name, 
    week_of_year, day_of_month, day_of_week, day_name, is_weekend)
SELECT 
    date_series::date AS full_date,
    EXTRACT(YEAR FROM date_series) AS year,
    EXTRACT(QUARTER FROM date_series) AS quarter,
    EXTRACT(MONTH FROM date_series) AS month,
    TO_CHAR(date_series, 'Month') AS month_name,
    EXTRACT(WEEK FROM date_series) AS week_of_year,
    EXTRACT(DAY FROM date_series) AS day_of_month,
    EXTRACT(DOW FROM date_series) AS day_of_week,
    TO_CHAR(date_series, 'Day') AS day_name,
    EXTRACT(DOW FROM date_series) IN (0, 6) AS is_weekend
FROM generate_series(
    '2025-01-01'::date,
    '2026-12-31'::date,
    '1 day'::interval
) AS date_series
ON CONFLICT (full_date) DO NOTHING;
