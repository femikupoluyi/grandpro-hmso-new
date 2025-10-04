const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple auth middleware for now
const authenticateToken = (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
};

/**
 * Alerting System API
 * Monitors and alerts on critical metrics across the platform
 */

// Alert types and thresholds
const ALERT_THRESHOLDS = {
  LOW_STOCK: {
    critical: 10,  // Less than 10 units
    warning: 25    // Less than 25 units
  },
  HIGH_OCCUPANCY: {
    critical: 95,  // Above 95% occupancy
    warning: 85    // Above 85% occupancy
  },
  REVENUE_GAP: {
    critical: -30, // 30% below target
    warning: -15   // 15% below target
  },
  PATIENT_WAIT_TIME: {
    critical: 120, // Above 120 minutes
    warning: 60    // Above 60 minutes
  },
  STAFF_UTILIZATION: {
    critical: 95,  // Above 95% utilization
    warning: 85    // Above 85% utilization
  }
};

// Get all active alerts
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { severity, category, hospital_id } = req.query;
    
    let alerts = [];

    // Check inventory alerts
    const inventoryAlertsQuery = `
      SELECT 
        'inventory' as category,
        CASE 
          WHEN quantity <= $1 THEN 'critical'
          WHEN quantity <= $2 THEN 'warning'
        END as severity,
        'Low Stock Alert: ' || item_name as title,
        'Item ' || item_name || ' has only ' || quantity || ' units remaining' as message,
        jsonb_build_object(
          'item_id', id,
          'item_name', item_name,
          'current_quantity', quantity,
          'reorder_level', reorder_level,
          'hospital_id', hospital_id
        ) as details,
        created_at as detected_at
      FROM inventory_items
      WHERE quantity <= $2
      ${hospital_id ? 'AND hospital_id = $3' : ''}
    `;

    const inventoryParams = [ALERT_THRESHOLDS.LOW_STOCK.critical, ALERT_THRESHOLDS.LOW_STOCK.warning];
    if (hospital_id) inventoryParams.push(hospital_id);

    const inventoryAlerts = await pool.query(inventoryAlertsQuery, inventoryParams);
    alerts.push(...inventoryAlerts.rows);

    // Check occupancy alerts
    const occupancyAlertsQuery = `
      SELECT 
        'occupancy' as category,
        CASE 
          WHEN (current_admissions::numeric / NULLIF(bed_capacity, 0) * 100) >= $1 THEN 'critical'
          WHEN (current_admissions::numeric / NULLIF(bed_capacity, 0) * 100) >= $2 THEN 'warning'
        END as severity,
        'High Occupancy Alert: ' || h.name as title,
        h.name || ' is at ' || ROUND((current_admissions::numeric / NULLIF(bed_capacity, 0) * 100), 1) || '% occupancy' as message,
        jsonb_build_object(
          'hospital_id', h.id,
          'hospital_name', h.name,
          'current_admissions', current_admissions,
          'bed_capacity', bed_capacity,
          'occupancy_rate', ROUND((current_admissions::numeric / NULLIF(bed_capacity, 0) * 100), 1)
        ) as details,
        NOW() as detected_at
      FROM (
        SELECT 
          h.id,
          h.name,
          h.bed_capacity,
          COUNT(a.id) as current_admissions
        FROM hospitals h
        LEFT JOIN emr_admissions a ON h.id = a.hospital_id::uuid AND a.discharge_date IS NULL
        WHERE h.status = 'active'
        GROUP BY h.id, h.name, h.bed_capacity
      ) h
      WHERE (current_admissions::numeric / NULLIF(bed_capacity, 0) * 100) >= $2
      ${hospital_id ? 'AND h.id = $3' : ''}
    `;

    const occupancyParams = [ALERT_THRESHOLDS.HIGH_OCCUPANCY.critical, ALERT_THRESHOLDS.HIGH_OCCUPANCY.warning];
    if (hospital_id) occupancyParams.push(hospital_id);

    const occupancyAlerts = await pool.query(occupancyAlertsQuery, occupancyParams);
    alerts.push(...occupancyAlerts.rows);

    // Check revenue gap alerts
    const revenueAlertsQuery = `
      WITH revenue_analysis AS (
        SELECT 
          h.id,
          h.name,
          COALESCE(SUM(CASE WHEN b.created_at >= CURRENT_DATE THEN b.amount END), 0) as revenue_today,
          COALESCE(AVG(CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '30 days' AND b.created_at < CURRENT_DATE THEN b.amount END), 0) as avg_daily_revenue,
          COALESCE(h.revenue_target_daily, 500000) as target_revenue
        FROM hospitals h
        LEFT JOIN billing_invoices b ON h.id = b.hospital_id::uuid
        WHERE h.status = 'active'
        GROUP BY h.id, h.name, h.revenue_target_daily
      )
      SELECT 
        'revenue' as category,
        CASE 
          WHEN ((revenue_today - target_revenue) / NULLIF(target_revenue, 0) * 100) <= $1 THEN 'critical'
          WHEN ((revenue_today - target_revenue) / NULLIF(target_revenue, 0) * 100) <= $2 THEN 'warning'
        END as severity,
        'Revenue Gap Alert: ' || name as title,
        name || ' revenue is ' || ABS(ROUND(((revenue_today - target_revenue) / NULLIF(target_revenue, 0) * 100), 1)) || '% below target' as message,
        jsonb_build_object(
          'hospital_id', id,
          'hospital_name', name,
          'revenue_today', revenue_today,
          'target_revenue', target_revenue,
          'gap_percentage', ROUND(((revenue_today - target_revenue) / NULLIF(target_revenue, 0) * 100), 1)
        ) as details,
        NOW() as detected_at
      FROM revenue_analysis
      WHERE ((revenue_today - target_revenue) / NULLIF(target_revenue, 0) * 100) <= $2
      ${hospital_id ? 'AND id = $3' : ''}
    `;

    const revenueParams = [ALERT_THRESHOLDS.REVENUE_GAP.critical, ALERT_THRESHOLDS.REVENUE_GAP.warning];
    if (hospital_id) revenueParams.push(hospital_id);

    const revenueAlerts = await pool.query(revenueAlertsQuery, revenueParams);
    alerts.push(...revenueAlerts.rows);

    // Check wait time alerts
    const waitTimeAlertsQuery = `
      WITH wait_times AS (
        SELECT 
          hospital_id,
          h.name as hospital_name,
          department,
          AVG(wait_time_minutes) as avg_wait_time,
          MAX(wait_time_minutes) as max_wait_time,
          COUNT(*) as patient_count
        FROM emr_visits v
        JOIN hospitals h ON h.id = v.hospital_id::uuid
        WHERE v.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
          AND v.status = 'waiting'
        GROUP BY hospital_id, h.name, department
      )
      SELECT 
        'wait_time' as category,
        CASE 
          WHEN avg_wait_time >= $1 THEN 'critical'
          WHEN avg_wait_time >= $2 THEN 'warning'
        END as severity,
        'Long Wait Time Alert: ' || hospital_name || ' - ' || department as title,
        'Average wait time in ' || department || ' is ' || ROUND(avg_wait_time, 0) || ' minutes' as message,
        jsonb_build_object(
          'hospital_id', hospital_id,
          'hospital_name', hospital_name,
          'department', department,
          'avg_wait_time', ROUND(avg_wait_time, 0),
          'max_wait_time', max_wait_time,
          'patients_waiting', patient_count
        ) as details,
        NOW() as detected_at
      FROM wait_times
      WHERE avg_wait_time >= $2
      ${hospital_id ? 'AND hospital_id = $3' : ''}
    `;

    const waitTimeParams = [ALERT_THRESHOLDS.PATIENT_WAIT_TIME.critical, ALERT_THRESHOLDS.PATIENT_WAIT_TIME.warning];
    if (hospital_id) waitTimeParams.push(hospital_id);

    const waitTimeAlerts = await pool.query(waitTimeAlertsQuery, waitTimeParams);
    alerts.push(...waitTimeAlerts.rows);

    // Filter alerts based on query parameters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    if (category) {
      alerts = alerts.filter(alert => alert.category === category);
    }

    // Sort by severity (critical first) and then by time
    alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return new Date(b.detected_at) - new Date(a.detected_at);
    });

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      total_alerts: alerts.length,
      critical_count: alerts.filter(a => a.severity === 'critical').length,
      warning_count: alerts.filter(a => a.severity === 'warning').length,
      alerts: alerts
    });

  } catch (error) {
    console.error('Get Alerts Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// Create custom alert
router.post('/custom', authenticateToken, async (req, res) => {
  try {
    const {
      category,
      severity,
      title,
      message,
      hospital_id,
      threshold_value,
      current_value,
      auto_resolve
    } = req.body;

    const query = `
      INSERT INTO system_alerts (
        category, severity, title, message, 
        hospital_id, threshold_value, current_value,
        auto_resolve, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      category,
      severity,
      title,
      message,
      hospital_id,
      threshold_value,
      current_value,
      auto_resolve || false,
      req.user.id
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Custom alert created',
      alert: result.rows[0]
    });

  } catch (error) {
    console.error('Create Alert Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create custom alert',
      error: error.message
    });
  }
});

// Get alert history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, offset = 0, resolved = false } = req.query;

    const query = `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as resolved_by_name,
        h.name as hospital_name
      FROM system_alerts a
      LEFT JOIN users u ON a.resolved_by = u.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE ($1 = false OR a.status = 'resolved')
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [resolved, limit, offset]);

    res.json({
      status: 'success',
      total: result.rows.length,
      alerts: result.rows
    });

  } catch (error) {
    console.error('Alert History Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alert history',
      error: error.message
    });
  }
});

// Resolve an alert
router.put('/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution_notes } = req.body;

    const query = `
      UPDATE system_alerts
      SET 
        status = 'resolved',
        resolved_at = NOW(),
        resolved_by = $1,
        resolution_notes = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.id,
      resolution_notes,
      alertId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Alert not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Alert resolved',
      alert: result.rows[0]
    });

  } catch (error) {
    console.error('Resolve Alert Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
});

// Get alert statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    const intervalMap = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };

    const interval = intervalMap[period] || '7 days';

    const statsQuery = `
      WITH alert_stats AS (
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
          COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_alerts,
          COUNT(CASE WHEN severity = 'info' THEN 1 END) as info_alerts,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_alerts,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
          AVG(CASE 
            WHEN resolved_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/60 
            ELSE NULL 
          END) as avg_resolution_time_minutes
        FROM system_alerts
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      ),
      category_breakdown AS (
        SELECT 
          category,
          COUNT(*) as count
        FROM system_alerts
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
        GROUP BY category
      ),
      hospital_breakdown AS (
        SELECT 
          h.name as hospital_name,
          COUNT(a.id) as alert_count
        FROM system_alerts a
        JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
        GROUP BY h.name
        ORDER BY alert_count DESC
        LIMIT 5
      )
      SELECT 
        (SELECT row_to_json(alert_stats) FROM alert_stats) as summary,
        (SELECT json_agg(row_to_json(category_breakdown)) FROM category_breakdown) as by_category,
        (SELECT json_agg(row_to_json(hospital_breakdown)) FROM hospital_breakdown) as by_hospital
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      status: 'success',
      period: period,
      statistics: {
        summary: stats.summary || {},
        by_category: stats.by_category || [],
        by_hospital: stats.by_hospital || [],
        trend: 'stable' // This could be calculated based on historical data
      }
    });

  } catch (error) {
    console.error('Alert Statistics Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alert statistics',
      error: error.message
    });
  }
});

// Configure alert thresholds
router.put('/thresholds', authenticateToken, async (req, res) => {
  try {
    const { thresholds } = req.body;

    // Update thresholds in database
    const query = `
      INSERT INTO alert_configurations (
        category, 
        critical_threshold, 
        warning_threshold,
        enabled,
        updated_by,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (category) 
      DO UPDATE SET 
        critical_threshold = EXCLUDED.critical_threshold,
        warning_threshold = EXCLUDED.warning_threshold,
        enabled = EXCLUDED.enabled,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *
    `;

    const updates = [];
    for (const [category, config] of Object.entries(thresholds)) {
      const result = await pool.query(query, [
        category,
        config.critical,
        config.warning,
        config.enabled !== false,
        req.user.id
      ]);
      updates.push(result.rows[0]);
    }

    res.json({
      status: 'success',
      message: 'Alert thresholds updated',
      configurations: updates
    });

  } catch (error) {
    console.error('Update Thresholds Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update alert thresholds',
      error: error.message
    });
  }
});

module.exports = router;
