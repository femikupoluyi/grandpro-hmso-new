const express = require('express');
const router = express.Router();
const hospitalAnalyticsService = require('../services/hospital-analytics.service');
const authMiddleware = require('../middleware/auth');

// Get real-time occupancy metrics
router.get('/occupancy/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const metrics = await hospitalAnalyticsService.getOccupancyMetrics(hospitalId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get patient flow analytics
router.get('/patient-flow/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { startDate, endDate } = req.query;
    
    const metrics = await hospitalAnalyticsService.getPatientFlowMetrics(
      hospitalId,
      { startDate, endDate }
    );
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get revenue analytics
router.get('/revenue/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { period } = req.query; // day, week, month
    
    const metrics = await hospitalAnalyticsService.getRevenueMetrics(hospitalId, period);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get staff performance metrics
router.get('/staff-performance/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const metrics = await hospitalAnalyticsService.getStaffPerformanceMetrics(hospitalId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get inventory analytics
router.get('/inventory/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const metrics = await hospitalAnalyticsService.getInventoryMetrics(hospitalId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get department-wise metrics
router.get('/departments/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const metrics = await hospitalAnalyticsService.getDepartmentMetrics(hospitalId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get predictive analytics
router.get('/predictions/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const predictions = await hospitalAnalyticsService.getPredictiveMetrics(hospitalId);
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get comprehensive dashboard metrics
router.get('/dashboard/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const dashboard = await hospitalAnalyticsService.getDashboardMetrics(hospitalId);
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export analytics data
router.get('/export/:hospitalId', authMiddleware, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { format, startDate, endDate, type } = req.query;
    
    // Generate export based on type
    let data;
    switch (type) {
      case 'revenue':
        data = await hospitalAnalyticsService.getRevenueMetrics(hospitalId, 'day');
        break;
      case 'occupancy':
        data = await hospitalAnalyticsService.getOccupancyMetrics(hospitalId);
        break;
      case 'inventory':
        data = await hospitalAnalyticsService.getInventoryMetrics(hospitalId);
        break;
      default:
        data = await hospitalAnalyticsService.getDashboardMetrics(hospitalId);
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="hospital-analytics-${type}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return '';
  }
  
  // Handle different data structures
  let rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return '';
  
  // Get headers
  const headers = Object.keys(rows[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle nested objects and arrays
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        // Escape commas and quotes
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

module.exports = router;
