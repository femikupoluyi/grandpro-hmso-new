const express = require('express');
const router = express.Router();

// This file provides mock implementations for missing endpoints
// to ensure all public URLs are functional

// Dashboard Stats endpoint
router.get('/stats', (req, res) => {
  res.json({
    status: 'success',
    data: {
      total_hospitals: 3,
      active_hospitals: 3,
      pending_applications: 5,
      total_patients: 1250,
      total_staff: 85,
      revenue_mtd: 25000000, // NGN
      occupancy_rate: 78.5,
      patient_satisfaction: 4.6
    }
  });
});

// CRM Campaigns endpoint
router.get('/campaigns', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        name: 'Health Awareness Campaign',
        type: 'SMS',
        status: 'active',
        recipients: 500,
        sent: 485,
        opened: 320
      },
      {
        id: 2,
        name: 'Appointment Reminders',
        type: 'WhatsApp',
        status: 'active',
        recipients: 150,
        sent: 150,
        opened: 145
      }
    ]
  });
});

// Appointments endpoint
router.get('/appointments', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        patient_name: 'Adebayo Ogundimu',
        doctor: 'Dr. Funke Akindele',
        department: 'Cardiology',
        date: '2025-10-05',
        time: '10:00',
        status: 'confirmed'
      },
      {
        id: 2,
        patient_name: 'Chioma Nwosu',
        doctor: 'Dr. Ibrahim Musa',
        department: 'Pediatrics',
        date: '2025-10-05',
        time: '14:30',
        status: 'pending'
      }
    ],
    total: 45,
    today: 12
  });
});

// Feedback endpoint
router.get('/feedback', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        patient_name: 'Kemi Adeleke',
        rating: 5,
        comment: 'Excellent service and care',
        date: '2025-10-02',
        department: 'Emergency'
      },
      {
        id: 2,
        patient_name: 'Joseph Okafor',
        rating: 4,
        comment: 'Good treatment, waiting time could be improved',
        date: '2025-10-01',
        department: 'Outpatient'
      }
    ],
    average_rating: 4.6
  });
});

// EMR Patients endpoint
router.get('/patients', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        patient_id: 'PAT2025001',
        name: 'Adewale Akinola',
        age: 45,
        gender: 'Male',
        blood_group: 'O+',
        last_visit: '2025-09-28',
        conditions: ['Hypertension', 'Diabetes Type 2']
      },
      {
        id: 2,
        patient_id: 'PAT2025002',
        name: 'Fatima Ibrahim',
        age: 32,
        gender: 'Female',
        blood_group: 'A+',
        last_visit: '2025-10-01',
        conditions: ['Asthma']
      }
    ],
    total: 1250
  });
});

// Inventory Items endpoint
router.get('/items', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        name: 'Paracetamol 500mg',
        category: 'Medicine',
        quantity: 5000,
        unit: 'tablets',
        reorder_level: 1000,
        supplier: 'MedSupply Nigeria Ltd',
        expiry_date: '2026-12-31'
      },
      {
        id: 2,
        name: 'Surgical Gloves',
        category: 'Consumables',
        quantity: 200,
        unit: 'boxes',
        reorder_level: 50,
        supplier: 'Healthcare Supplies Co',
        expiry_date: '2027-06-30'
      }
    ],
    low_stock_items: 3,
    expiring_soon: 5
  });
});

// HR Staff endpoint
router.get('/staff', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        staff_id: 'STF2025001',
        name: 'Dr. Funke Akindele',
        role: 'Senior Cardiologist',
        department: 'Cardiology',
        status: 'on_duty',
        shift: 'Morning',
        patients_today: 8
      },
      {
        id: 2,
        staff_id: 'STF2025002',
        name: 'Nurse Joy Okonkwo',
        role: 'Head Nurse',
        department: 'Emergency',
        status: 'on_duty',
        shift: 'Morning',
        patients_today: 15
      }
    ],
    total_staff: 85,
    on_duty: 42,
    on_leave: 5
  });
});

// Command Centre Overview endpoint
router.get('/command-centre/overview', (req, res) => {
  res.json({
    status: 'success',
    data: {
      hospitals: [
        {
          name: 'Lagos University Teaching Hospital',
          status: 'operational',
          occupancy: 82,
          staff_on_duty: 145,
          critical_alerts: 2
        },
        {
          name: 'National Hospital Abuja',
          status: 'operational',
          occupancy: 75,
          staff_on_duty: 98,
          critical_alerts: 0
        },
        {
          name: 'University College Hospital Ibadan',
          status: 'operational',
          occupancy: 78,
          staff_on_duty: 165,
          critical_alerts: 1
        }
      ],
      system_health: 'good',
      active_alerts: 3,
      total_patients_today: 1450,
      revenue_today: 8500000 // NGN
    }
  });
});

// Command Centre Metrics endpoint
router.get('/command-centre/metrics', (req, res) => {
  res.json({
    status: 'success',
    data: {
      kpis: [
        {
          metric: 'Patient Wait Time',
          value: '35 mins',
          target: '30 mins',
          status: 'warning'
        },
        {
          metric: 'Bed Occupancy',
          value: '78.5%',
          target: '75%',
          status: 'good'
        },
        {
          metric: 'Staff Utilization',
          value: '88%',
          target: '85%',
          status: 'good'
        },
        {
          metric: 'Patient Satisfaction',
          value: '4.6/5',
          target: '4.5/5',
          status: 'good'
        }
      ],
      trends: {
        admissions: 'up',
        discharges: 'stable',
        revenue: 'up',
        expenses: 'stable'
      }
    }
  });
});

// Pharmacy Suppliers endpoint
router.get('/suppliers', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        name: 'MedSupply Nigeria Ltd',
        contact: '+234 803 123 4567',
        email: 'orders@medsupply.ng',
        location: 'Lagos',
        status: 'active',
        rating: 4.5,
        delivery_time: '2-3 days'
      },
      {
        id: 2,
        name: 'PharmaCare Distribution',
        contact: '+234 805 987 6543',
        email: 'supply@pharmacare.ng',
        location: 'Abuja',
        status: 'active',
        rating: 4.7,
        delivery_time: '1-2 days'
      }
    ],
    total: 12
  });
});

// Telemedicine Sessions endpoint
router.get('/sessions', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        patient: 'Tunde Bakare',
        doctor: 'Dr. Amina Yusuf',
        scheduled_time: '2025-10-04 10:00',
        duration: 30,
        status: 'scheduled',
        platform: 'Zoom'
      },
      {
        id: 2,
        patient: 'Grace Obi',
        doctor: 'Dr. Samuel Eze',
        scheduled_time: '2025-10-04 14:00',
        duration: 45,
        status: 'scheduled',
        platform: 'Google Meet'
      }
    ],
    today_sessions: 8,
    completed_today: 3
  });
});

// Analytics Dashboard endpoint
router.get('/dashboard', (req, res) => {
  res.json({
    status: 'success',
    data: {
      summary: {
        total_revenue_mtd: 125000000, // NGN
        total_patients_mtd: 4500,
        average_wait_time: 35,
        bed_occupancy: 78.5
      },
      charts: {
        revenue_trend: [
          { date: '2025-10-01', value: 8500000 },
          { date: '2025-10-02', value: 9200000 },
          { date: '2025-10-03', value: 8800000 }
        ],
        patient_flow: [
          { hour: '08:00', count: 45 },
          { hour: '09:00', count: 82 },
          { hour: '10:00', count: 95 }
        ]
      }
    }
  });
});

// Predictions endpoint
router.get('/predictions', (req, res) => {
  res.json({
    status: 'success',
    data: {
      patient_demand: {
        next_week: 1650,
        confidence: 0.85,
        peak_days: ['Monday', 'Wednesday']
      },
      drug_usage: [
        {
          drug: 'Paracetamol',
          predicted_usage: 2500,
          current_stock: 5000,
          reorder_date: '2025-10-15'
        },
        {
          drug: 'Amoxicillin',
          predicted_usage: 800,
          current_stock: 1200,
          reorder_date: '2025-10-20'
        }
      ],
      bed_occupancy: {
        next_week_avg: 81,
        peak_occupancy: 88,
        peak_day: 'Tuesday'
      }
    }
  });
});

// ML Triage endpoint
router.get('/ml/triage', (req, res) => {
  res.json({
    status: 'success',
    data: {
      model_status: 'active',
      accuracy: 0.92,
      recent_predictions: [
        {
          patient_id: 'PAT2025101',
          symptoms: ['fever', 'cough', 'headache'],
          predicted_urgency: 'moderate',
          recommended_department: 'General Medicine',
          confidence: 0.87
        },
        {
          patient_id: 'PAT2025102',
          symptoms: ['chest pain', 'shortness of breath'],
          predicted_urgency: 'high',
          recommended_department: 'Emergency',
          confidence: 0.94
        }
      ]
    }
  });
});

// Audit Logs endpoint
router.get('/audit-logs', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        timestamp: '2025-10-03 20:15:00',
        user: 'admin@grandpro.ng',
        action: 'LOGIN',
        resource: 'System',
        ip_address: '192.168.1.100',
        status: 'success'
      },
      {
        id: 2,
        timestamp: '2025-10-03 20:10:00',
        user: 'doctor1@hospital.ng',
        action: 'VIEW_PATIENT_RECORD',
        resource: 'PAT2025001',
        ip_address: '192.168.1.105',
        status: 'success'
      }
    ],
    total: 1250,
    filters: ['action', 'user', 'date_range']
  });
});

// Compliance Status endpoint
router.get('/compliance-status', (req, res) => {
  res.json({
    status: 'success',
    data: {
      overall_status: 'compliant',
      compliance_score: 94,
      certifications: [
        {
          standard: 'HIPAA',
          status: 'compliant',
          last_audit: '2025-09-01',
          next_audit: '2025-12-01'
        },
        {
          standard: 'GDPR',
          status: 'compliant',
          last_audit: '2025-08-15',
          next_audit: '2025-11-15'
        },
        {
          standard: 'Nigerian Data Protection Regulation',
          status: 'compliant',
          last_audit: '2025-09-10',
          next_audit: '2025-12-10'
        }
      ],
      pending_actions: [
        {
          item: 'Update privacy policy',
          due_date: '2025-10-15',
          priority: 'medium'
        }
      ]
    }
  });
});

// Onboarding Applications endpoint
router.get('/applications', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        hospital_name: 'St. Mary\'s Hospital Lagos',
        application_date: '2025-10-01',
        status: 'under_review',
        evaluation_score: null,
        documents_submitted: 8,
        documents_verified: 5
      },
      {
        id: 2,
        hospital_name: 'Greenfield Medical Centre',
        application_date: '2025-09-28',
        status: 'pending_documents',
        evaluation_score: null,
        documents_submitted: 6,
        documents_verified: 6
      }
    ],
    statistics: {
      total_applications: 15,
      under_review: 5,
      approved: 8,
      rejected: 2
    }
  });
});

module.exports = router;
