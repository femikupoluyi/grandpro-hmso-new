const express = require('express');
const router = express.Router();

// Operations Dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const commandCentreData = {
      timestamp: new Date(),
      metrics: {
        patients: {
          currentInflow: Math.floor(Math.random() * 100) + 50,
          totalToday: Math.floor(Math.random() * 500) + 200,
          admissions: Math.floor(Math.random() * 50) + 20,
          discharges: Math.floor(Math.random() * 40) + 15,
          emergency: Math.floor(Math.random() * 20) + 5
        },
        staff: {
          onDuty: Math.floor(Math.random() * 100) + 150,
          doctors: Math.floor(Math.random() * 30) + 40,
          nurses: Math.floor(Math.random() * 50) + 80,
          support: Math.floor(Math.random() * 20) + 30,
          utilization: (Math.random() * 20 + 70).toFixed(1)
        },
        resources: {
          bedOccupancy: (Math.random() * 30 + 60).toFixed(1),
          icuAvailable: Math.floor(Math.random() * 10) + 5,
          emergencyCapacity: (Math.random() * 40 + 50).toFixed(1),
          operatingRooms: {
            total: 12,
            inUse: Math.floor(Math.random() * 8) + 2,
            scheduled: Math.floor(Math.random() * 10) + 5
          }
        },
        financial: {
          todayRevenue: Math.floor(Math.random() * 5000000) + 2000000,
          pendingClaims: Math.floor(Math.random() * 50) + 20,
          approvedClaims: Math.floor(Math.random() * 100) + 50,
          cashCollection: (Math.random() * 30 + 60).toFixed(1)
        }
      },
      alerts: generateAlerts(),
      hospitalStatuses: generateHospitalStatuses()
    };

    res.json({
      success: true,
      data: {
        commandCentre: commandCentreData
      }
    });
  } catch (error) {
    console.error('Operations dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching operations data'
    });
  }
});

// Real-time monitoring endpoint
router.get('/realtime/:hospitalId', async (req, res) => {
  const { hospitalId } = req.params;
  
  res.json({
    success: true,
    hospitalId,
    realtime: {
      timestamp: new Date(),
      patients: {
        waitingRoom: Math.floor(Math.random() * 30) + 10,
        inTreatment: Math.floor(Math.random() * 20) + 5,
        averageWaitTime: Math.floor(Math.random() * 60) + 15
      },
      departments: generateDepartmentStatus(),
      criticalAlerts: []
    }
  });
});

// Alerts management
router.get('/alerts', async (req, res) => {
  res.json({
    success: true,
    alerts: generateAlerts(),
    total: 15,
    critical: 2,
    warning: 5,
    info: 8
  });
});

// Performance metrics
router.get('/metrics/:period', async (req, res) => {
  const { period } = req.params;
  
  res.json({
    success: true,
    period,
    metrics: {
      efficiency: (Math.random() * 20 + 75).toFixed(1),
      patientSatisfaction: (Math.random() * 1 + 4).toFixed(1),
      staffProductivity: (Math.random() * 20 + 70).toFixed(1),
      resourceUtilization: (Math.random() * 20 + 65).toFixed(1),
      financialHealth: (Math.random() * 20 + 80).toFixed(1)
    },
    trends: generateTrends(period)
  });
});

// Project management
router.get('/projects', async (req, res) => {
  res.json({
    success: true,
    projects: [
      {
        id: 1,
        name: 'Lagos Hospital Expansion',
        status: 'in_progress',
        progress: 65,
        budget: 150000000,
        spent: 97500000,
        deadline: new Date(Date.now() + 90 * 86400000)
      },
      {
        id: 2,
        name: 'Abuja Medical Center IT Upgrade',
        status: 'planning',
        progress: 25,
        budget: 50000000,
        spent: 5000000,
        deadline: new Date(Date.now() + 180 * 86400000)
      },
      {
        id: 3,
        name: 'Port Harcourt Emergency Wing',
        status: 'completed',
        progress: 100,
        budget: 75000000,
        spent: 72000000,
        completedDate: new Date(Date.now() - 30 * 86400000)
      }
    ]
  });
});

// Helper functions
function generateAlerts() {
  const alertTypes = [
    { level: 'critical', message: 'ICU capacity at 95% in Lagos General', hospital: 'Lagos General' },
    { level: 'warning', message: 'Low stock of essential drugs in Abuja Medical', hospital: 'Abuja Medical' },
    { level: 'info', message: 'Scheduled maintenance for MRI machine', hospital: 'Port Harcourt Clinic' },
    { level: 'warning', message: 'Staff shortage in emergency department', hospital: 'Kano Hospital' },
    { level: 'info', message: 'New equipment delivery scheduled', hospital: 'Ibadan Health Center' }
  ];
  
  return alertTypes.map((alert, index) => ({
    id: `alert_${Date.now()}_${index}`,
    ...alert,
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    acknowledged: Math.random() > 0.5
  }));
}

function generateHospitalStatuses() {
  const hospitals = ['Lagos General', 'Abuja Medical Center', 'Port Harcourt Clinic', 'Kano Hospital', 'Ibadan Health Center'];
  
  return hospitals.map(name => ({
    name,
    status: Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'warning' : 'normal',
    occupancy: (Math.random() * 40 + 50).toFixed(1),
    staff: Math.floor(Math.random() * 50) + 100,
    emergencyReady: Math.random() > 0.2
  }));
}

function generateDepartmentStatus() {
  const departments = ['Emergency', 'Surgery', 'ICU', 'Pediatrics', 'Maternity', 'Outpatient'];
  
  return departments.map(dept => ({
    department: dept,
    status: Math.random() > 0.8 ? 'busy' : 'normal',
    patientsCount: Math.floor(Math.random() * 30) + 5,
    staffCount: Math.floor(Math.random() * 15) + 5,
    waitTime: Math.floor(Math.random() * 45) + 10
  }));
}

function generateTrends(period) {
  const points = period === 'daily' ? 24 : period === 'weekly' ? 7 : 30;
  const trends = [];
  
  for (let i = 0; i < points; i++) {
    trends.push({
      period: i,
      patients: Math.floor(Math.random() * 100) + 150,
      revenue: Math.floor(Math.random() * 1000000) + 2000000,
      satisfaction: (Math.random() * 1 + 4).toFixed(1)
    });
  }
  
  return trends;
}

module.exports = router;
