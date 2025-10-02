const express = require('express');
const router = express.Router();
const emrService = require('../services/emr.service');
const billingService = require('../services/billing.service');
const inventoryService = require('../services/inventory.service');
const hrService = require('../services/hr.service');
const analyticsService = require('../services/analytics.service');

// ============== EMR ROUTES ==============

// Patient registration
router.post('/emr/patients', async (req, res) => {
  try {
    const result = await emrService.createPatientRecord(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient record
router.get('/emr/patients/:patientId', async (req, res) => {
  try {
    const result = await emrService.getPatientRecord(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(error.message === 'Patient not found' ? 404 : 500)
      .json({ success: false, message: error.message });
  }
});

// Search patients
router.get('/emr/patients', async (req, res) => {
  try {
    const result = await emrService.searchPatients(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create encounter
router.post('/emr/encounters', async (req, res) => {
  try {
    const result = await emrService.createEncounter(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add prescription
router.post('/emr/prescriptions', async (req, res) => {
  try {
    const result = await emrService.addPrescription(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Order lab test
router.post('/emr/lab-orders', async (req, res) => {
  try {
    const result = await emrService.orderLabTest(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record lab results
router.post('/emr/lab-results', async (req, res) => {
  try {
    const result = await emrService.recordLabResult(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get medical history
router.get('/emr/patients/:patientId/history', async (req, res) => {
  try {
    const result = await emrService.getMedicalHistory(req.params.patientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Department EMR stats
router.get('/emr/departments/:departmentId/stats', async (req, res) => {
  try {
    const result = await emrService.getDepartmentEMRStats(req.params.departmentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== BILLING ROUTES ==============

// Generate bill
router.post('/billing/bills', async (req, res) => {
  try {
    const result = await billingService.generateBill(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process payment
router.post('/billing/payments', async (req, res) => {
  try {
    const result = await billingService.processPayment(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending bills
router.get('/billing/bills/pending', async (req, res) => {
  try {
    const result = await billingService.getPendingBills(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process insurance claim
router.post('/billing/insurance-claims/:claimId/process', async (req, res) => {
  try {
    const result = await billingService.processInsuranceClaim({
      claimId: req.params.claimId,
      ...req.body
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get revenue report
router.get('/billing/revenue-report', async (req, res) => {
  try {
    const { startDate, endDate, hospitalId } = req.query;
    const result = await billingService.getRevenueReport(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date(),
      hospitalId
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Department revenue
router.get('/billing/departments/:departmentId/revenue', async (req, res) => {
  try {
    const result = await billingService.getDepartmentRevenue(
      req.params.departmentId,
      req.query.period
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== INVENTORY ROUTES ==============

// Add inventory item
router.post('/inventory/items', async (req, res) => {
  try {
    const result = await inventoryService.addInventoryItem(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update stock
router.post('/inventory/stock-movements', async (req, res) => {
  try {
    const result = await inventoryService.updateStock(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get low stock items
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const result = await inventoryService.getLowStockItems(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expiring items
router.get('/inventory/expiring', async (req, res) => {
  try {
    const result = await inventoryService.getExpiringItems(
      req.query.daysAhead || 90,
      req.query.hospitalId
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create purchase order
router.post('/inventory/purchase-orders', async (req, res) => {
  try {
    const result = await inventoryService.createPurchaseOrder(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Receive purchase order
router.post('/inventory/purchase-orders/:orderId/receive', async (req, res) => {
  try {
    const result = await inventoryService.receivePurchaseOrder({
      orderId: req.params.orderId,
      ...req.body
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inventory value report
router.get('/inventory/value-report', async (req, res) => {
  try {
    const result = await inventoryService.getInventoryValueReport(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Schedule equipment maintenance
router.post('/inventory/equipment-maintenance', async (req, res) => {
  try {
    const result = await inventoryService.scheduleEquipmentMaintenance(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stock movements
router.get('/inventory/items/:itemId/movements', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await inventoryService.getStockMovements(
      req.params.itemId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== HR ROUTES ==============

// Add staff
router.post('/hr/staff', async (req, res) => {
  try {
    const result = await hrService.addStaff(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create roster
router.post('/hr/roster', async (req, res) => {
  try {
    const result = await hrService.createRoster(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record attendance
router.post('/hr/attendance', async (req, res) => {
  try {
    const result = await hrService.recordAttendance(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply leave
router.post('/hr/leave-applications', async (req, res) => {
  try {
    const result = await hrService.applyLeave(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process leave application
router.post('/hr/leave-applications/:leaveId/process', async (req, res) => {
  try {
    const result = await hrService.processLeaveApplication(
      req.params.leaveId,
      req.body.decision,
      req.body.approvedBy,
      req.body.comments
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calculate payroll
router.get('/hr/payroll', async (req, res) => {
  try {
    const { month, year, hospitalId } = req.query;
    const result = await hrService.calculatePayroll({
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      hospitalId
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get staff performance
router.get('/hr/staff/:staffId/performance', async (req, res) => {
  try {
    const result = await hrService.getStaffPerformance(
      req.params.staffId,
      req.query.period
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get department staffing
router.get('/hr/departments/:departmentId/staffing', async (req, res) => {
  try {
    const result = await hrService.getDepartmentStaffing(req.params.departmentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== ANALYTICS ROUTES ==============

// Get occupancy analytics
router.get('/analytics/occupancy', async (req, res) => {
  try {
    const result = await analyticsService.getOccupancyAnalytics(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient flow
router.get('/analytics/patient-flow', async (req, res) => {
  try {
    const result = await analyticsService.getPatientFlowAnalytics(
      req.query.hospitalId,
      req.query.date || new Date()
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get emergency metrics
router.get('/analytics/emergency', async (req, res) => {
  try {
    const result = await analyticsService.getEmergencyMetrics(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get department performance
router.get('/analytics/department-performance', async (req, res) => {
  try {
    const { hospitalId, startDate, endDate } = req.query;
    const result = await analyticsService.getDepartmentPerformance(
      hospitalId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get resource utilization
router.get('/analytics/resource-utilization', async (req, res) => {
  try {
    const result = await analyticsService.getResourceUtilization(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get financial metrics
router.get('/analytics/financial', async (req, res) => {
  try {
    const result = await analyticsService.getFinancialMetrics(
      req.query.hospitalId,
      req.query.period
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get predictive analytics
router.get('/analytics/predictions', async (req, res) => {
  try {
    const result = await analyticsService.getPredictiveAnalytics(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get executive dashboard
router.get('/analytics/executive-dashboard', async (req, res) => {
  try {
    const result = await analyticsService.getExecutiveDashboard(req.query.hospitalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
