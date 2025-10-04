const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple auth middleware for now
const authenticateToken = (req, res, next) => {
  // For demo purposes, we'll allow all requests
  req.user = { id: 1, role: 'admin' };
  next();
};

/**
 * Operations Command Centre API
 * Provides centralized monitoring and control across all hospitals
 */

// Get aggregated metrics across all hospitals
router.get('/metrics/aggregate', authenticateToken, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    // Get date range based on period
    let dateFilter = '';
    switch(period) {
      case 'today':
        dateFilter = "DATE(created_at) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "DATE(created_at) = CURRENT_DATE";
    }

    // Aggregate patient inflows
    const patientInflowQuery = `
      SELECT 
        h.id as hospital_id,
        h.name as hospital_name,
        COUNT(DISTINCT p.id) as total_patients,
        COUNT(CASE WHEN p.created_at >= CURRENT_DATE THEN 1 END) as new_patients_today,
        COUNT(CASE WHEN p.visit_type = 'emergency' THEN 1 END) as emergency_cases,
        COUNT(CASE WHEN p.visit_type = 'outpatient' THEN 1 END) as outpatient_visits,
        COUNT(CASE WHEN p.visit_type = 'inpatient' THEN 1 END) as inpatient_admissions
      FROM hospitals h
      LEFT JOIN (
        SELECT DISTINCT ON (patient_id) *
        FROM emr_patients
        WHERE ${dateFilter}
      ) p ON TRUE
      GROUP BY h.id, h.name
      ORDER BY h.name
    `;

    // Aggregate admissions data
    const admissionsQuery = `
      SELECT 
        h.id as hospital_id,
        h.name as hospital_name,
        h.bed_capacity,
        COUNT(DISTINCT a.id) as current_admissions,
        ROUND((COUNT(DISTINCT a.id)::numeric / NULLIF(h.bed_capacity, 0) * 100), 1) as occupancy_rate,
        AVG(CASE WHEN a.discharge_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (a.discharge_date - a.admission_date))/86400 
          ELSE NULL END)::numeric(10,1) as avg_length_of_stay
      FROM hospitals h
      LEFT JOIN (
        SELECT * FROM emr_admissions 
        WHERE discharge_date IS NULL OR discharge_date >= CURRENT_DATE - INTERVAL '30 days'
      ) a ON h.id = a.hospital_id::uuid
      WHERE h.status = 'active'
      GROUP BY h.id, h.name, h.bed_capacity
    `;

    // Aggregate staff KPIs
    const staffKPIsQuery = `
      SELECT 
        h.id as hospital_id,
        h.name as hospital_name,
        COUNT(DISTINCT s.id) as total_staff,
        COUNT(DISTINCT CASE WHEN s.role = 'doctor' THEN s.id END) as doctors,
        COUNT(DISTINCT CASE WHEN s.role = 'nurse' THEN s.id END) as nurses,
        AVG(s.performance_score) as avg_performance_score,
        SUM(s.patients_seen_today) as total_patients_seen,
        ROUND(AVG(s.satisfaction_rating), 2) as avg_satisfaction
      FROM hospitals h
      LEFT JOIN (
        SELECT 
          id, 
          hospital_id, 
          role,
          COALESCE(performance_score, 85) as performance_score,
          COALESCE(patients_seen_today, 0) as patients_seen_today,
          COALESCE(satisfaction_rating, 4.5) as satisfaction_rating
        FROM hr_staff
      ) s ON h.id = s.hospital_id::uuid
      WHERE h.status = 'active'
      GROUP BY h.id, h.name
    `;

    // Aggregate financial summaries
    const financialQuery = `
      SELECT 
        h.id as hospital_id,
        h.name as hospital_name,
        COALESCE(SUM(b.amount), 0) as revenue_today,
        COALESCE(SUM(CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN b.amount END), 0) as revenue_week,
        COALESCE(SUM(CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN b.amount END), 0) as revenue_month,
        COUNT(DISTINCT b.id) as total_transactions,
        COALESCE(AVG(b.amount), 0) as avg_transaction_value,
        COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_payments
      FROM hospitals h
      LEFT JOIN billing_invoices b ON h.id = b.hospital_id::uuid
      WHERE h.status = 'active'
      GROUP BY h.id, h.name
    `;

    // Execute all queries in parallel
    const [patientData, admissionsData, staffData, financialData] = await Promise.all([
      pool.query(patientInflowQuery),
      pool.query(admissionsQuery),
      pool.query(staffKPIsQuery),
      pool.query(financialQuery)
    ]);

    // Combine all metrics
    const hospitals = {};
    
    // Process patient data
    patientData.rows.forEach(row => {
      hospitals[row.hospital_id] = {
        hospital_id: row.hospital_id,
        hospital_name: row.hospital_name,
        patient_metrics: {
          total_patients: parseInt(row.total_patients) || 0,
          new_patients_today: parseInt(row.new_patients_today) || 0,
          emergency_cases: parseInt(row.emergency_cases) || 0,
          outpatient_visits: parseInt(row.outpatient_visits) || 0,
          inpatient_admissions: parseInt(row.inpatient_admissions) || 0
        }
      };
    });

    // Add admissions data
    admissionsData.rows.forEach(row => {
      if (hospitals[row.hospital_id]) {
        hospitals[row.hospital_id].admission_metrics = {
          bed_capacity: parseInt(row.bed_capacity) || 0,
          current_admissions: parseInt(row.current_admissions) || 0,
          occupancy_rate: parseFloat(row.occupancy_rate) || 0,
          avg_length_of_stay: parseFloat(row.avg_length_of_stay) || 0
        };
      }
    });

    // Add staff KPIs
    staffData.rows.forEach(row => {
      if (hospitals[row.hospital_id]) {
        hospitals[row.hospital_id].staff_metrics = {
          total_staff: parseInt(row.total_staff) || 0,
          doctors: parseInt(row.doctors) || 0,
          nurses: parseInt(row.nurses) || 0,
          avg_performance_score: parseFloat(row.avg_performance_score) || 0,
          total_patients_seen: parseInt(row.total_patients_seen) || 0,
          avg_satisfaction: parseFloat(row.avg_satisfaction) || 0
        };
      }
    });

    // Add financial data
    financialData.rows.forEach(row => {
      if (hospitals[row.hospital_id]) {
        hospitals[row.hospital_id].financial_metrics = {
          revenue_today: parseFloat(row.revenue_today) || 0,
          revenue_week: parseFloat(row.revenue_week) || 0,
          revenue_month: parseFloat(row.revenue_month) || 0,
          total_transactions: parseInt(row.total_transactions) || 0,
          avg_transaction_value: parseFloat(row.avg_transaction_value) || 0,
          pending_payments: parseInt(row.pending_payments) || 0
        };
      }
    });

    // Calculate system-wide totals
    const systemTotals = {
      total_hospitals: Object.keys(hospitals).length,
      total_patients: Object.values(hospitals).reduce((sum, h) => sum + (h.patient_metrics?.total_patients || 0), 0),
      total_staff: Object.values(hospitals).reduce((sum, h) => sum + (h.staff_metrics?.total_staff || 0), 0),
      total_revenue_month: Object.values(hospitals).reduce((sum, h) => sum + (h.financial_metrics?.revenue_month || 0), 0),
      avg_occupancy: Object.values(hospitals).reduce((sum, h) => sum + (h.admission_metrics?.occupancy_rate || 0), 0) / Object.keys(hospitals).length || 0
    };

    res.json({
      status: 'success',
      period,
      timestamp: new Date().toISOString(),
      system_totals: systemTotals,
      hospitals: Object.values(hospitals)
    });

  } catch (error) {
    console.error('Command Centre Metrics Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch aggregated metrics',
      error: error.message
    });
  }
});

// Real-time dashboard data
router.get('/dashboard/realtime', authenticateToken, async (req, res) => {
  try {
    const metricsQuery = `
      WITH current_stats AS (
        SELECT 
          (SELECT COUNT(*) FROM hospitals WHERE status = 'active') as active_hospitals,
          (SELECT COUNT(*) FROM emr_patients WHERE DATE(created_at) = CURRENT_DATE) as patients_today,
          (SELECT COUNT(*) FROM emr_admissions WHERE discharge_date IS NULL) as current_admissions,
          (SELECT COUNT(*) FROM hr_staff WHERE status = 'active') as active_staff,
          (SELECT COALESCE(SUM(amount), 0) FROM billing_invoices WHERE DATE(created_at) = CURRENT_DATE) as revenue_today,
          (SELECT COUNT(*) FROM inventory_items WHERE quantity < reorder_level) as low_stock_items
      )
      SELECT * FROM current_stats
    `;

    const result = await pool.query(metricsQuery);
    const stats = result.rows[0];

    // Get recent activities
    const activitiesQuery = `
      SELECT 
        'admission' as type,
        'New patient admitted' as description,
        created_at as timestamp,
        hospital_id
      FROM emr_admissions
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      UNION ALL
      SELECT 
        'billing' as type,
        'Invoice generated: ₦' || amount as description,
        created_at as timestamp,
        hospital_id
      FROM billing_invoices
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    const activities = await pool.query(activitiesQuery);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      metrics: {
        active_hospitals: parseInt(stats.active_hospitals),
        patients_today: parseInt(stats.patients_today),
        current_admissions: parseInt(stats.current_admissions),
        active_staff: parseInt(stats.active_staff),
        revenue_today: parseFloat(stats.revenue_today),
        low_stock_items: parseInt(stats.low_stock_items)
      },
      recent_activities: activities.rows,
      refresh_interval: 30000 // 30 seconds
    });

  } catch (error) {
    console.error('Realtime Dashboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch realtime dashboard data',
      error: error.message
    });
  }
});

// Get performance comparison across hospitals
router.get('/performance/comparison', authenticateToken, async (req, res) => {
  try {
    const comparisonQuery = `
      SELECT 
        h.id,
        h.name,
        h.state,
        h.bed_capacity,
        -- Patient metrics
        COUNT(DISTINCT p.id) as total_patients,
        ROUND(AVG(p.satisfaction_score), 2) as patient_satisfaction,
        -- Financial metrics
        COALESCE(SUM(b.amount), 0) as total_revenue,
        COALESCE(AVG(b.amount), 0) as avg_billing,
        -- Operational metrics
        ROUND((COUNT(DISTINCT a.id)::numeric / NULLIF(h.bed_capacity, 0) * 100), 1) as occupancy_rate,
        COUNT(DISTINCT s.id) as staff_count,
        ROUND(COUNT(DISTINCT p.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0), 1) as patient_staff_ratio,
        -- Performance score calculation
        ROUND((
          COALESCE(AVG(p.satisfaction_score) * 20, 0) +
          (CASE WHEN COUNT(DISTINCT p.id) > 100 THEN 20 ELSE COUNT(DISTINCT p.id) * 0.2 END) +
          (CASE WHEN COALESCE(SUM(b.amount), 0) > 1000000 THEN 20 ELSE COALESCE(SUM(b.amount), 0) / 50000 END) +
          (CASE WHEN (COUNT(DISTINCT a.id)::numeric / NULLIF(h.bed_capacity, 0) * 100) > 70 THEN 20 ELSE (COUNT(DISTINCT a.id)::numeric / NULLIF(h.bed_capacity, 0)) END) +
          20
        ), 2) as performance_score
      FROM hospitals h
      LEFT JOIN emr_patients p ON h.id = p.hospital_id::uuid
      LEFT JOIN billing_invoices b ON h.id = b.hospital_id::uuid AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN emr_admissions a ON h.id = a.hospital_id::uuid AND a.discharge_date IS NULL
      LEFT JOIN hr_staff s ON h.id = s.hospital_id::uuid AND s.status = 'active'
      WHERE h.status = 'active'
      GROUP BY h.id, h.name, h.state, h.bed_capacity
      ORDER BY performance_score DESC
    `;

    const result = await pool.query(comparisonQuery);

    // Calculate rankings
    const hospitals = result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      total_revenue: parseFloat(row.total_revenue),
      avg_billing: parseFloat(row.avg_billing),
      performance_score: parseFloat(row.performance_score),
      occupancy_rate: parseFloat(row.occupancy_rate),
      patient_staff_ratio: parseFloat(row.patient_staff_ratio)
    }));

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      total_hospitals: hospitals.length,
      performance_data: hospitals,
      top_performer: hospitals[0],
      average_performance: hospitals.reduce((sum, h) => sum + h.performance_score, 0) / hospitals.length
    });

  } catch (error) {
    console.error('Performance Comparison Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance comparison',
      error: error.message
    });
  }
});

// Get specific hospital command centre view
router.get('/hospital/:hospitalId', authenticateToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { timeRange = '24h' } = req.query;

    // Map time range to interval
    const intervalMap = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };
    const interval = intervalMap[timeRange] || '24 hours';

    // Get comprehensive hospital metrics
    const query = `
      WITH hospital_metrics AS (
        SELECT 
          h.id,
          h.name,
          h.state,
          h.city,
          h.bed_capacity,
          h.status,
          -- Current occupancy
          (SELECT COUNT(*) FROM emr_admissions WHERE hospital_id = h.id::text AND discharge_date IS NULL) as current_occupancy,
          -- Staff on duty
          (SELECT COUNT(*) FROM hr_staff WHERE hospital_id = h.id::text AND status = 'active') as staff_on_duty,
          -- Today's metrics
          (SELECT COUNT(*) FROM emr_patients WHERE hospital_id = h.id::text AND DATE(created_at) = CURRENT_DATE) as patients_today,
          (SELECT COALESCE(SUM(amount), 0) FROM billing_invoices WHERE hospital_id = h.id::text AND DATE(created_at) = CURRENT_DATE) as revenue_today,
          -- Period metrics
          (SELECT COUNT(*) FROM emr_patients WHERE hospital_id = h.id::text AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}') as patients_period,
          (SELECT COALESCE(SUM(amount), 0) FROM billing_invoices WHERE hospital_id = h.id::text AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}') as revenue_period
        FROM hospitals h
        WHERE h.id = $1
      )
      SELECT * FROM hospital_metrics
    `;

    const hospitalData = await pool.query(query, [hospitalId]);

    if (hospitalData.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found'
      });
    }

    const hospital = hospitalData.rows[0];

    // Get department-wise statistics
    const departmentQuery = `
      SELECT 
        department,
        COUNT(*) as patient_count,
        AVG(wait_time_minutes) as avg_wait_time,
        COUNT(CASE WHEN priority = 'emergency' THEN 1 END) as emergency_cases
      FROM emr_visits
      WHERE hospital_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY department
    `;

    const departments = await pool.query(departmentQuery, [hospitalId]);

    // Get top diagnoses
    const diagnosesQuery = `
      SELECT 
        diagnosis,
        COUNT(*) as case_count
      FROM emr_diagnoses
      WHERE hospital_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY diagnosis
      ORDER BY case_count DESC
      LIMIT 5
    `;

    const topDiagnoses = await pool.query(diagnosesQuery, [hospitalId]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      time_range: timeRange,
      hospital: {
        ...hospital,
        occupancy_rate: hospital.bed_capacity > 0 
          ? Math.round((hospital.current_occupancy / hospital.bed_capacity) * 100) 
          : 0,
        revenue_today: parseFloat(hospital.revenue_today),
        revenue_period: parseFloat(hospital.revenue_period)
      },
      departments: departments.rows,
      top_diagnoses: topDiagnoses.rows,
      operational_status: hospital.current_occupancy >= hospital.bed_capacity * 0.9 ? 'critical' : 
                         hospital.current_occupancy >= hospital.bed_capacity * 0.7 ? 'busy' : 'normal'
    });

  } catch (error) {
    console.error('Hospital Command Centre Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch hospital command centre data',
      error: error.message
    });
  }
});

// Export routes
module.exports = router;
