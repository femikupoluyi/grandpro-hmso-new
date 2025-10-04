const express = require('express');
const router = express.Router();

/**
 * Simplified Operations Command Centre API
 * Provides centralized monitoring and control across all hospitals
 */

// Get aggregated metrics across all hospitals
router.get('/metrics/aggregate', (req, res) => {
  const { period = 'today' } = req.query;
  
  // Mock aggregated data
  const mockData = {
    status: 'success',
    period,
    timestamp: new Date().toISOString(),
    system_totals: {
      total_hospitals: 7,
      total_patients: 4567,
      total_staff: 312,
      total_revenue_month: 125000000,
      avg_occupancy: 78.5
    },
    hospitals: [
      {
        hospital_id: 'hosp-lagos-001',
        hospital_name: 'Lagos University Teaching Hospital',
        patient_metrics: {
          total_patients: 1250,
          new_patients_today: 45,
          emergency_cases: 12,
          outpatient_visits: 89,
          inpatient_admissions: 34
        },
        admission_metrics: {
          bed_capacity: 500,
          current_admissions: 385,
          occupancy_rate: 77.0,
          avg_length_of_stay: 4.2
        },
        staff_metrics: {
          total_staff: 85,
          doctors: 25,
          nurses: 45,
          avg_performance_score: 87.5,
          total_patients_seen: 120,
          avg_satisfaction: 4.3
        },
        financial_metrics: {
          revenue_today: 3500000,
          revenue_week: 24500000,
          revenue_month: 98000000,
          total_transactions: 450,
          avg_transaction_value: 7777,
          pending_payments: 23
        }
      },
      {
        hospital_id: 'hosp-abuja-001',
        hospital_name: 'National Hospital Abuja',
        patient_metrics: {
          total_patients: 980,
          new_patients_today: 38,
          emergency_cases: 8,
          outpatient_visits: 72,
          inpatient_admissions: 28
        },
        admission_metrics: {
          bed_capacity: 400,
          current_admissions: 320,
          occupancy_rate: 80.0,
          avg_length_of_stay: 3.8
        },
        staff_metrics: {
          total_staff: 72,
          doctors: 20,
          nurses: 38,
          avg_performance_score: 85.0,
          total_patients_seen: 98,
          avg_satisfaction: 4.2
        },
        financial_metrics: {
          revenue_today: 2800000,
          revenue_week: 19600000,
          revenue_month: 78400000,
          total_transactions: 380,
          avg_transaction_value: 7368,
          pending_payments: 18
        }
      }
    ]
  };

  res.json(mockData);
});

// Real-time dashboard data
router.get('/dashboard/realtime', (req, res) => {
  const realtimeData = {
    status: 'success',
    timestamp: new Date().toISOString(),
    metrics: {
      active_hospitals: 7,
      patients_today: 312,
      current_admissions: 1845,
      active_staff: 298,
      revenue_today: 18500000,
      low_stock_items: 12
    },
    recent_activities: [
      {
        type: 'admission',
        description: 'New patient admitted - Emergency Ward',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        hospital_id: 'hosp-lagos-001'
      },
      {
        type: 'billing',
        description: 'Invoice generated: ₦45,000',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        hospital_id: 'hosp-ibadan-001'
      },
      {
        type: 'discharge',
        description: 'Patient discharged - Recovery complete',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        hospital_id: 'hosp-abuja-001'
      }
    ],
    refresh_interval: 30000
  };

  res.json(realtimeData);
});

// Get performance comparison across hospitals
router.get('/performance/comparison', (req, res) => {
  const performanceData = {
    status: 'success',
    timestamp: new Date().toISOString(),
    total_hospitals: 7,
    performance_data: [
      {
        id: 'hosp-lagos-001',
        name: 'Lagos University Teaching Hospital',
        state: 'Lagos',
        bed_capacity: 500,
        total_patients: 1250,
        patient_satisfaction: 4.5,
        total_revenue: 98000000,
        avg_billing: 78400,
        occupancy_rate: 77.0,
        staff_count: 85,
        patient_staff_ratio: 14.7,
        performance_score: 92.5,
        rank: 1
      },
      {
        id: 'hosp-abuja-001',
        name: 'National Hospital Abuja',
        state: 'FCT',
        bed_capacity: 400,
        total_patients: 980,
        patient_satisfaction: 4.3,
        total_revenue: 78400000,
        avg_billing: 80000,
        occupancy_rate: 80.0,
        staff_count: 72,
        patient_staff_ratio: 13.6,
        performance_score: 89.8,
        rank: 2
      },
      {
        id: 'hosp-ibadan-001',
        name: 'University College Hospital Ibadan',
        state: 'Oyo',
        bed_capacity: 450,
        total_patients: 890,
        patient_satisfaction: 4.2,
        total_revenue: 65000000,
        avg_billing: 73033,
        occupancy_rate: 75.5,
        staff_count: 68,
        patient_staff_ratio: 13.1,
        performance_score: 85.3,
        rank: 3
      }
    ],
    top_performer: {
      name: 'Lagos University Teaching Hospital',
      performance_score: 92.5
    },
    average_performance: 87.5
  };

  res.json(performanceData);
});

// Get specific hospital command centre view
router.get('/hospital/:hospitalId', (req, res) => {
  const { hospitalId } = req.params;
  const { timeRange = '24h' } = req.query;

  const hospitalData = {
    status: 'success',
    timestamp: new Date().toISOString(),
    time_range: timeRange,
    hospital: {
      hospital_id: hospitalId,
      hospital_name: 'Lagos University Teaching Hospital',
      state: 'Lagos',
      city: 'Ikeja',
      bed_capacity: 500,
      status: 'active',
      current_occupancy: 385,
      staff_on_duty: 45,
      patients_today: 120,
      revenue_today: 3500000,
      patients_period: 450,
      revenue_period: 24500000,
      occupancy_rate: 77.0
    },
    departments: [
      {
        department: 'Emergency',
        patient_count: 45,
        avg_wait_time: 25,
        emergency_cases: 12
      },
      {
        department: 'Outpatient',
        patient_count: 89,
        avg_wait_time: 35,
        emergency_cases: 0
      },
      {
        department: 'Surgery',
        patient_count: 23,
        avg_wait_time: 60,
        emergency_cases: 3
      }
    ],
    top_diagnoses: [
      { diagnosis: 'Malaria', case_count: 45 },
      { diagnosis: 'Typhoid', case_count: 32 },
      { diagnosis: 'Hypertension', case_count: 28 },
      { diagnosis: 'Diabetes', case_count: 24 },
      { diagnosis: 'Respiratory Infections', case_count: 18 }
    ],
    operational_status: 'busy'
  };

  res.json(hospitalData);
});

// Get KPI summary
router.get('/kpis/summary', (req, res) => {
  const kpiData = {
    status: 'success',
    timestamp: new Date().toISOString(),
    kpis: {
      patient_satisfaction: {
        current: 4.3,
        target: 4.5,
        trend: 'improving',
        change: '+0.1'
      },
      bed_occupancy: {
        current: 78.5,
        target: 85,
        trend: 'stable',
        change: '+1.2%'
      },
      average_wait_time: {
        current: 32,
        target: 30,
        trend: 'improving',
        change: '-5 mins'
      },
      revenue_per_patient: {
        current: 45000,
        target: 50000,
        trend: 'improving',
        change: '+₦2,000'
      },
      staff_utilization: {
        current: 82,
        target: 85,
        trend: 'stable',
        change: '+2%'
      },
      emergency_response_time: {
        current: 8,
        target: 10,
        trend: 'excellent',
        change: '-1 min'
      }
    },
    alerts: {
      critical: 2,
      warning: 5,
      info: 8
    }
  };

  res.json(kpiData);
});

module.exports = router;
