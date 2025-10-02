-- Operations Command Centre and Project Management Tables

-- Operations Alerts Table
CREATE TABLE IF NOT EXISTS operations_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- low_stock, performance_anomaly, revenue_gap, system_issue
    severity VARCHAR(20) NOT NULL, -- critical, warning, info
    hospital_id UUID REFERENCES hospitals(id),
    message TEXT NOT NULL,
    threshold_value DECIMAL,
    current_value DECIMAL,
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved
    metadata JSONB,
    occurrence_count INTEGER DEFAULT 1,
    acknowledged_by UUID REFERENCES staff(id),
    acknowledged_at TIMESTAMP,
    resolved_by UUID REFERENCES staff(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hospital Projects Table (for expansion and development)
CREATE TABLE IF NOT EXISTS hospital_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- expansion, renovation, technology, equipment, training
    priority VARCHAR(20), -- critical, high, medium, low
    status VARCHAR(20) DEFAULT 'planning', -- planning, approved, active, on_hold, completed, cancelled
    budget DECIMAL(15, 2),
    allocated_budget DECIMAL(15, 2) DEFAULT 0,
    spent_budget DECIMAL(15, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    completion_date DATE,
    project_manager_id UUID REFERENCES staff(id),
    approval_status VARCHAR(20),
    approved_by UUID REFERENCES staff(id),
    approved_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, delayed
    completion_percentage INTEGER DEFAULT 0,
    dependencies JSONB, -- Array of milestone IDs this depends on
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Project Tasks
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES staff(id),
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, blocked
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Team Members
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id),
    role VARCHAR(100), -- Project Manager, Developer, Analyst, etc.
    allocation_percentage INTEGER DEFAULT 100, -- Percentage of time allocated
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, staff_id)
);

-- Project Expenses
CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    category VARCHAR(50), -- materials, labor, equipment, services, other
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, rejected
    approved_by UUID REFERENCES staff(id),
    approved_date TIMESTAMP,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Project Documents
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    document_type VARCHAR(50), -- proposal, contract, report, invoice, other
    title VARCHAR(255),
    description TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Project Timeline/Activity Log
CREATE TABLE IF NOT EXISTS project_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    event_type VARCHAR(50), -- project_created, status_change, milestone_completed, task_completed, expense_added
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Project Risks
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES hospital_projects(id) ON DELETE CASCADE,
    risk_type VARCHAR(50), -- budget, timeline, resource, technical, external
    description TEXT,
    severity VARCHAR(20), -- high, medium, low
    likelihood VARCHAR(20), -- high, medium, low
    impact TEXT,
    mitigation_plan TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, mitigated, resolved, accepted
    identified_by UUID REFERENCES staff(id),
    identified_date DATE DEFAULT CURRENT_DATE,
    resolved_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Metrics Table (for tracking KPIs)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    metric_type VARCHAR(50), -- patient_satisfaction, staff_productivity, revenue_per_patient, etc.
    metric_value DECIMAL,
    metric_date DATE,
    period_type VARCHAR(20), -- daily, weekly, monthly, quarterly
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Command Centre Dashboard Configurations
CREATE TABLE IF NOT EXISTS dashboard_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    dashboard_type VARCHAR(50), -- operations, executive, clinical, financial
    config_name VARCHAR(100),
    widgets JSONB, -- Array of widget configurations
    layout JSONB, -- Grid layout configuration
    filters JSONB, -- Default filters
    refresh_interval INTEGER DEFAULT 300, -- Seconds
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alert Rules Configuration
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50), -- threshold, trend, anomaly, scheduled
    metric_type VARCHAR(50),
    condition JSONB, -- Complex condition configuration
    threshold_value DECIMAL,
    comparison_operator VARCHAR(10), -- >, <, >=, <=, =, !=
    severity VARCHAR(20),
    notification_channels JSONB, -- email, sms, push, dashboard
    recipients JSONB, -- Array of user IDs or roles
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alert Notifications Log
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES operations_alerts(id),
    channel VARCHAR(20), -- email, sms, push, dashboard
    recipient_id UUID REFERENCES users(id),
    recipient_contact VARCHAR(255), -- email or phone
    status VARCHAR(20), -- sent, failed, pending
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Expansion Analysis Table
CREATE TABLE IF NOT EXISTS expansion_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    analysis_date DATE DEFAULT CURRENT_DATE,
    current_capacity INTEGER,
    projected_demand INTEGER,
    occupancy_trend JSONB,
    revenue_trend JSONB,
    market_analysis JSONB,
    competition_analysis JSONB,
    recommendations JSONB,
    roi_projection DECIMAL,
    payback_period_months INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_alerts_hospital_status ON operations_alerts(hospital_id, status);
CREATE INDEX idx_alerts_severity_created ON operations_alerts(severity, created_at);
CREATE INDEX idx_projects_hospital_status ON hospital_projects(hospital_id, status);
CREATE INDEX idx_projects_manager ON hospital_projects(project_manager_id);
CREATE INDEX idx_tasks_project_status ON project_tasks(project_id, status);
CREATE INDEX idx_tasks_assigned ON project_tasks(assigned_to, status);
CREATE INDEX idx_milestones_project ON project_milestones(project_id, status);
CREATE INDEX idx_metrics_hospital_date ON performance_metrics(hospital_id, metric_date);
CREATE INDEX idx_timeline_project ON project_timeline(project_id, created_at);

-- Add check constraints
ALTER TABLE operations_alerts ADD CONSTRAINT check_alert_severity 
    CHECK (severity IN ('critical', 'warning', 'info'));
    
ALTER TABLE hospital_projects ADD CONSTRAINT check_project_priority 
    CHECK (priority IN ('critical', 'high', 'medium', 'low'));
    
ALTER TABLE hospital_projects ADD CONSTRAINT check_project_status 
    CHECK (status IN ('planning', 'approved', 'active', 'on_hold', 'completed', 'cancelled'));

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alerts_timestamp
    BEFORE UPDATE ON operations_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_timestamp
    BEFORE UPDATE ON hospital_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_dashboard_configs_timestamp
    BEFORE UPDATE ON dashboard_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
