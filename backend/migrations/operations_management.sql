-- Operations Management Database Schema
-- For Command Centre, Alerts, and Project Management

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- inventory, occupancy, revenue, wait_time, etc.
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  hospital_id UUID REFERENCES hospitals(id),
  threshold_value NUMERIC,
  current_value NUMERIC,
  auto_resolve BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  created_by INTEGER REFERENCES users(id)
);

-- Alert Configurations Table
CREATE TABLE IF NOT EXISTS alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) UNIQUE NOT NULL,
  critical_threshold NUMERIC,
  warning_threshold NUMERIC,
  enabled BOOLEAN DEFAULT true,
  check_interval_minutes INTEGER DEFAULT 15,
  notification_channels JSONB DEFAULT '["dashboard", "email"]',
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'expansion' CHECK (type IN ('expansion', 'renovation', 'equipment', 'it_upgrade', 'maintenance', 'other')),
  hospital_id UUID REFERENCES hospitals(id),
  budget NUMERIC(15, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  project_manager_id INTEGER REFERENCES users(id),
  objectives JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Tasks Table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  dependencies UUID[], -- Array of task IDs this task depends on
  estimated_hours NUMERIC(5, 2),
  actual_hours NUMERIC(5, 2),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  deliverables JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Team Table
CREATE TABLE IF NOT EXISTS project_team (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(100),
  responsibilities JSONB DEFAULT '[]',
  allocation_percentage INTEGER DEFAULT 100, -- Percentage of time allocated to this project
  joined_date DATE DEFAULT CURRENT_DATE,
  left_date DATE,
  PRIMARY KEY (project_id, user_id)
);

-- Project Expenses Table
CREATE TABLE IF NOT EXISTS project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(100),
  description TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  vendor VARCHAR(255),
  invoice_number VARCHAR(100),
  receipt_url VARCHAR(500),
  approved BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id),
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operations Metrics Table (for historical tracking)
CREATE TABLE IF NOT EXISTS operations_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  metric_date DATE NOT NULL,
  patient_inflow INTEGER,
  emergency_cases INTEGER,
  outpatient_visits INTEGER,
  inpatient_admissions INTEGER,
  bed_occupancy_rate NUMERIC(5, 2),
  avg_wait_time_minutes INTEGER,
  revenue_generated NUMERIC(15, 2),
  expenses_incurred NUMERIC(15, 2),
  staff_utilization_rate NUMERIC(5, 2),
  patient_satisfaction_score NUMERIC(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hospital_id, metric_date)
);

-- Command Centre Views Table (for saved dashboard configurations)
CREATE TABLE IF NOT EXISTS command_centre_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  is_default BOOLEAN DEFAULT false,
  configuration JSONB NOT NULL, -- Stores widget layouts, filters, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to hospitals table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'revenue_target_daily') THEN
    ALTER TABLE hospitals ADD COLUMN revenue_target_daily NUMERIC(15, 2) DEFAULT 500000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'operational_hours') THEN
    ALTER TABLE hospitals ADD COLUMN operational_hours JSONB DEFAULT '{"monday": "08:00-20:00", "tuesday": "08:00-20:00", "wednesday": "08:00-20:00", "thursday": "08:00-20:00", "friday": "08:00-20:00", "saturday": "09:00-16:00", "sunday": "09:00-14:00"}';
  END IF;
END $$;

-- Add columns to hr_staff table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_staff' AND column_name = 'performance_score') THEN
    ALTER TABLE hr_staff ADD COLUMN performance_score NUMERIC(3, 1) DEFAULT 85.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_staff' AND column_name = 'patients_seen_today') THEN
    ALTER TABLE hr_staff ADD COLUMN patients_seen_today INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_staff' AND column_name = 'satisfaction_rating') THEN
    ALTER TABLE hr_staff ADD COLUMN satisfaction_rating NUMERIC(2, 1) DEFAULT 4.5;
  END IF;
END $$;

-- Add columns to emr_patients table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emr_patients' AND column_name = 'visit_type') THEN
    ALTER TABLE emr_patients ADD COLUMN visit_type VARCHAR(20) DEFAULT 'outpatient';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emr_patients' AND column_name = 'satisfaction_score') THEN
    ALTER TABLE emr_patients ADD COLUMN satisfaction_score NUMERIC(2, 1);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_hospital_status ON system_alerts(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_hospital ON projects(hospital_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_metrics_hospital_date ON operations_metrics(hospital_id, metric_date DESC);

-- Insert default alert configurations
INSERT INTO alert_configurations (category, critical_threshold, warning_threshold, enabled) VALUES
  ('low_stock', 10, 25, true),
  ('high_occupancy', 95, 85, true),
  ('revenue_gap', -30, -15, true),
  ('wait_time', 120, 60, true),
  ('staff_utilization', 95, 85, true)
ON CONFLICT (category) DO NOTHING;

-- Insert sample projects for demonstration
INSERT INTO projects (
  name, description, type, hospital_id, budget, 
  start_date, end_date, status, priority, 
  objectives, deliverables
) VALUES
  (
    'Emergency Ward Expansion',
    'Expand emergency department capacity by 50% to handle increased patient load',
    'expansion',
    (SELECT id FROM hospitals WHERE name LIKE '%Lagos University%' LIMIT 1),
    75000000,
    '2025-10-01',
    '2026-03-31',
    'in_progress',
    'high',
    '["Increase emergency capacity by 50%", "Reduce wait times", "Improve patient flow"]'::jsonb,
    '["20 new emergency beds", "2 new trauma rooms", "Updated triage area"]'::jsonb
  ),
  (
    'Digital X-Ray System Upgrade',
    'Replace analog X-ray systems with digital radiography equipment',
    'equipment',
    (SELECT id FROM hospitals WHERE name LIKE '%St. Nicholas%' LIMIT 1),
    25000000,
    '2025-09-15',
    '2025-12-15',
    'in_progress',
    'medium',
    '["Modernize radiology department", "Improve diagnostic accuracy", "Reduce film costs"]'::jsonb,
    '["3 digital X-ray machines", "PACS integration", "Staff training completed"]'::jsonb
  ),
  (
    'Patient Records Digitization',
    'Convert paper records to electronic medical records system',
    'it_upgrade',
    (SELECT id FROM hospitals WHERE name LIKE '%National Hospital%' LIMIT 1),
    15000000,
    '2025-08-01',
    '2025-11-30',
    'in_progress',
    'high',
    '["Digitize 100% of patient records", "Implement EMR access controls", "Train all staff"]'::jsonb,
    '["EMR system deployed", "Historical records digitized", "Staff training materials"]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Function to generate daily operations metrics
CREATE OR REPLACE FUNCTION generate_operations_metrics()
RETURNS void AS $$
DECLARE
  hosp RECORD;
  metric_date DATE;
BEGIN
  -- Generate metrics for the last 30 days
  FOR hosp IN SELECT id, bed_capacity FROM hospitals WHERE status = 'active' LOOP
    FOR i IN 0..29 LOOP
      metric_date := CURRENT_DATE - i;
      
      INSERT INTO operations_metrics (
        hospital_id, metric_date, patient_inflow, emergency_cases,
        outpatient_visits, inpatient_admissions, bed_occupancy_rate,
        avg_wait_time_minutes, revenue_generated, expenses_incurred,
        staff_utilization_rate, patient_satisfaction_score
      ) VALUES (
        hosp.id,
        metric_date,
        50 + FLOOR(RANDOM() * 100), -- patient_inflow
        5 + FLOOR(RANDOM() * 20),   -- emergency_cases
        30 + FLOOR(RANDOM() * 70),  -- outpatient_visits
        10 + FLOOR(RANDOM() * 30),  -- inpatient_admissions
        60 + FLOOR(RANDOM() * 35),  -- bed_occupancy_rate
        15 + FLOOR(RANDOM() * 45),  -- avg_wait_time_minutes
        300000 + FLOOR(RANDOM() * 700000), -- revenue_generated
        200000 + FLOOR(RANDOM() * 400000), -- expenses_incurred
        70 + FLOOR(RANDOM() * 25),  -- staff_utilization_rate
        3.5 + (RANDOM() * 1.5)       -- patient_satisfaction_score
      )
      ON CONFLICT (hospital_id, metric_date) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate sample metrics
SELECT generate_operations_metrics();

-- Create a view for real-time command centre dashboard
CREATE OR REPLACE VIEW command_centre_realtime AS
SELECT 
  h.id as hospital_id,
  h.name as hospital_name,
  h.state,
  h.bed_capacity,
  -- Current metrics
  (SELECT COUNT(*) FROM emr_admissions WHERE hospital_id = h.id::text AND discharge_date IS NULL) as current_admissions,
  (SELECT COUNT(*) FROM emr_patients WHERE hospital_id = h.id::text AND DATE(created_at) = CURRENT_DATE) as patients_today,
  (SELECT COALESCE(SUM(amount), 0) FROM billing_invoices WHERE hospital_id = h.id::text AND DATE(created_at) = CURRENT_DATE) as revenue_today,
  (SELECT COUNT(*) FROM hr_staff WHERE hospital_id = h.id::text AND status = 'active') as active_staff,
  -- Calculated metrics
  CASE 
    WHEN h.bed_capacity > 0 THEN 
      ROUND(((SELECT COUNT(*) FROM emr_admissions WHERE hospital_id = h.id::text AND discharge_date IS NULL)::numeric / h.bed_capacity * 100), 1)
    ELSE 0
  END as occupancy_rate,
  -- Alert counts
  (SELECT COUNT(*) FROM system_alerts WHERE hospital_id = h.id AND status = 'active' AND severity = 'critical') as critical_alerts,
  (SELECT COUNT(*) FROM system_alerts WHERE hospital_id = h.id AND status = 'active' AND severity = 'warning') as warning_alerts,
  -- Project status
  (SELECT COUNT(*) FROM projects WHERE hospital_id = h.id AND status = 'in_progress') as active_projects
FROM hospitals h
WHERE h.status = 'active';

GRANT SELECT ON command_centre_realtime TO PUBLIC;
