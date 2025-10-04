-- =====================================================
-- DATA LAKE & ANALYTICS LAYER SETUP
-- =====================================================

-- Create separate schemas for data lake components
CREATE SCHEMA IF NOT EXISTS data_lake;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS ml_models;

-- =====================================================
-- DATA LAKE TABLES (Denormalized for Analytics)
-- =====================================================

-- Fact table for patient visits
CREATE TABLE IF NOT EXISTS data_lake.fact_patient_visits (
    visit_id SERIAL PRIMARY KEY,
    visit_date DATE NOT NULL,
    visit_datetime TIMESTAMP NOT NULL,
    patient_id INTEGER,
    hospital_id INTEGER,
    doctor_id INTEGER,
    department VARCHAR(100),
    visit_type VARCHAR(50),
    diagnosis TEXT,
    treatment_given TEXT,
    medications_prescribed JSONB,
    total_cost DECIMAL(10, 2),
    insurance_covered DECIMAL(10, 2),
    patient_paid DECIMAL(10, 2),
    visit_duration_minutes INTEGER,
    wait_time_minutes INTEGER,
    satisfaction_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact table for inventory transactions
CREATE TABLE IF NOT EXISTS data_lake.fact_inventory_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_datetime TIMESTAMP NOT NULL,
    hospital_id INTEGER,
    item_id INTEGER,
    item_name VARCHAR(255),
    category VARCHAR(100),
    transaction_type VARCHAR(50), -- 'IN', 'OUT', 'ADJUSTMENT'
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    total_value DECIMAL(10, 2),
    supplier_id VARCHAR(50),
    reason TEXT,
    stock_level_after INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact table for financial transactions
CREATE TABLE IF NOT EXISTS data_lake.fact_financial_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_datetime TIMESTAMP NOT NULL,
    hospital_id INTEGER,
    transaction_type VARCHAR(50), -- 'REVENUE', 'EXPENSE', 'INSURANCE_CLAIM', 'PAYMENT'
    category VARCHAR(100),
    amount DECIMAL(12, 2),
    payment_method VARCHAR(50),
    patient_id INTEGER,
    invoice_id INTEGER,
    insurance_provider VARCHAR(100),
    claim_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact table for staff activities
CREATE TABLE IF NOT EXISTS data_lake.fact_staff_activities (
    activity_id SERIAL PRIMARY KEY,
    activity_date DATE NOT NULL,
    activity_datetime TIMESTAMP NOT NULL,
    staff_id INTEGER,
    hospital_id INTEGER,
    activity_type VARCHAR(100),
    department VARCHAR(100),
    shift_type VARCHAR(50),
    hours_worked DECIMAL(4, 2),
    patients_attended INTEGER,
    procedures_performed INTEGER,
    performance_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension tables for better analytics
CREATE TABLE IF NOT EXISTS data_lake.dim_time (
    date_key DATE PRIMARY KEY,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    month_name VARCHAR(20),
    week INTEGER,
    day_of_month INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    holiday_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS data_lake.dim_hospitals (
    hospital_key INTEGER PRIMARY KEY,
    hospital_id INTEGER,
    hospital_name VARCHAR(255),
    location VARCHAR(255),
    state VARCHAR(100),
    region VARCHAR(100),
    hospital_type VARCHAR(100),
    bed_capacity INTEGER,
    staff_count INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_lake.dim_drugs (
    drug_key INTEGER PRIMARY KEY,
    drug_id INTEGER,
    drug_name VARCHAR(255),
    generic_name VARCHAR(255),
    category VARCHAR(100),
    therapeutic_class VARCHAR(100),
    manufacturer VARCHAR(255),
    unit_price DECIMAL(10, 2),
    requires_prescription BOOLEAN,
    controlled_substance BOOLEAN,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ANALYTICS AGGREGATION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics.hospital_daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    hospital_id INTEGER NOT NULL,
    total_patients INTEGER DEFAULT 0,
    outpatients INTEGER DEFAULT 0,
    inpatients INTEGER DEFAULT 0,
    emergency_cases INTEGER DEFAULT 0,
    surgeries INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_expenses DECIMAL(12, 2) DEFAULT 0,
    bed_occupancy_rate DECIMAL(5, 2) DEFAULT 0,
    average_wait_time_minutes INTEGER DEFAULT 0,
    staff_utilization_rate DECIMAL(5, 2) DEFAULT 0,
    patient_satisfaction_avg DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_date, hospital_id)
);

CREATE TABLE IF NOT EXISTS analytics.drug_usage_patterns (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    hospital_id INTEGER NOT NULL,
    drug_id INTEGER NOT NULL,
    drug_name VARCHAR(255),
    total_quantity_used INTEGER DEFAULT 0,
    unique_patients INTEGER DEFAULT 0,
    avg_dose_per_patient DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(12, 2) DEFAULT 0,
    reorder_frequency_days INTEGER DEFAULT 0,
    stock_turnover_rate DECIMAL(5, 2) DEFAULT 0,
    forecast_next_month INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics.patient_flow_analysis (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    hospital_id INTEGER NOT NULL,
    hour_of_day INTEGER NOT NULL,
    department VARCHAR(100),
    avg_patient_count DECIMAL(5, 2) DEFAULT 0,
    avg_wait_time_minutes INTEGER DEFAULT 0,
    peak_load_indicator BOOLEAN DEFAULT FALSE,
    staff_required INTEGER DEFAULT 0,
    bottleneck_identified VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ML MODEL STORAGE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_models.model_registry (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'FORECAST', 'CLASSIFICATION', 'CLUSTERING', 'ANOMALY'
    model_version VARCHAR(50) NOT NULL,
    description TEXT,
    algorithm VARCHAR(100),
    parameters JSONB,
    training_date TIMESTAMP,
    accuracy_score DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall_score DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    model_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models.predictions (
    prediction_id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ml_models.model_registry(model_id),
    prediction_type VARCHAR(100),
    entity_type VARCHAR(100), -- 'DRUG', 'PATIENT', 'REVENUE', 'DEMAND'
    entity_id INTEGER,
    prediction_date DATE NOT NULL,
    predicted_value DECIMAL(12, 2),
    confidence_score DECIMAL(3, 2),
    actual_value DECIMAL(12, 2),
    error_margin DECIMAL(5, 2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models.triage_predictions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    symptoms JSONB,
    vital_signs JSONB,
    predicted_urgency VARCHAR(50), -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    confidence_score DECIMAL(3, 2),
    recommended_department VARCHAR(100),
    estimated_wait_time INTEGER,
    risk_factors JSONB,
    model_version VARCHAR(50),
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models.fraud_detection (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER,
    transaction_type VARCHAR(100),
    anomaly_score DECIMAL(5, 4),
    is_flagged BOOLEAN DEFAULT FALSE,
    fraud_probability DECIMAL(3, 2),
    risk_level VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
    suspicious_patterns JSONB,
    investigation_status VARCHAR(50),
    model_version VARCHAR(50),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models.patient_risk_scores (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    risk_type VARCHAR(100), -- 'READMISSION', 'CHRONIC_DISEASE', 'MEDICATION_NON_ADHERENCE'
    risk_score DECIMAL(3, 2),
    risk_level VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
    contributing_factors JSONB,
    recommendations JSONB,
    next_assessment_date DATE,
    model_version VARCHAR(50),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ETL TRACKING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS data_lake.etl_jobs (
    job_id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100), -- 'FULL', 'INCREMENTAL', 'REAL_TIME'
    source_table VARCHAR(255),
    target_table VARCHAR(255),
    status VARCHAR(50), -- 'RUNNING', 'COMPLETED', 'FAILED', 'PENDING'
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_lake.etl_schedules (
    schedule_id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(50), -- 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Fact tables indexes
CREATE INDEX idx_fact_visits_date ON data_lake.fact_patient_visits(visit_date);
CREATE INDEX idx_fact_visits_hospital ON data_lake.fact_patient_visits(hospital_id);
CREATE INDEX idx_fact_visits_patient ON data_lake.fact_patient_visits(patient_id);

CREATE INDEX idx_fact_inventory_date ON data_lake.fact_inventory_transactions(transaction_date);
CREATE INDEX idx_fact_inventory_hospital ON data_lake.fact_inventory_transactions(hospital_id);
CREATE INDEX idx_fact_inventory_item ON data_lake.fact_inventory_transactions(item_id);

CREATE INDEX idx_fact_financial_date ON data_lake.fact_financial_transactions(transaction_date);
CREATE INDEX idx_fact_financial_hospital ON data_lake.fact_financial_transactions(hospital_id);
CREATE INDEX idx_fact_financial_type ON data_lake.fact_financial_transactions(transaction_type);

-- Analytics indexes
CREATE INDEX idx_hospital_metrics_date ON analytics.hospital_daily_metrics(metric_date);
CREATE INDEX idx_hospital_metrics_hospital ON analytics.hospital_daily_metrics(hospital_id);

CREATE INDEX idx_drug_usage_date ON analytics.drug_usage_patterns(analysis_date);
CREATE INDEX idx_drug_usage_hospital ON analytics.drug_usage_patterns(hospital_id);
CREATE INDEX idx_drug_usage_drug ON analytics.drug_usage_patterns(drug_id);

-- ML models indexes
CREATE INDEX idx_predictions_date ON ml_models.predictions(prediction_date);
CREATE INDEX idx_predictions_model ON ml_models.predictions(model_id);
CREATE INDEX idx_predictions_entity ON ml_models.predictions(entity_type, entity_id);

-- =====================================================
-- INITIAL ML MODEL REGISTRATION
-- =====================================================

INSERT INTO ml_models.model_registry (model_name, model_type, model_version, description, algorithm, parameters)
VALUES 
    ('Drug Demand Forecaster', 'FORECAST', '1.0.0', 'Predicts drug demand for next 30 days', 'ARIMA', '{"p": 1, "d": 1, "q": 1}'::jsonb),
    ('Patient Triage Bot', 'CLASSIFICATION', '1.0.0', 'Classifies patient urgency based on symptoms', 'Random Forest', '{"n_estimators": 100, "max_depth": 10}'::jsonb),
    ('Fraud Detector', 'ANOMALY', '1.0.0', 'Detects fraudulent billing patterns', 'Isolation Forest', '{"contamination": 0.1}'::jsonb),
    ('Patient Risk Scorer', 'CLASSIFICATION', '1.0.0', 'Calculates readmission risk', 'Logistic Regression', '{"C": 1.0, "solver": "liblinear"}'::jsonb)
ON CONFLICT DO NOTHING;

-- =====================================================
-- POPULATE TIME DIMENSION (2025 only for now)
-- =====================================================

INSERT INTO data_lake.dim_time (date_key, year, quarter, month, month_name, week, day_of_month, day_of_week, day_name, is_weekend)
SELECT 
    date_series::DATE as date_key,
    EXTRACT(YEAR FROM date_series) as year,
    EXTRACT(QUARTER FROM date_series) as quarter,
    EXTRACT(MONTH FROM date_series) as month,
    TO_CHAR(date_series, 'Month') as month_name,
    EXTRACT(WEEK FROM date_series) as week,
    EXTRACT(DAY FROM date_series) as day_of_month,
    EXTRACT(DOW FROM date_series) as day_of_week,
    TO_CHAR(date_series, 'Day') as day_name,
    EXTRACT(DOW FROM date_series) IN (0, 6) as is_weekend
FROM generate_series('2025-01-01'::DATE, '2025-12-31'::DATE, '1 day'::interval) as date_series
ON CONFLICT (date_key) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA data_lake TO PUBLIC;
GRANT USAGE ON SCHEMA analytics TO PUBLIC;
GRANT USAGE ON SCHEMA ml_models TO PUBLIC;

GRANT ALL ON ALL TABLES IN SCHEMA data_lake TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA ml_models TO PUBLIC;

GRANT ALL ON ALL SEQUENCES IN SCHEMA data_lake TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ml_models TO PUBLIC;
