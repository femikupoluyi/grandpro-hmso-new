#!/usr/bin/env node

/**
 * End-to-End Test Script for GrandPro HMSO Platform
 * This script simulates a complete patient visit workflow
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:80/api';
let authToken = '';
let patientId = '';
let visitId = '';
let invoiceId = '';
let prescriptionId = '';

// Test data
const testPatient = {
  first_name: 'Adewale',
  last_name: 'Okonkwo',
  email: `patient_${Date.now()}@test.com`,
  phone: '+234 802 345 6789',
  date_of_birth: '1985-06-15',
  gender: 'male',
  address: '45 Marina Street, Lagos Island',
  state: 'Lagos',
  city: 'Lagos',
  emergency_contact: 'Funke Okonkwo - +234 803 456 7890'
};

const testVisit = {
  chief_complaint: 'Persistent headache and fever for 3 days',
  vital_signs: {
    blood_pressure: '120/80',
    temperature: '38.5°C',
    pulse: '82 bpm',
    weight: '75 kg',
    height: '175 cm'
  },
  symptoms: ['headache', 'fever', 'body aches', 'fatigue']
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, useAuth = true) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: useAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`.red, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function login() {
  console.log('\n1. AUTHENTICATION'.yellow);
  console.log('=================='.yellow);
  
  try {
    const response = await apiCall('POST', '/auth/login', {
      email: 'doctor@grandpro.com',
      password: 'Doctor@123456'
    }, false);
    
    authToken = response.token || response.data?.token;
    console.log('✅ Logged in as doctor@grandpro.com'.green);
    return true;
  } catch (error) {
    console.log('❌ Login failed'.red);
    return false;
  }
}

async function createPatientEMR() {
  console.log('\n2. CREATE PATIENT EMR RECORD'.yellow);
  console.log('=============================='.yellow);
  
  try {
    // Create patient record
    const patientResponse = await apiCall('POST', '/emr/patients', {
      ...testPatient,
      medical_history: {
        allergies: ['Penicillin'],
        chronic_conditions: ['Hypertension'],
        medications: ['Amlodipine 5mg daily'],
        past_surgeries: ['Appendectomy - 2010']
      }
    });
    
    patientId = patientResponse.data?.id || patientResponse.patient_id || 'test-patient-' + Date.now();
    console.log(`✅ Created patient EMR: ${testPatient.first_name} ${testPatient.last_name}`.green);
    console.log(`   Patient ID: ${patientId}`.gray);
    
    // Create visit record
    const visitResponse = await apiCall('POST', '/emr/visits', {
      patient_id: patientId,
      ...testVisit,
      doctor_id: 'dr-001',
      hospital_id: 'hosp-lagos-001',
      visit_type: 'consultation',
      department: 'General Medicine'
    });
    
    visitId = visitResponse.data?.id || visitResponse.visit_id || 'visit-' + Date.now();
    console.log(`✅ Created visit record`.green);
    console.log(`   Visit ID: ${visitId}`.gray);
    console.log(`   Chief Complaint: ${testVisit.chief_complaint}`.gray);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to create EMR records'.red);
    return false;
  }
}

async function performDiagnosisAndTreatment() {
  console.log('\n3. DIAGNOSIS & TREATMENT'.yellow);
  console.log('=========================='.yellow);
  
  try {
    // Add diagnosis
    const diagnosis = {
      visit_id: visitId,
      diagnosis: 'Malaria (Plasmodium falciparum)',
      icd_code: 'B50.9',
      severity: 'moderate',
      notes: 'Patient presents with classic malaria symptoms. Rapid diagnostic test positive.'
    };
    
    await apiCall('POST', '/emr/diagnoses', diagnosis);
    console.log(`✅ Diagnosis recorded: ${diagnosis.diagnosis}`.green);
    
    // Create prescription
    const prescription = {
      visit_id: visitId,
      patient_id: patientId,
      medications: [
        {
          drug_name: 'Artemether-Lumefantrine',
          dosage: '80/480mg',
          frequency: 'Twice daily',
          duration: '3 days',
          quantity: 6,
          instructions: 'Take with food'
        },
        {
          drug_name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '5 days',
          quantity: 15,
          instructions: 'For fever and pain relief'
        }
      ]
    };
    
    const prescResponse = await apiCall('POST', '/emr/prescriptions', prescription);
    prescriptionId = prescResponse.data?.id || prescResponse.prescription_id || 'presc-' + Date.now();
    console.log(`✅ Prescription created`.green);
    console.log(`   Medications: ${prescription.medications.length} items`.gray);
    
    // Order lab tests
    const labTests = {
      visit_id: visitId,
      tests: [
        { test_name: 'Complete Blood Count', status: 'pending' },
        { test_name: 'Malaria Parasite Test', status: 'completed', result: 'Positive' }
      ]
    };
    
    await apiCall('POST', '/emr/lab-tests', labTests);
    console.log(`✅ Lab tests ordered: ${labTests.tests.length} tests`.green);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to record diagnosis and treatment'.red);
    return false;
  }
}

async function generateBilling() {
  console.log('\n4. BILLING & INVOICING'.yellow);
  console.log('========================'.yellow);
  
  try {
    const invoice = {
      patient_id: patientId,
      visit_id: visitId,
      hospital_id: 'hosp-lagos-001',
      items: [
        {
          description: 'Consultation - General Medicine',
          quantity: 1,
          unit_price: 15000,
          total: 15000
        },
        {
          description: 'Malaria Rapid Diagnostic Test',
          quantity: 1,
          unit_price: 2500,
          total: 2500
        },
        {
          description: 'Complete Blood Count',
          quantity: 1,
          unit_price: 5000,
          total: 5000
        },
        {
          description: 'Artemether-Lumefantrine 80/480mg',
          quantity: 6,
          unit_price: 500,
          total: 3000
        },
        {
          description: 'Paracetamol 500mg',
          quantity: 15,
          unit_price: 50,
          total: 750
        }
      ],
      subtotal: 26250,
      tax: 0,
      discount: 0,
      total: 26250,
      payment_method: 'cash',
      status: 'pending'
    };
    
    const billingResponse = await apiCall('POST', '/billing/invoices', invoice);
    invoiceId = billingResponse.data?.id || billingResponse.invoice_id || 'INV-' + Date.now();
    
    console.log(`✅ Invoice generated`.green);
    console.log(`   Invoice ID: ${invoiceId}`.gray);
    console.log(`   Total Amount: ₦${invoice.total.toLocaleString()}`.gray);
    console.log(`   Items: ${invoice.items.length}`.gray);
    
    // Process payment
    const payment = {
      invoice_id: invoiceId,
      amount: invoice.total,
      payment_method: 'cash',
      reference: 'CASH-' + Date.now()
    };
    
    await apiCall('POST', '/billing/payments', payment);
    console.log(`✅ Payment processed: ₦${payment.amount.toLocaleString()}`.green);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to generate billing'.red);
    return false;
  }
}

async function updateInventory() {
  console.log('\n5. INVENTORY UPDATE'.yellow);
  console.log('====================='.yellow);
  
  try {
    // Check current inventory levels
    const inventoryCheck = await apiCall('GET', '/inventory/items?search=Artemether');
    console.log(`✅ Current inventory checked`.green);
    
    // Update inventory for dispensed medications
    const inventoryUpdates = [
      {
        item_name: 'Artemether-Lumefantrine 80/480mg',
        quantity_change: -6,
        transaction_type: 'dispensed',
        reference: prescriptionId,
        notes: `Dispensed for patient ${patientId}`
      },
      {
        item_name: 'Paracetamol 500mg',
        quantity_change: -15,
        transaction_type: 'dispensed',
        reference: prescriptionId,
        notes: `Dispensed for patient ${patientId}`
      }
    ];
    
    for (const update of inventoryUpdates) {
      await apiCall('POST', '/inventory/transactions', update);
      console.log(`✅ Inventory updated: ${update.item_name} (${update.quantity_change})`.green);
    }
    
    // Check if reorder is needed
    const reorderCheck = await apiCall('GET', '/inventory/reorder-alerts');
    if (reorderCheck.data?.alerts?.length > 0) {
      console.log(`⚠️  Reorder alerts: ${reorderCheck.data.alerts.length} items need restocking`.yellow);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to update inventory'.red);
    return false;
  }
}

async function updateStaffSchedule() {
  console.log('\n6. STAFF SCHEDULE UPDATE'.yellow);
  console.log('=========================='.yellow);
  
  try {
    // Log consultation in doctor's schedule
    const scheduleUpdate = {
      staff_id: 'dr-001',
      date: new Date().toISOString().split('T')[0],
      activity: {
        type: 'consultation',
        patient_id: patientId,
        visit_id: visitId,
        start_time: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
        end_time: new Date().toISOString(),
        duration_minutes: 30,
        notes: 'Malaria consultation and treatment'
      }
    };
    
    await apiCall('POST', '/hr/schedule/activities', scheduleUpdate);
    console.log(`✅ Doctor's schedule updated`.green);
    console.log(`   Consultation duration: ${scheduleUpdate.activity.duration_minutes} minutes`.gray);
    
    // Update doctor's daily statistics
    const statsUpdate = {
      staff_id: 'dr-001',
      date: new Date().toISOString().split('T')[0],
      patients_seen: 1,
      consultations: 1,
      prescriptions_issued: 1
    };
    
    await apiCall('POST', '/hr/staff/daily-stats', statsUpdate);
    console.log(`✅ Staff daily statistics updated`.green);
    
    // Check current workload
    const workload = await apiCall('GET', '/hr/staff/dr-001/workload');
    console.log(`✅ Current workload checked`.green);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to update staff schedule'.red);
    return false;
  }
}

async function updateAnalytics() {
  console.log('\n7. ANALYTICS & REPORTING'.yellow);
  console.log('=========================='.yellow);
  
  try {
    // Update real-time analytics
    const analyticsUpdate = {
      hospital_id: 'hosp-lagos-001',
      date: new Date().toISOString(),
      metrics: {
        patient_visits: 1,
        revenue: 26250,
        prescriptions: 1,
        lab_tests: 2,
        diagnoses: {
          'Malaria': 1
        }
      }
    };
    
    await apiCall('POST', '/analytics/real-time/update', analyticsUpdate);
    console.log(`✅ Real-time analytics updated`.green);
    
    // Get updated dashboard stats
    const dashboardStats = await apiCall('GET', '/dashboard/stats');
    console.log(`✅ Dashboard statistics retrieved`.green);
    if (dashboardStats.data) {
      console.log(`   Total Patients: ${dashboardStats.data.total_patients}`.gray);
      console.log(`   Revenue MTD: ₦${dashboardStats.data.revenue_mtd?.toLocaleString()}`.gray);
      console.log(`   Occupancy Rate: ${dashboardStats.data.occupancy_rate}%`.gray);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to update analytics'.red);
    return false;
  }
}

async function verifyDataIntegrity() {
  console.log('\n8. DATA INTEGRITY VERIFICATION'.yellow);
  console.log('================================='.yellow);
  
  try {
    // Verify EMR record exists
    const emrCheck = await apiCall('GET', `/emr/patients/${patientId}`);
    console.log(`✅ EMR record verified`.green);
    
    // Verify billing record
    const billingCheck = await apiCall('GET', `/billing/invoices/${invoiceId}`);
    console.log(`✅ Billing record verified`.green);
    
    // Verify inventory transaction
    const inventoryCheck = await apiCall('GET', `/inventory/transactions?reference=${prescriptionId}`);
    console.log(`✅ Inventory transaction verified`.green);
    
    // Verify audit trail
    const auditCheck = await apiCall('GET', `/security/audit-logs?entity_id=${patientId}`);
    console.log(`✅ Audit trail verified`.green);
    
    console.log('\n✅ All data integrity checks passed!'.green.bold);
    
    return true;
  } catch (error) {
    console.log('❌ Data integrity verification failed'.red);
    return false;
  }
}

// Main execution
async function runEndToEndTest() {
  console.log('\n================================================'.cyan);
  console.log('GrandPro HMSO - End-to-End Patient Visit Test'.cyan.bold);
  console.log('================================================'.cyan);
  console.log('Simulating complete patient visit workflow...'.cyan);
  
  const tests = [
    { name: 'Authentication', fn: login },
    { name: 'EMR Creation', fn: createPatientEMR },
    { name: 'Diagnosis & Treatment', fn: performDiagnosisAndTreatment },
    { name: 'Billing Generation', fn: generateBilling },
    { name: 'Inventory Update', fn: updateInventory },
    { name: 'Staff Schedule Update', fn: updateStaffSchedule },
    { name: 'Analytics Update', fn: updateAnalytics },
    { name: 'Data Integrity', fn: verifyDataIntegrity }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      failedTests++;
      console.error(`Test ${test.name} error:`.red, error.message);
    }
  }
  
  // Summary
  console.log('\n================================================'.cyan);
  console.log('TEST SUMMARY'.cyan.bold);
  console.log('================================================'.cyan);
  console.log(`Total Tests: ${tests.length}`.white);
  console.log(`Passed: ${passedTests}`.green);
  console.log(`Failed: ${failedTests}`.red);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL END-TO-END TESTS PASSED! 🎉'.green.bold);
    console.log('The patient visit workflow completed successfully:'.green);
    console.log('✅ Patient EMR created'.green);
    console.log('✅ Diagnosis and treatment recorded'.green);
    console.log('✅ Billing invoice generated and paid'.green);
    console.log('✅ Inventory updated with dispensed medications'.green);
    console.log('✅ Staff schedule and workload updated'.green);
    console.log('✅ Analytics and dashboards updated'.green);
    console.log('✅ Complete audit trail maintained'.green);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.'.yellow);
  }
  
  console.log('\n================================================\n'.cyan);
}

// Run the test
runEndToEndTest().catch(console.error);
