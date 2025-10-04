const express = require('express');
const router = express.Router();

/**
 * Simplified Alerting System API
 */

// Get all active alerts
router.get('/active', (req, res) => {
  const { severity, category, hospital_id } = req.query;
  
  let alerts = [
    {
      category: 'inventory',
      severity: 'critical',
      title: 'Low Stock Alert: Paracetamol 500mg',
      message: 'Item Paracetamol 500mg has only 8 units remaining',
      details: {
        item_id: 'inv-001',
        item_name: 'Paracetamol 500mg',
        current_quantity: 8,
        reorder_level: 50,
        hospital_id: 'hosp-lagos-001'
      },
      detected_at: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      category: 'occupancy',
      severity: 'warning',
      title: 'High Occupancy Alert: Lagos University Teaching Hospital',
      message: 'Lagos University Teaching Hospital is at 88% occupancy',
      details: {
        hospital_id: 'hosp-lagos-001',
        hospital_name: 'Lagos University Teaching Hospital',
        current_admissions: 440,
        bed_capacity: 500,
        occupancy_rate: 88
      },
      detected_at: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      category: 'revenue',
      severity: 'warning',
      title: 'Revenue Gap Alert: St. Nicholas Hospital',
      message: 'St. Nicholas Hospital revenue is 18% below target',
      details: {
        hospital_id: 'hosp-lagos-002',
        hospital_name: 'St. Nicholas Hospital',
        revenue_today: 410000,
        target_revenue: 500000,
        gap_percentage: -18
      },
      detected_at: new Date(Date.now() - 60 * 60000).toISOString()
    },
    {
      category: 'wait_time',
      severity: 'critical',
      title: 'Long Wait Time Alert: Emergency Department',
      message: 'Average wait time in Emergency is 95 minutes',
      details: {
        hospital_id: 'hosp-abuja-001',
        hospital_name: 'National Hospital Abuja',
        department: 'Emergency',
        avg_wait_time: 95,
        max_wait_time: 120,
        patients_waiting: 15
      },
      detected_at: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ];

  // Filter based on query parameters
  if (severity) {
    alerts = alerts.filter(alert => alert.severity === severity);
  }
  if (category) {
    alerts = alerts.filter(alert => alert.category === category);
  }
  if (hospital_id) {
    alerts = alerts.filter(alert => alert.details.hospital_id === hospital_id);
  }

  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    total_alerts: alerts.length,
    critical_count: alerts.filter(a => a.severity === 'critical').length,
    warning_count: alerts.filter(a => a.severity === 'warning').length,
    alerts: alerts
  });
});

// Get alert statistics
router.get('/statistics', (req, res) => {
  const { period = '7d' } = req.query;

  res.json({
    status: 'success',
    period: period,
    statistics: {
      summary: {
        total_alerts: 156,
        critical_alerts: 23,
        warning_alerts: 67,
        info_alerts: 66,
        resolved_alerts: 142,
        active_alerts: 14,
        avg_resolution_time_minutes: 45
      },
      by_category: [
        { category: 'inventory', count: 45 },
        { category: 'occupancy', count: 32 },
        { category: 'revenue', count: 28 },
        { category: 'wait_time', count: 25 },
        { category: 'staff_utilization', count: 26 }
      ],
      by_hospital: [
        { hospital_name: 'Lagos University Teaching Hospital', alert_count: 42 },
        { hospital_name: 'National Hospital Abuja', alert_count: 38 },
        { hospital_name: 'St. Nicholas Hospital', alert_count: 31 },
        { hospital_name: 'University College Hospital Ibadan', alert_count: 25 },
        { hospital_name: 'Federal Medical Centre Owerri', alert_count: 20 }
      ],
      trend: 'decreasing'
    }
  });
});

// Create custom alert
router.post('/custom', (req, res) => {
  const {
    category,
    severity,
    title,
    message,
    hospital_id
  } = req.body;

  res.status(201).json({
    status: 'success',
    message: 'Custom alert created',
    alert: {
      id: 'alert-' + Date.now(),
      category,
      severity,
      title,
      message,
      hospital_id,
      status: 'active',
      created_at: new Date().toISOString()
    }
  });
});

// Resolve an alert
router.put('/:alertId/resolve', (req, res) => {
  const { alertId } = req.params;
  const { resolution_notes } = req.body;

  res.json({
    status: 'success',
    message: 'Alert resolved',
    alert: {
      id: alertId,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes
    }
  });
});

module.exports = router;
