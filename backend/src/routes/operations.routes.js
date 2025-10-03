/**
 * Operations Command Centre Routes
 */

const express = require('express');
const router = express.Router();
const operationsCommandService = require('../services/operations-command.service');
const projectManagementService = require('../services/project-management.service');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ==========================================
// COMMAND CENTRE ENDPOINTS
// ==========================================

/**
 * Get command centre dashboard
 * Aggregates metrics across all hospitals
 */
router.get('/command-centre', async (req, res) => {
  try {
    const { startDate, endDate, hospitalIds } = req.query;
    const result = await operationsCommandService.getCommandCentreDashboard({
      startDate,
      endDate,
      hospitalIds: hospitalIds ? hospitalIds.split(',') : null
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get aggregated patient metrics
 */
router.get('/metrics/patients', async (req, res) => {
  try {
    const { hospitalIds, startDate, endDate } = req.query;
    const dateFilter = operationsCommandService.getDateFilter(startDate, endDate);
    const hospitalFilter = hospitalIds ? `AND h.id = ANY($1)` : '';
    const metrics = await operationsCommandService.getPatientMetrics(
      dateFilter, 
      hospitalFilter, 
      hospitalIds ? hospitalIds.split(',') : null
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get staff KPIs
 */
router.get('/metrics/staff', async (req, res) => {
  try {
    const { hospitalIds, startDate, endDate } = req.query;
    const dateFilter = operationsCommandService.getDateFilter(startDate, endDate);
    const hospitalFilter = hospitalIds ? `AND h.id = ANY($1)` : '';
    const kpis = await operationsCommandService.getStaffKPIs(
      dateFilter,
      hospitalFilter,
      hospitalIds ? hospitalIds.split(',') : null
    );
    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get financial summary
 */
router.get('/metrics/financial', async (req, res) => {
  try {
    const { hospitalIds, startDate, endDate } = req.query;
    const dateFilter = operationsCommandService.getDateFilter(startDate, endDate);
    const hospitalFilter = hospitalIds ? `AND h.id = ANY($1)` : '';
    const summary = await operationsCommandService.getFinancialSummary(
      dateFilter,
      hospitalFilter,
      hospitalIds ? hospitalIds.split(',') : null
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get hospital performance scores
 */
router.get('/performance-scores', async (req, res) => {
  try {
    const { hospitalIds } = req.query;
    const scores = await operationsCommandService.getHospitalPerformanceScores(
      hospitalIds ? hospitalIds.split(',') : null
    );
    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get real-time occupancy data
 */
router.get('/occupancy', async (req, res) => {
  try {
    const { hospitalIds } = req.query;
    const occupancy = await operationsCommandService.getRealTimeOccupancy(
      hospitalIds ? hospitalIds.split(',') : null
    );
    res.json({ success: true, data: occupancy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ALERTS ENDPOINTS
// ==========================================

/**
 * Get active alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { hospitalIds, severity, type } = req.query;
    const alerts = await operationsCommandService.getActiveAlerts(
      hospitalIds ? hospitalIds.split(',') : null
    );
    
    // Filter by severity if provided
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = alerts.filter(a => a.severity === severity);
    }
    if (type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === type);
    }
    
    res.json({ 
      success: true, 
      data: filteredAlerts,
      summary: {
        total: filteredAlerts.length,
        critical: filteredAlerts.filter(a => a.severity === 'critical').length,
        warning: filteredAlerts.filter(a => a.severity === 'warning').length,
        info: filteredAlerts.filter(a => a.severity === 'info').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

/**
 * Create manual alert
 */
router.post('/alerts', async (req, res) => {
  try {
    const alert = await operationsCommandService.createAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Acknowledge alert
 */
router.put('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy, notes } = req.body;
    const result = await operationsCommandService.acknowledgeAlert(
      alertId,
      acknowledgedBy,
      notes
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Resolve alert
 */
router.put('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, resolutionNotes } = req.body;
    const result = await operationsCommandService.resolveAlert(
      alertId,
      resolvedBy,
      resolutionNotes
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run automated alert checks
 */
router.post('/alerts/check', async (req, res) => {
  try {
    const result = await operationsCommandService.runAutomatedAlertChecks();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Check specific alert types
 */
router.post('/alerts/check/low-stock', async (req, res) => {
  try {
    const alerts = await operationsCommandService.checkLowStockAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/alerts/check/performance', async (req, res) => {
  try {
    const alerts = await operationsCommandService.checkPerformanceAnomalies();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/alerts/check/revenue', async (req, res) => {
  try {
    const alerts = await operationsCommandService.checkRevenueGaps();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// PROJECT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Get all projects
 */
router.get('/projects', async (req, res) => {
  try {
    const result = await projectManagementService.getProjects(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get project details
 */
router.get('/projects/:projectId', async (req, res) => {
  try {
    const result = await projectManagementService.getProjectDetails(req.params.projectId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create new project
 */
router.post('/projects', async (req, res) => {
  try {
    const result = await projectManagementService.createProject(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update project status
 */
router.put('/projects/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, updatedBy, notes } = req.body;
    const result = await projectManagementService.updateProjectStatus(
      projectId,
      status,
      updatedBy,
      notes
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create project task
 */
router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const taskData = { ...req.body, projectId: req.params.projectId };
    const result = await projectManagementService.createTask(taskData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update task status
 */
router.put('/tasks/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, updatedBy, actualHours } = req.body;
    const result = await projectManagementService.updateTaskStatus(
      taskId,
      status,
      updatedBy,
      actualHours
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Add project expense
 */
router.post('/projects/:projectId/expenses', async (req, res) => {
  try {
    const expenseData = { ...req.body, projectId: req.params.projectId };
    const result = await projectManagementService.addExpense(expenseData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get project analytics
 */
router.get('/projects/:projectId/analytics', async (req, res) => {
  try {
    const result = await projectManagementService.getProjectAnalytics(req.params.projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get overall project analytics
 */
router.get('/analytics/projects', async (req, res) => {
  try {
    const result = await projectManagementService.getProjectAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get expansion opportunities
 */
router.get('/expansion-opportunities', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const result = await projectManagementService.getExpansionOpportunities(hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// DASHBOARD SUMMARY ENDPOINT
// ==========================================

/**
 * Get operations dashboard summary
 * This is the main endpoint for the operations dashboard UI
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { hospitalIds } = req.query;
    const hospitalFilter = hospitalIds ? hospitalIds.split(',') : null;
    
    // Get all required data in parallel
    const [
      commandCentre,
      projects,
      expansionOpportunities
    ] = await Promise.all([
      operationsCommandService.getCommandCentreDashboard({ hospitalIds: hospitalFilter }),
      projectManagementService.getProjects({ status: 'active' }),
      projectManagementService.getExpansionOpportunities()
    ]);
    
    res.json({
      success: true,
      data: {
        commandCentre: commandCentre.data,
        activeProjects: projects.data,
        expansionOpportunities: expansionOpportunities.data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Dashboard data not available' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Operations Command Centre API is working',
    endpoints: {
      commandCentre: '/api/operations/command-centre',
      alerts: '/api/operations/alerts',
      projects: '/api/operations/projects',
      dashboard: '/api/operations/dashboard',
      metrics: {
        patients: '/api/operations/metrics/patients',
        staff: '/api/operations/metrics/staff',
        financial: '/api/operations/metrics/financial'
      },
      expansion: '/api/operations/expansion-opportunities'
    }
  });
});

// Command Center Metrics
router.get('/command-center/metrics', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM hospitals WHERE status = 'active') as active_hospitals,
                (SELECT COUNT(*) FROM patients) as total_patients,
                (SELECT COUNT(*) FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE) as today_appointments,
                (SELECT COUNT(*) FROM alerts WHERE resolved = false) as active_alerts,
                (SELECT SUM(total_amount) FROM invoices WHERE DATE(created_at) = CURRENT_DATE) as today_revenue
        `);
        
        res.json({
            success: true,
            data: result.rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching command center metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch command center metrics'
        });
    }
});

// KPIs
router.get('/kpis', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                metric_name,
                AVG(metric_value) as avg_value,
                MAX(metric_value) as max_value,
                MIN(metric_value) as min_value,
                category
            FROM kpi_metrics
            WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY metric_name, category
            ORDER BY category, metric_name
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount,
            period: '30 days'
        });
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch KPIs'
        });
    }
});

module.exports = router;
