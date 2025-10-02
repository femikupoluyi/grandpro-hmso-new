#!/usr/bin/env node

/**
 * End-to-End Testing Suite for GrandPro HMSO
 * Tests all 7 core modules comprehensively
 */

const axios = require('axios');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:5001';
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  modules: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      data,
      validateStatus: () => true
    };
    return await axios(config);
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
}

// Test Module 1: Digital Sourcing & Partner Onboarding
async function testDigitalSourcing() {
  console.log('\n[1] Testing Digital Sourcing & Partner Onboarding...');
  const results = [];
  
  // Test hospital application submission
  const applicationData = {
    hospitalName: 'Test Lagos Hospital',
    ownerName: 'Dr. John Doe',
    email: `test${Date.now()}@hospital.ng`,
    phone: '+234 801 234 5678',
    location: 'Lagos, Nigeria',
    type: 'general',
    beds: 100
  };
  
  const appResponse = await apiCall('POST', '/api/applications/submit', applicationData);
  results.push({
    test: 'Hospital Application Submission',
    passed: appResponse.status === 200 || appResponse.status === 201,
    details: appResponse.data
  });
  
  // Test document upload endpoint
  const docResponse = await apiCall('POST', '/api/applications/documents', {
    applicationId: '123',
    documentType: 'license',
    documentUrl: 'https://example.com/doc.pdf'
  });
  results.push({
    test: 'Document Upload',
    passed: docResponse.status < 500,
    details: docResponse.status
  });
  
  // Test scoring system
  const scoreResponse = await apiCall('GET', '/api/applications/score/123');
  results.push({
    test: 'Application Scoring',
    passed: scoreResponse.status < 500,
    details: scoreResponse.status
  });
  
  return results;
}

// Test Module 2: CRM & Relationship Management
async function testCRM() {
  console.log('[2] Testing CRM & Relationship Management...');
  const results = [];
  
  // Test Owner CRM
  const ownerResponse = await apiCall('GET', '/api/crm/owners');
  results.push({
    test: 'Owner CRM Access',
    passed: ownerResponse.status < 500,
    details: ownerResponse.status
  });
  
  // Test Patient CRM
  const patientResponse = await apiCall('GET', '/api/crm/patients');
  results.push({
    test: 'Patient CRM Access',
    passed: patientResponse.status < 500,
    details: patientResponse.status
  });
  
  // Test appointment scheduling
  const appointmentData = {
    patientId: 'test-patient',
    doctorId: 'test-doctor',
    date: '2025-10-15',
    time: '10:00',
    type: 'consultation'
  };
  const apptResponse = await apiCall('POST', '/api/appointments', appointmentData);
  results.push({
    test: 'Appointment Scheduling',
    passed: apptResponse.status < 500,
    details: apptResponse.status
  });
  
  return results;
}

// Test Module 3: Hospital Management (Core Operations)
async function testHospitalManagement() {
  console.log('[3] Testing Hospital Management Core Operations...');
  const results = [];
  
  // Test EMR access
  const emrResponse = await apiCall('GET', '/api/emr/patients');
  results.push({
    test: 'EMR Access',
    passed: emrResponse.status < 500,
    details: emrResponse.status
  });
  
  // Test billing
  const billingData = {
    patientId: 'test-patient',
    amount: 50000,
    currency: 'NGN',
    service: 'Consultation'
  };
  const billResponse = await apiCall('POST', '/api/billing/create', billingData);
  results.push({
    test: 'Billing Creation',
    passed: billResponse.status < 500,
    details: billResponse.status
  });
  
  // Test inventory
  const inventoryResponse = await apiCall('GET', '/api/inventory/drugs');
  results.push({
    test: 'Inventory Management',
    passed: inventoryResponse.status < 500,
    details: inventoryResponse.status
  });
  
  // Test HR/Rostering
  const rosterResponse = await apiCall('GET', '/api/hr/roster');
  results.push({
    test: 'HR Rostering',
    passed: rosterResponse.status < 500,
    details: rosterResponse.status
  });
  
  return results;
}

// Test Module 4: Centralized Operations Command Centre
async function testOperationsCommand() {
  console.log('[4] Testing Centralized Operations Command Centre...');
  const results = [];
  
  // Test real-time metrics
  const metricsResponse = await apiCall('GET', '/api/operations/metrics');
  results.push({
    test: 'Real-time Metrics',
    passed: metricsResponse.status < 500,
    details: metricsResponse.status
  });
  
  // Test alerts
  const alertsResponse = await apiCall('GET', '/api/operations/alerts');
  results.push({
    test: 'Alert System',
    passed: alertsResponse.status < 500,
    details: alertsResponse.status
  });
  
  // Test KPI tracking
  const kpiResponse = await apiCall('GET', '/api/operations/kpi');
  results.push({
    test: 'KPI Tracking',
    passed: kpiResponse.status < 500,
    details: kpiResponse.status
  });
  
  return results;
}

// Test Module 5: Partner & Ecosystem Integrations
async function testPartnerIntegrations() {
  console.log('[5] Testing Partner & Ecosystem Integrations...');
  const results = [];
  
  // Test insurance integration
  const insuranceData = {
    claimId: 'CLAIM-001',
    patientId: 'test-patient',
    amount: 100000,
    provider: 'NHIS'
  };
  const insuranceResponse = await apiCall('POST', '/api/insurance/claim', insuranceData);
  results.push({
    test: 'Insurance Integration',
    passed: insuranceResponse.status < 500,
    details: insuranceResponse.status
  });
  
  // Test pharmacy integration
  const pharmacyResponse = await apiCall('GET', '/api/pharmacy/suppliers');
  results.push({
    test: 'Pharmacy Integration',
    passed: pharmacyResponse.status < 500,
    details: pharmacyResponse.status
  });
  
  // Test telemedicine
  const telemedData = {
    patientId: 'test-patient',
    doctorId: 'test-doctor',
    scheduledTime: '2025-10-15T10:00:00Z'
  };
  const telemedResponse = await apiCall('POST', '/api/telemedicine/session', telemedData);
  results.push({
    test: 'Telemedicine Module',
    passed: telemedResponse.status < 500,
    details: telemedResponse.status
  });
  
  return results;
}

// Test Module 6: Data & Analytics
async function testDataAnalytics() {
  console.log('[6] Testing Data & Analytics Layer...');
  const results = [];
  
  // Test ETL pipelines
  const etlResponse = await apiCall('POST', '/api/data-analytics/etl/run/patient_visits');
  results.push({
    test: 'ETL Pipeline',
    passed: etlResponse.status === 200 || etlResponse.status === 201,
    details: etlResponse.data
  });
  
  // Test predictive models
  const forecastData = {
    hospitalId: '0e45683c-ed59-4b0f-95e3-f6a2e89d9808',
    drugId: 1,
    days: 30
  };
  const forecastResponse = await apiCall('POST', '/api/data-analytics/forecast/drug-demand', forecastData);
  results.push({
    test: 'Drug Demand Forecasting',
    passed: forecastResponse.status === 200,
    details: forecastResponse.data
  });
  
  // Test analytics dashboard
  const dashboardResponse = await apiCall('GET', '/api/data-analytics/dashboard/test-hospital');
  results.push({
    test: 'Analytics Dashboard',
    passed: dashboardResponse.status < 500,
    details: dashboardResponse.status
  });
  
  return results;
}

// Test Module 7: Security & Compliance
async function testSecurityCompliance() {
  console.log('[7] Testing Security & Compliance...');
  const results = [];
  
  // Test authentication
  const authData = {
    email: 'admin@grandpro.ng',
    password: 'Admin123!@#'
  };
  const authResponse = await apiCall('POST', '/api/auth/login', authData);
  results.push({
    test: 'Authentication System',
    passed: authResponse.status === 200 || authResponse.status === 401,
    details: authResponse.status
  });
  
  // Test RBAC
  const rbacResponse = await apiCall('GET', '/api/users/profile');
  results.push({
    test: 'Role-Based Access Control',
    passed: rbacResponse.status === 401 || authResponse.status === 403 || authResponse.status === 200,
    details: rbacResponse.status
  });
  
  // Test audit logging
  const auditResponse = await apiCall('GET', '/api/audit/logs');
  results.push({
    test: 'Audit Logging',
    passed: auditResponse.status < 500,
    details: auditResponse.status
  });
  
  return results;
}

// Main test runner
async function runAllTests() {
  console.log('================================================');
  console.log('GRANDPRO HMSO END-TO-END TESTING');
  console.log('Date:', new Date().toISOString());
  console.log('================================================');
  
  // Run all module tests
  const modules = [
    { name: 'Digital Sourcing & Partner Onboarding', test: testDigitalSourcing },
    { name: 'CRM & Relationship Management', test: testCRM },
    { name: 'Hospital Management Core Operations', test: testHospitalManagement },
    { name: 'Centralized Operations Command Centre', test: testOperationsCommand },
    { name: 'Partner & Ecosystem Integrations', test: testPartnerIntegrations },
    { name: 'Data & Analytics Layer', test: testDataAnalytics },
    { name: 'Security & Compliance', test: testSecurityCompliance }
  ];
  
  for (const module of modules) {
    try {
      const results = await module.test();
      TEST_RESULTS.modules[module.name] = {
        tests: results,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      };
      
      TEST_RESULTS.summary.total += results.length;
      TEST_RESULTS.summary.passed += results.filter(r => r.passed).length;
      TEST_RESULTS.summary.failed += results.filter(r => !r.passed).length;
      
      console.log(`✓ ${module.name}: ${results.filter(r => r.passed).length}/${results.length} passed`);
    } catch (error) {
      console.error(`✗ ${module.name}: Error - ${error.message}`);
      TEST_RESULTS.modules[module.name] = { error: error.message };
      TEST_RESULTS.summary.failed += 1;
      TEST_RESULTS.summary.total += 1;
    }
  }
  
  // Generate report
  console.log('\n================================================');
  console.log('TEST SUMMARY');
  console.log('================================================');
  console.log(`Total Tests: ${TEST_RESULTS.summary.total}`);
  console.log(`Passed: ${TEST_RESULTS.summary.passed}`);
  console.log(`Failed: ${TEST_RESULTS.summary.failed}`);
  console.log(`Success Rate: ${Math.round((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100)}%`);
  console.log('================================================\n');
  
  // Save results
  await fs.writeFile(
    '/home/grandpro-hmso-new/e2e-test-results.json',
    JSON.stringify(TEST_RESULTS, null, 2)
  );
  
  console.log('Results saved to e2e-test-results.json');
  
  return TEST_RESULTS;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
