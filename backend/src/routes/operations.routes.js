const router = require('express').Router();
const operationsService = require('../services/operations.service');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All operations routes require admin role
router.use(authenticateToken);
router.use(authorizeRoles(['admin', 'operations_manager']));

// Multi-hospital metrics dashboard
router.get('/metrics/multi-hospital', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const metrics = await operationsService.getMultiHospitalMetrics(timeRange);
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching multi-hospital metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch multi-hospital metrics'
    });
  }
});

// Single hospital detailed metrics
router.get('/metrics/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { timeRange = '24h' } = req.query;
    const metrics = await operationsService.getHospitalMetrics(hospitalId, timeRange);
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching hospital metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hospital metrics'
    });
  }
});

// Performance KPIs
router.get('/kpis', async (req, res) => {
  try {
    const { hospitalId, period = 'month' } = req.query;
    const kpis = await operationsService.getPerformanceKPIs(hospitalId, period);
    res.json({
      success: true,
      kpis
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance KPIs'
    });
  }
});

// Comparative analytics
router.get('/analytics/compare', async (req, res) => {
  try {
    const { hospitalIds = [], metric = 'revenue' } = req.query;
    const hospitalIdArray = Array.isArray(hospitalIds) ? hospitalIds : [hospitalIds].filter(Boolean);
    const comparison = await operationsService.getComparativeAnalytics(hospitalIdArray, metric);
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparative analytics'
    });
  }
});

// System alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity, resolved = false } = req.query;
    const alerts = await operationsService.getRealTimeAlerts(severity, resolved === 'true');
    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

// Create alert
router.post('/alerts', async (req, res) => {
  try {
    const alert = await operationsService.createAlert(req.body);
    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
});

// Resolve alert
router.put('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const resolution = {
      notes: req.body.notes,
      resolved_by: req.user.id
    };
    const alert = await operationsService.resolveAlert(alertId, resolution);
    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

// Expansion projects
router.get('/projects', async (req, res) => {
  try {
    const { status } = req.query;
    const projects = await operationsService.getExpansionProjects(status);
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expansion projects'
    });
  }
});

// Create or update project
router.post('/projects', async (req, res) => {
  try {
    const project = await operationsService.createExpansionProject(req.body);
    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create expansion project'
    });
  }
});

// Real-time metrics stream (WebSocket endpoint)
router.get('/stream/metrics', async (req, res) => {
  // Set headers for SSE (Server-Sent Events)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send metrics every 5 seconds
  const intervalId = setInterval(async () => {
    try {
      const metrics = await operationsService.getMultiHospitalMetrics('1h');
      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (error) {
      console.error('Error streaming metrics:', error);
    }
  }, 5000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// Hospital ranking by metric
router.get('/rankings/:metric', async (req, res) => {
  try {
    const { metric } = req.params;
    const { period = '30d' } = req.query;
    
    const validMetrics = ['revenue', 'occupancy', 'satisfaction', 'efficiency', 'quality'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`
      });
    }

    const rankings = await operationsService.getComparativeAnalytics([], metric);
    res.json({
      success: true,
      metric,
      period,
      rankings: rankings.hospitals
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hospital rankings'
    });
  }
});

// Predictive analytics
router.get('/analytics/predictions', async (req, res) => {
  try {
    const { hospitalId, metric, days = 30 } = req.query;
    
    // Placeholder for predictive analytics
    // In production, this would use ML models
    const predictions = {
      hospitalId,
      metric,
      predictions: Array.from({ length: parseInt(days) }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        value: Math.random() * 100,
        confidence: 0.85 + Math.random() * 0.15
      }))
    };

    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictions'
    });
  }
});

// Resource optimization suggestions
router.get('/optimize/resources', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    
    // Generate optimization suggestions based on current metrics
    const metrics = await operationsService.getHospitalMetrics(hospitalId, '7d');
    
    const suggestions = [];
    
    // Staffing optimization
    if (metrics.staffing.attendanceRate < 85) {
      suggestions.push({
        category: 'staffing',
        priority: 'high',
        suggestion: 'Consider hiring additional staff or implementing attendance incentives',
        impact: 'Could improve patient care quality by 15%',
        estimatedSavings: 50000
      });
    }
    
    // Bed management
    if (metrics.occupancy.percentage > 90) {
      suggestions.push({
        category: 'capacity',
        priority: 'critical',
        suggestion: 'Optimize discharge planning to improve bed turnover',
        impact: 'Could increase patient throughput by 20%',
        estimatedRevenue: 200000
      });
    }
    
    // Inventory optimization
    if (metrics.inventory.lowStockItems > 5) {
      suggestions.push({
        category: 'inventory',
        priority: 'medium',
        suggestion: 'Implement automatic reordering for critical items',
        impact: 'Prevent stockouts and emergency purchases',
        estimatedSavings: 30000
      });
    }

    res.json({
      success: true,
      hospitalId,
      suggestions,
      totalPotentialSavings: suggestions.reduce((sum, s) => sum + (s.estimatedSavings || 0), 0),
      totalPotentialRevenue: suggestions.reduce((sum, s) => sum + (s.estimatedRevenue || 0), 0)
    });
  } catch (error) {
    console.error('Error generating optimization suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization suggestions'
    });
  }
});

module.exports = router;
