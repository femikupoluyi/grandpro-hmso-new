const express = require('express');
const router = express.Router();
const hrService = require('../services/hr-enhanced.service');
const { authenticateToken } = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'HR API is working',
    endpoints: {
      staff: {
        register: 'POST /api/hr/staff',
        list: 'GET /api/hr/staff',
        getById: 'GET /api/hr/staff/:id',
        update: 'PUT /api/hr/staff/:id'
      },
      roster: {
        create: 'POST /api/hr/roster',
        get: 'GET /api/hr/roster',
        getByDepartment: 'GET /api/hr/roster/department/:departmentId'
      },
      attendance: {
        clockIn: 'POST /api/hr/attendance/clock-in',
        clockOut: 'POST /api/hr/attendance/clock-out',
        report: 'GET /api/hr/attendance/report/:staffId'
      },
      payroll: {
        process: 'POST /api/hr/payroll',
        getSlip: 'GET /api/hr/payroll/:staffId/:month',
        summary: 'GET /api/hr/payroll/summary/:hospitalId'
      },
      leave: {
        request: 'POST /api/hr/leave-requests',
        approve: 'PUT /api/hr/leave-requests/:id/approve',
        reject: 'PUT /api/hr/leave-requests/:id/reject',
        balance: 'GET /api/hr/leave-balance/:staffId'
      }
    }
  });
});

// Register staff
router.post('/staff', async (req, res) => {
  try {
    const result = await hrService.registerStaff(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all staff
router.get('/staff', async (req, res) => {
  try {
    const { hospital_id, department, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await hrService.getStaff({
      hospital_id,
      department,
      role,
      limit,
      offset
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by ID
router.get('/staff/:id', async (req, res) => {
  try {
    const result = await hrService.getStaffById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff
router.put('/staff/:id', async (req, res) => {
  try {
    const result = await hrService.updateStaff(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create roster
router.post('/roster', async (req, res) => {
  try {
    const result = await hrService.createRoster(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get roster
router.get('/roster', async (req, res) => {
  try {
    const { hospital_id, department, date, week } = req.query;
    const result = await hrService.getRoster({
      hospital_id,
      department,
      date,
      week
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get roster by department
router.get('/roster/department/:departmentId', async (req, res) => {
  try {
    const { date, week } = req.query;
    const result = await hrService.getRosterByDepartment(req.params.departmentId, date, week);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clock in
router.post('/attendance/clock-in', async (req, res) => {
  try {
    const result = await hrService.recordAttendance({
      ...req.body,
      clock_in: new Date()
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clock out
router.post('/attendance/clock-out', async (req, res) => {
  try {
    const result = await hrService.recordAttendance({
      ...req.body,
      clock_out: new Date()
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance report
router.get('/attendance/report/:staffId', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await hrService.getAttendanceReport(req.params.staffId, start_date, end_date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process payroll
router.post('/payroll', async (req, res) => {
  try {
    const result = await hrService.processPayroll(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pay slip
router.get('/payroll/:staffId/:month', async (req, res) => {
  try {
    const result = await hrService.getPayslip(req.params.staffId, req.params.month);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payroll summary
router.get('/payroll/summary/:hospitalId', async (req, res) => {
  try {
    const { month, year } = req.query;
    const result = await hrService.getPayrollSummary(req.params.hospitalId, month, year);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request leave
router.post('/leave-requests', async (req, res) => {
  try {
    const result = await hrService.requestLeave(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve leave
router.put('/leave-requests/:id/approve', async (req, res) => {
  try {
    const result = await hrService.approveLeave(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject leave
router.put('/leave-requests/:id/reject', async (req, res) => {
  try {
    const result = await hrService.rejectLeave(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leave balance
router.get('/leave-balance/:staffId', async (req, res) => {
  try {
    const result = await hrService.getLeaveBalance(req.params.staffId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get performance metrics
router.get('/performance/:staffId', async (req, res) => {
  try {
    const { period } = req.query;
    const result = await hrService.getPerformanceMetrics(req.params.staffId, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy route for schedules
router.get('/schedules', async (req, res) => {
  // Redirect to roster
  return router.handle({ ...req, url: '/roster' }, res);
});

module.exports = router;
