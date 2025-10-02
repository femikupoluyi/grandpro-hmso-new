const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

// ============================================
// OPERATIONS COMMAND CENTRE
// ============================================

// Get multi-hospital overview
router.get('/command-centre/overview', async (req, res) => {
  try {
    const { org_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // Get all hospitals in the organization
    const hospitalsQuery = `
      SELECT h.*, 
        COUNT(DISTINCT p.id) as total_patients,
        COUNT(DISTINCT e.id) FILTER (WHERE DATE(e.encounter_date) = $1) as today_encounters,
        COUNT(DISTINCT e.id) FILTER (WHERE e.encounter_status = 'IN_PROGRESS') as active_encounters,
        COUNT(DISTINCT s.id) as total_staff,
        COUNT(DISTINCT ws.staff_id) FILTER (WHERE ws.schedule_date = $1) as staff_on_duty
      FROM hospitals h
      LEFT JOIN patients p ON p.hospital_id = h.id
      LEFT JOIN encounters e ON e.hospital_id = h.id
      LEFT JOIN staff s ON s.hospital_id = h.id AND s.is_active = true
      LEFT JOIN work_schedules ws ON ws.hospital_id = h.id
      WHERE h.is_active = true
      GROUP BY h.id`;

    const hospitals = await pool.query(hospitalsQuery, [today]);

    // Get aggregated financial metrics
    const financialQuery = `
      SELECT 
        SUM(b.total_amount) FILTER (WHERE b.bill_date = $1) as today_revenue,
        SUM(b.paid_amount) FILTER (WHERE b.bill_date = $1) as today_collected,
        SUM(b.balance_amount) FILTER (WHERE b.payment_status != 'PAID') as total_outstanding,
        COUNT(*) FILTER (WHERE b.bill_date = $1) as today_bills,
        AVG(CASE 
          WHEN b.payment_status = 'PAID' THEN 
            EXTRACT(DAY FROM (SELECT MAX(payment_date) FROM payments WHERE bill_id = b.id) - b.bill_date)
          ELSE NULL 
        END) as avg_payment_days
      FROM bills b
      WHERE b.hospital_id IN (SELECT id FROM hospitals WHERE is_active = true)`;

    const financial = await pool.query(financialQuery, [today]);

    // Get inventory alerts across all hospitals
    const inventoryAlertsQuery = `
      SELECT 
        h.name as hospital_name,
        COUNT(*) FILTER (WHERE i.current_stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE i.current_stock <= i.reorder_level AND i.current_stock > 0) as low_stock,
        COUNT(*) FILTER (WHERE i.current_stock > i.maximum_stock) as overstock
      FROM inventory_items i
      JOIN hospitals h ON h.id = i.hospital_id
      WHERE i.is_active = true
      GROUP BY h.id, h.name`;

    const inventoryAlerts = await pool.query(inventoryAlertsQuery);

    // Get critical alerts
    const alertsQuery = `
      SELECT 
        'INVENTORY' as alert_type,
        'OUT_OF_STOCK' as alert_level,
        h.name as hospital_name,
        i.item_name as details,
        'critical' as severity
      FROM inventory_items i
      JOIN hospitals h ON h.id = i.hospital_id
      WHERE i.current_stock = 0 AND i.is_active = true
      
      UNION ALL
      
      SELECT 
        'BILLING' as alert_type,
        'OVERDUE' as alert_level,
        h.name as hospital_name,
        CONCAT('Bill #', b.bill_number, ' - ', p.first_name, ' ', p.last_name) as details,
        'warning' as severity
      FROM bills b
      JOIN hospitals h ON h.id = b.hospital_id
      JOIN patients p ON p.id = b.patient_id
      WHERE b.payment_status = 'UNPAID' 
        AND b.bill_date < CURRENT_DATE - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'STAFF' as alert_type,
        'UNDERSTAFFED' as alert_level,
        h.name as hospital_name,
        CONCAT('Only ', COUNT(ws.id), ' staff scheduled') as details,
        'warning' as severity
      FROM hospitals h
      LEFT JOIN work_schedules ws ON ws.hospital_id = h.id AND ws.schedule_date = $1
      GROUP BY h.id, h.name
      HAVING COUNT(ws.id) < 10
      
      LIMIT 20`;

    const alerts = await pool.query(alertsQuery, [today]);

    res.json({
      success: true,
      data: {
        overview: {
          total_hospitals: hospitals.rows.length,
          total_patients: hospitals.rows.reduce((sum, h) => sum + parseInt(h.total_patients), 0),
          today_encounters: hospitals.rows.reduce((sum, h) => sum + parseInt(h.today_encounters), 0),
          active_encounters: hospitals.rows.reduce((sum, h) => sum + parseInt(h.active_encounters), 0),
          total_staff: hospitals.rows.reduce((sum, h) => sum + parseInt(h.total_staff), 0),
          staff_on_duty: hospitals.rows.reduce((sum, h) => sum + parseInt(h.staff_on_duty), 0)
        },
        financial_summary: financial.rows[0],
        hospitals: hospitals.rows,
        inventory_alerts: inventoryAlerts.rows,
        critical_alerts: alerts.rows
      }
    });
  } catch (error) {
    console.error('Error fetching command centre data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch command centre data',
      error: error.message
    });
  }
});

// Get hospital-specific KPIs
router.get('/kpis/:hospital_id', async (req, res) => {
  try {
    const { hospital_id } = req.params;
    const { period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Patient flow KPIs
    const patientKPIs = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as new_patients,
        COUNT(DISTINCT e.id) as total_encounters,
        AVG(CASE 
          WHEN e.encounter_type = 'INPATIENT' THEN 
            EXTRACT(DAY FROM COALESCE(e.updated_at, CURRENT_TIMESTAMP) - e.encounter_date)
          ELSE NULL 
        END) as avg_length_of_stay,
        COUNT(DISTINCT e.id) FILTER (WHERE e.encounter_type = 'EMERGENCY') * 100.0 / 
          NULLIF(COUNT(DISTINCT e.id), 0) as emergency_rate
      FROM patients p
      LEFT JOIN encounters e ON e.patient_id = p.id
      WHERE p.hospital_id = $1 
        AND p.created_at >= $2`,
      [hospital_id, startDate]
    );

    // Financial KPIs
    const financialKPIs = await pool.query(`
      SELECT 
        SUM(b.total_amount) as total_revenue,
        SUM(b.paid_amount) as total_collected,
        SUM(b.balance_amount) as outstanding_amount,
        AVG(b.paid_amount * 100.0 / NULLIF(b.total_amount, 0)) as collection_rate,
        COUNT(*) FILTER (WHERE b.payment_status = 'PAID') * 100.0 / 
          NULLIF(COUNT(*), 0) as payment_success_rate
      FROM bills b
      WHERE b.hospital_id = $1 
        AND b.bill_date >= $2`,
      [hospital_id, startDate]
    );

    // Operational KPIs
    const operationalKPIs = await pool.query(`
      SELECT 
        AVG(attendance_rate) as avg_staff_attendance,
        AVG(bed_occupancy) as avg_bed_occupancy,
        AVG(waiting_time) as avg_waiting_time
      FROM (
        SELECT 
          DATE(a.attendance_date) as date,
          COUNT(a.id) FILTER (WHERE a.attendance_status = 'PRESENT') * 100.0 / 
            NULLIF(COUNT(a.id), 0) as attendance_rate,
          dm.bed_occupancy_rate as bed_occupancy,
          dm.average_waiting_time_minutes as waiting_time
        FROM attendance a
        FULL OUTER JOIN daily_metrics dm ON dm.metric_date = DATE(a.attendance_date) 
          AND dm.hospital_id = $1
        WHERE a.hospital_id = $1 
          AND a.attendance_date >= $2
        GROUP BY DATE(a.attendance_date), dm.bed_occupancy_rate, dm.average_waiting_time_minutes
      ) as daily_stats`,
      [hospital_id, startDate]
    );

    // Quality KPIs
    const qualityKPIs = await pool.query(`
      SELECT 
        AVG(dp.patient_satisfaction) as avg_patient_satisfaction,
        AVG(dp.clinical_outcomes_score) as avg_clinical_score,
        AVG(dp.error_rate) as avg_error_rate,
        COUNT(DISTINCT cn.id) FILTER (WHERE cn.note_type = 'INCIDENT') as incident_count
      FROM department_performance dp
      LEFT JOIN clinical_notes cn ON cn.created_at >= $2
      WHERE dp.hospital_id = $1 
        AND dp.metric_year = EXTRACT(YEAR FROM CURRENT_DATE)
        AND dp.metric_month >= EXTRACT(MONTH FROM $2::date)
      GROUP BY dp.hospital_id`,
      [hospital_id, startDate]
    );

    res.json({
      success: true,
      data: {
        period_days: period,
        patient_flow: patientKPIs.rows[0],
        financial: financialKPIs.rows[0],
        operational: operationalKPIs.rows[0],
        quality: qualityKPIs.rows[0],
        trends: {
          revenue_trend: 'calculating...',
          patient_trend: 'calculating...',
          satisfaction_trend: 'calculating...'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs',
      error: error.message
    });
  }
});

// ============================================
// ALERTING SYSTEM
// ============================================

// Get active alerts
router.get('/alerts', async (req, res) => {
  try {
    const { hospital_id, severity, type } = req.query;

    let conditions = [];
    let values = [];
    let valueIndex = 1;

    if (hospital_id) {
      conditions.push(`hospital_id = $${valueIndex}`);
      values.push(hospital_id);
      valueIndex++;
    }

    if (severity) {
      conditions.push(`severity = $${valueIndex}`);
      values.push(severity);
      valueIndex++;
    }

    if (type) {
      conditions.push(`alert_type = $${valueIndex}`);
      values.push(type);
      valueIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // For now, we'll generate alerts dynamically
    const alertsQuery = `
      SELECT * FROM (
        -- Low stock alerts
        SELECT 
          gen_random_uuid() as id,
          'INVENTORY' as alert_type,
          'Low Stock Alert' as title,
          CONCAT(i.item_name, ' is running low (', i.current_stock, ' remaining)') as message,
          CASE 
            WHEN i.current_stock = 0 THEN 'critical'
            WHEN i.current_stock <= i.reorder_level / 2 THEN 'high'
            ELSE 'medium'
          END as severity,
          i.hospital_id,
          CURRENT_TIMESTAMP as created_at,
          'ACTIVE' as status
        FROM inventory_items i
        WHERE i.current_stock <= i.reorder_level AND i.is_active = true
        
        UNION ALL
        
        -- Overdue bills
        SELECT 
          gen_random_uuid() as id,
          'BILLING' as alert_type,
          'Overdue Payment' as title,
          CONCAT('Bill #', b.bill_number, ' is overdue by ', 
            CURRENT_DATE - b.due_date, ' days') as message,
          CASE 
            WHEN CURRENT_DATE - b.due_date > 60 THEN 'high'
            ELSE 'medium'
          END as severity,
          b.hospital_id,
          CURRENT_TIMESTAMP as created_at,
          'ACTIVE' as status
        FROM bills b
        WHERE b.payment_status = 'UNPAID' AND b.due_date < CURRENT_DATE
        
        UNION ALL
        
        -- Staff attendance issues
        SELECT 
          gen_random_uuid() as id,
          'STAFF' as alert_type,
          'Low Staff Attendance' as title,
          CONCAT('Only ', COUNT(*), ' staff present today') as message,
          'medium' as severity,
          a.hospital_id,
          CURRENT_TIMESTAMP as created_at,
          'ACTIVE' as status
        FROM attendance a
        WHERE a.attendance_date = CURRENT_DATE 
          AND a.attendance_status = 'PRESENT'
        GROUP BY a.hospital_id
        HAVING COUNT(*) < 20
      ) as alerts
      ${whereClause}
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        created_at DESC
      LIMIT 50`;

    const result = await pool.query(alertsQuery, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// Acknowledge alert
router.post('/alerts/:alert_id/acknowledge', async (req, res) => {
  try {
    const { alert_id } = req.params;
    const { notes, resolved } = req.body;

    // In a real system, we would update an alerts table
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: {
        alert_id,
        acknowledged_by: req.user?.id,
        acknowledged_at: new Date(),
        notes,
        status: resolved ? 'RESOLVED' : 'ACKNOWLEDGED'
      }
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message
    });
  }
});

// ============================================
// PROJECT MANAGEMENT
// ============================================

// Get projects
router.get('/projects', async (req, res) => {
  try {
    const { hospital_id, status } = req.query;

    // Mock project data for now
    const projects = [
      {
        id: '1',
        name: 'ICU Expansion',
        hospital_id: hospital_id || 'hosp-001',
        type: 'INFRASTRUCTURE',
        status: 'IN_PROGRESS',
        start_date: '2025-01-01',
        end_date: '2025-06-30',
        budget: 50000000,
        spent: 15000000,
        progress: 30,
        manager: 'Dr. Adewale Ogundimu',
        description: 'Expansion of ICU capacity from 10 to 25 beds',
        milestones: [
          { name: 'Planning Complete', status: 'COMPLETED', date: '2025-01-15' },
          { name: 'Construction Started', status: 'COMPLETED', date: '2025-02-01' },
          { name: 'Equipment Procurement', status: 'IN_PROGRESS', date: '2025-03-15' },
          { name: 'Staff Training', status: 'PENDING', date: '2025-05-01' }
        ]
      },
      {
        id: '2',
        name: 'EHR System Upgrade',
        hospital_id: hospital_id || 'hosp-001',
        type: 'IT',
        status: 'PLANNING',
        start_date: '2025-02-01',
        end_date: '2025-04-30',
        budget: 5000000,
        spent: 500000,
        progress: 10,
        manager: 'Chinedu Okafor',
        description: 'Upgrade to latest EHR system with AI capabilities'
      },
      {
        id: '3',
        name: 'Radiology Department Renovation',
        hospital_id: hospital_id || 'hosp-001',
        type: 'RENOVATION',
        status: 'PENDING',
        start_date: '2025-03-01',
        end_date: '2025-08-31',
        budget: 25000000,
        spent: 0,
        progress: 0,
        manager: 'Fatima Abdullahi',
        description: 'Complete renovation of radiology department including new MRI machine'
      }
    ];

    const filteredProjects = status 
      ? projects.filter(p => p.status === status)
      : projects;

    res.json({
      success: true,
      data: filteredProjects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// Create project
router.post('/projects', async (req, res) => {
  try {
    const {
      name, hospital_id, type, start_date, end_date,
      budget, manager, description
    } = req.body;

    // In a real system, we would insert into a projects table
    const newProject = {
      id: Date.now().toString(),
      name,
      hospital_id,
      type,
      status: 'PLANNING',
      start_date,
      end_date,
      budget,
      spent: 0,
      progress: 0,
      manager,
      description,
      created_by: req.user?.id,
      created_at: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// Update project progress
router.put('/projects/:project_id/progress', async (req, res) => {
  try {
    const { project_id } = req.params;
    const { progress, milestone_updates, notes } = req.body;

    // In a real system, we would update the projects table
    res.json({
      success: true,
      message: 'Project progress updated successfully',
      data: {
        project_id,
        progress,
        milestone_updates,
        notes,
        updated_by: req.user?.id,
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project progress',
      error: error.message
    });
  }
});

// ============================================
// PERFORMANCE ANALYTICS
// ============================================

// Get comparative analytics across hospitals
router.get('/analytics/comparative', async (req, res) => {
  try {
    const { metric, period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get comparative data for all hospitals
    const comparativeQuery = `
      SELECT 
        h.id,
        h.name,
        COUNT(DISTINCT p.id) as patient_count,
        COUNT(DISTINCT e.id) as encounter_count,
        SUM(b.total_amount) as total_revenue,
        AVG(b.paid_amount * 100.0 / NULLIF(b.total_amount, 0)) as collection_rate,
        AVG(dm.bed_occupancy_rate) as avg_occupancy,
        AVG(dm.patient_satisfaction_score) as avg_satisfaction
      FROM hospitals h
      LEFT JOIN patients p ON p.hospital_id = h.id AND p.created_at >= $1
      LEFT JOIN encounters e ON e.hospital_id = h.id AND e.encounter_date >= $1
      LEFT JOIN bills b ON b.hospital_id = h.id AND b.bill_date >= $1
      LEFT JOIN daily_metrics dm ON dm.hospital_id = h.id AND dm.metric_date >= $1
      WHERE h.is_active = true
      GROUP BY h.id, h.name
      ORDER BY total_revenue DESC`;

    const result = await pool.query(comparativeQuery, [startDate]);

    res.json({
      success: true,
      data: {
        period_days: period,
        hospitals: result.rows,
        best_performers: {
          revenue: result.rows[0]?.name,
          patient_count: result.rows.reduce((max, h) => 
            h.patient_count > max.patient_count ? h : max, result.rows[0])?.name,
          satisfaction: result.rows.reduce((max, h) => 
            h.avg_satisfaction > max.avg_satisfaction ? h : max, result.rows[0])?.name
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparative analytics',
      error: error.message
    });
  }
});

// Get predictive analytics
router.get('/analytics/predictive', async (req, res) => {
  try {
    const { hospital_id, metric } = req.query;

    // Mock predictive data for demonstration
    const predictions = {
      patient_volume: {
        next_7_days: Math.floor(Math.random() * 100) + 200,
        next_30_days: Math.floor(Math.random() * 500) + 800,
        trend: 'increasing',
        confidence: 0.85
      },
      revenue_forecast: {
        next_month: Math.floor(Math.random() * 5000000) + 10000000,
        next_quarter: Math.floor(Math.random() * 20000000) + 40000000,
        trend: 'stable',
        confidence: 0.78
      },
      stock_depletion: {
        critical_items: [
          { item: 'Paracetamol 500mg', days_until_depletion: 5 },
          { item: 'Surgical Gloves', days_until_depletion: 8 },
          { item: 'Insulin', days_until_depletion: 12 }
        ]
      },
      bed_occupancy: {
        next_week_avg: 75 + Math.floor(Math.random() * 20),
        peak_day: 'Wednesday',
        recommended_staff: 45
      }
    };

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching predictive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictive analytics',
      error: error.message
    });
  }
});

module.exports = router;
