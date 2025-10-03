#!/usr/bin/env node

/**
 * GrandPro HMSO - Comprehensive Functionality Test
 * Tests all public endpoints and ensures they are working properly
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

// Base URLs - Using the public exposed URL
const PUBLIC_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';
const BASE_URL = PUBLIC_URL;
const API_URL = `${BASE_URL}/api`;

// Test data
let testUser = null;
let authToken = null;
let testHospitalOwner = null;
let testPatient = null;
let testApplication = null;
let testContract = null;
let testAppointment = null;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log results
function logResult(test, success, details = '') {
  const status = success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  console.log(`${status} ${test}${details ? ': ' + details : ''}`);
  return success;
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test Categories
const testCategories = {
  system: 'System & Infrastructure',
  auth: 'Authentication & Authorization',
  onboarding: 'Digital Sourcing & Partner Onboarding',
  crm: 'CRM & Relationship Management',
  hospital: 'Hospital Management',
  operations: 'Operations & Analytics',
  integrations: 'Partner Integrations',
  security: 'Security & Compliance'
};

// Main test runner
async function runTests() {
  console.log('\n' + colors.cyan + '=' .repeat(70) + colors.reset);
  console.log(colors.cyan + 'GrandPro HMSO - Comprehensive Functionality Test' + colors.reset);
  console.log(colors.cyan + '=' .repeat(70) + colors.reset);
  console.log(colors.blue + `Testing URL: ${BASE_URL}` + colors.reset);
  console.log(colors.cyan + '=' .repeat(70) + colors.reset + '\n');
  
  const results = {};
  
  // 1. System & Infrastructure Tests
  console.log(colors.yellow + '\n📦 ' + testCategories.system + colors.reset);
  console.log('-'.repeat(50));
  results.system = [];
  
  // Test frontend accessibility
  const frontendTest = await apiCall('GET', BASE_URL);
  results.system.push(logResult('Frontend accessible', frontendTest.success && frontendTest.status === 200));
  
  // Test health endpoint
  const healthTest = await apiCall('GET', `${BASE_URL}/health`);
  results.system.push(logResult('Health endpoint', healthTest.success, 
    healthTest.data?.status || healthTest.error));
  
  // Test API base
  const apiTest = await apiCall('GET', '/health');
  results.system.push(logResult('API health check', apiTest.success));
  
  // 2. Authentication Tests
  console.log(colors.yellow + '\n🔐 ' + testCategories.auth + colors.reset);
  console.log('-'.repeat(50));
  results.auth = [];
  
  // Register a test user
  const timestamp = Date.now();
  const registerData = {
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@grandpro.ng`,
    password: 'Test@123456',
    role: 'hospital_owner',
    fullName: 'Test Hospital Owner',
    phoneNumber: '+2348012345678'
  };
  
  const registerTest = await apiCall('POST', '/auth/register', registerData);
  results.auth.push(logResult('User registration', registerTest.success));
  
  if (registerTest.success) {
    testUser = registerTest.data.user;
    
    // Login test
    const loginTest = await apiCall('POST', '/auth/login', {
      email: registerData.email,
      password: registerData.password
    });
    results.auth.push(logResult('User login', loginTest.success));
    
    if (loginTest.success) {
      authToken = loginTest.data.token;
    }
  }
  
  // 3. Digital Sourcing & Onboarding Tests
  console.log(colors.yellow + '\n🏥 ' + testCategories.onboarding + colors.reset);
  console.log('-'.repeat(50));
  results.onboarding = [];
  
  // Submit application
  const applicationData = {
    hospitalName: `Test Hospital ${timestamp}`,
    ownerName: 'Chief Test Owner',
    email: `hospital_${timestamp}@grandpro.ng`,
    phoneNumber: '+2348098765432',
    address: '123 Test Street, Lagos',
    state: 'Lagos',
    lga: 'Ikeja',
    hospitalType: 'General Hospital',
    bedCapacity: 50,
    servicesOffered: ['General Medicine', 'Surgery', 'Pediatrics'],
    hasOperatingLicense: true,
    licenseNumber: `LIC${timestamp}`,
    yearEstablished: 2020
  };
  
  const applicationTest = await apiCall('POST', '/onboarding/applications', applicationData);
  results.onboarding.push(logResult('Submit application', applicationTest.success));
  
  if (applicationTest.success) {
    testApplication = applicationTest.data;
    
    // Get application status
    const statusTest = await apiCall('GET', `/onboarding/applications/${testApplication.id}`);
    results.onboarding.push(logResult('Check application status', statusTest.success));
    
    // Upload documents (simulated)
    const documentTest = await apiCall('POST', `/onboarding/applications/${testApplication.id}/documents`, {
      documentType: 'operating_license',
      fileName: 'test_license.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf'
    });
    results.onboarding.push(logResult('Document upload simulation', documentTest.success));
    
    // Evaluation scoring
    const evaluationTest = await apiCall('POST', `/onboarding/applications/${testApplication.id}/evaluate`, {
      scores: {
        financial: 85,
        operational: 90,
        compliance: 95,
        infrastructure: 88
      }
    });
    results.onboarding.push(logResult('Application evaluation', evaluationTest.success));
    
    // Generate contract
    const contractTest = await apiCall('POST', `/onboarding/contracts/generate`, {
      applicationId: testApplication.id,
      terms: {
        duration: 24,
        revenueShare: 15,
        minimumPatients: 100
      }
    });
    results.onboarding.push(logResult('Contract generation', contractTest.success));
    
    if (contractTest.success) {
      testContract = contractTest.data;
      
      // Digital signature
      const signTest = await apiCall('POST', `/onboarding/contracts/${testContract.id}/sign`, {
        signatureData: 'base64_signature_data_here',
        signedBy: testUser?.id || 'test_user'
      });
      results.onboarding.push(logResult('Digital contract signing', signTest.success));
    }
  }
  
  // 4. CRM Tests
  console.log(colors.yellow + '\n👥 ' + testCategories.crm + colors.reset);
  console.log('-'.repeat(50));
  results.crm = [];
  
  // Owner CRM
  const ownerData = {
    name: `Hospital Owner ${timestamp}`,
    email: `owner_${timestamp}@grandpro.ng`,
    phoneNumber: '+2348011111111',
    hospitalId: testApplication?.id || 1,
    contractStatus: 'active'
  };
  
  const ownerTest = await apiCall('POST', '/crm-v2/owners', ownerData);
  results.crm.push(logResult('Create owner record', ownerTest.success));
  
  if (ownerTest.success) {
    testHospitalOwner = ownerTest.data;
    
    // Get owner stats
    const statsTest = await apiCall('GET', `/crm-v2/owners/stats`);
    results.crm.push(logResult('Owner statistics', statsTest.success));
    
    // Track payout
    const payoutTest = await apiCall('POST', `/crm-v2/owners/${testHospitalOwner.id}/payouts`, {
      amount: 500000,
      month: new Date().toISOString().slice(0, 7),
      status: 'pending'
    });
    results.crm.push(logResult('Track owner payout', payoutTest.success));
  }
  
  // Patient CRM
  const patientData = {
    firstName: 'Test',
    lastName: 'Patient',
    email: `patient_${timestamp}@grandpro.ng`,
    phoneNumber: '+2348022222222',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    address: '456 Patient Street, Abuja'
  };
  
  const patientTest = await apiCall('POST', '/crm-v2/patients', patientData);
  results.crm.push(logResult('Create patient record', patientTest.success));
  
  if (patientTest.success) {
    testPatient = patientTest.data;
    
    // Schedule appointment
    const appointmentData = {
      patientId: testPatient.id,
      hospitalId: 1,
      doctorId: 1,
      appointmentDate: new Date(Date.now() + 86400000).toISOString(),
      reason: 'General Checkup',
      status: 'scheduled'
    };
    
    const appointmentTest = await apiCall('POST', '/crm-v2/appointments', appointmentData);
    results.crm.push(logResult('Schedule appointment', appointmentTest.success));
    
    if (appointmentTest.success) {
      testAppointment = appointmentTest.data;
      
      // Send reminder
      const reminderTest = await apiCall('POST', `/crm-v2/appointments/${testAppointment.id}/reminder`, {
        method: 'sms'
      });
      results.crm.push(logResult('Send appointment reminder', reminderTest.success));
    }
    
    // Loyalty program
    const loyaltyTest = await apiCall('POST', `/crm-v2/patients/${testPatient.id}/loyalty/points`, {
      points: 100,
      reason: 'appointment_completed'
    });
    results.crm.push(logResult('Award loyalty points', loyaltyTest.success));
    
    // Patient feedback
    const feedbackTest = await apiCall('POST', '/crm-v2/feedback', {
      patientId: testPatient.id,
      rating: 5,
      category: 'service',
      message: 'Excellent service!'
    });
    results.crm.push(logResult('Submit patient feedback', feedbackTest.success));
  }
  
  // Communication campaign
  const campaignTest = await apiCall('POST', '/crm-v2/campaigns', {
    name: `Health Campaign ${timestamp}`,
    type: 'health_promotion',
    channel: 'sms',
    message: 'Stay healthy with regular checkups!',
    targetAudience: 'all_patients'
  });
  results.crm.push(logResult('Create communication campaign', campaignTest.success));
  
  // 5. Hospital Management Tests
  console.log(colors.yellow + '\n🏨 ' + testCategories.hospital + colors.reset);
  console.log('-'.repeat(50));
  results.hospital = [];
  
  // EMR - Create patient record
  const emrTest = await apiCall('POST', '/emr/patients', {
    ...patientData,
    medicalRecordNumber: `MRN${timestamp}`
  });
  results.hospital.push(logResult('Create EMR record', emrTest.success));
  
  // Billing
  const billingTest = await apiCall('POST', '/billing/invoices', {
    patientId: testPatient?.id || 1,
    items: [
      { description: 'Consultation', amount: 5000 },
      { description: 'Lab Test', amount: 15000 }
    ],
    paymentMethod: 'cash',
    status: 'pending'
  });
  results.hospital.push(logResult('Generate invoice', billingTest.success));
  
  // Inventory
  const inventoryTest = await apiCall('POST', '/inventory/items', {
    name: `Test Drug ${timestamp}`,
    category: 'medication',
    quantity: 100,
    unit: 'tablets',
    reorderLevel: 20,
    unitPrice: 50
  });
  results.hospital.push(logResult('Add inventory item', inventoryTest.success));
  
  // HR & Rostering
  const staffTest = await apiCall('POST', '/hr/staff', {
    name: `Dr. Test ${timestamp}`,
    role: 'doctor',
    department: 'General Medicine',
    email: `doctor_${timestamp}@grandpro.ng`,
    phoneNumber: '+2348033333333'
  });
  results.hospital.push(logResult('Add staff member', staffTest.success));
  
  // Real-time analytics
  const analyticsTest = await apiCall('GET', '/analytics/dashboard');
  results.hospital.push(logResult('Get analytics dashboard', analyticsTest.success));
  
  // 6. Operations Management Tests
  console.log(colors.yellow + '\n📊 ' + testCategories.operations + colors.reset);
  console.log('-'.repeat(50));
  results.operations = [];
  
  // Operations dashboard
  const opsTest = await apiCall('GET', '/operations/dashboard');
  results.operations.push(logResult('Operations dashboard', opsTest.success));
  
  // Multi-hospital metrics
  const metricsTest = await apiCall('GET', '/operations/metrics/multi-hospital');
  results.operations.push(logResult('Multi-hospital metrics', metricsTest.success));
  
  // Alerts
  const alertsTest = await apiCall('GET', '/operations/alerts');
  results.operations.push(logResult('System alerts', alertsTest.success));
  
  // Project management
  const projectTest = await apiCall('POST', '/operations/projects', {
    name: `Expansion Project ${timestamp}`,
    type: 'infrastructure',
    status: 'planning',
    budget: 10000000,
    startDate: new Date().toISOString()
  });
  results.operations.push(logResult('Create project', projectTest.success));
  
  // 7. Partner Integrations Tests
  console.log(colors.yellow + '\n🤝 ' + testCategories.integrations + colors.reset);
  console.log('-'.repeat(50));
  results.integrations = [];
  
  // Insurance integration
  const insuranceTest = await apiCall('POST', '/insurance/claims', {
    patientId: testPatient?.id || 1,
    providerId: 'NHIS',
    claimAmount: 50000,
    services: ['consultation', 'lab_test']
  });
  results.integrations.push(logResult('Insurance claim submission', insuranceTest.success));
  
  // Pharmacy integration
  const pharmacyTest = await apiCall('POST', '/pharmacy/orders', {
    items: [
      { drugId: 1, quantity: 50 }
    ],
    supplier: 'MedSupply Nigeria',
    deliveryDate: new Date(Date.now() + 172800000).toISOString()
  });
  results.integrations.push(logResult('Pharmacy order', pharmacyTest.success));
  
  // Telemedicine
  const telemedTest = await apiCall('POST', '/telemedicine/consultations', {
    patientId: testPatient?.id || 1,
    doctorId: 1,
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    type: 'video'
  });
  results.integrations.push(logResult('Telemedicine consultation', telemedTest.success));
  
  // 8. Security & Compliance Tests
  console.log(colors.yellow + '\n🔒 ' + testCategories.security + colors.reset);
  console.log('-'.repeat(50));
  results.security = [];
  
  // Audit logs
  const auditTest = await apiCall('GET', '/security/audit-logs?limit=10');
  results.security.push(logResult('Audit logs access', auditTest.success));
  
  // Role-based access test
  const rbacTest = await apiCall('GET', '/users/permissions');
  results.security.push(logResult('RBAC verification', rbacTest.success));
  
  // Data encryption test
  const encryptTest = await apiCall('POST', '/security/test-encryption', {
    data: 'sensitive_patient_data'
  });
  results.security.push(logResult('Data encryption', encryptTest.success));
  
  // Generate summary
  console.log(colors.cyan + '\n' + '=' .repeat(70) + colors.reset);
  console.log(colors.cyan + 'Test Summary' + colors.reset);
  console.log(colors.cyan + '=' .repeat(70) + colors.reset);
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [category, tests] of Object.entries(results)) {
    const passed = tests.filter(t => t).length;
    const total = tests.length;
    totalTests += total;
    passedTests += passed;
    
    const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const status = passed === total ? colors.green : passed > 0 ? colors.yellow : colors.red;
    
    console.log(`${status}${testCategories[category]}: ${passed}/${total} (${percentage}%)${colors.reset}`);
  }
  
  console.log(colors.cyan + '-'.repeat(70) + colors.reset);
  const overallPercentage = ((passedTests / totalTests) * 100).toFixed(1);
  const overallStatus = passedTests === totalTests ? colors.green : passedTests > totalTests * 0.8 ? colors.yellow : colors.red;
  console.log(`${overallStatus}Overall: ${passedTests}/${totalTests} tests passed (${overallPercentage}%)${colors.reset}`);
  console.log(colors.cyan + '=' .repeat(70) + colors.reset + '\n');
  
  // Test public URLs
  console.log(colors.blue + '\n📍 Testing Public URL Accessibility' + colors.reset);
  console.log('-'.repeat(50));
  
  const publicUrls = [
    { name: 'Frontend Home', url: PUBLIC_URL },
    { name: 'Health Check', url: `${PUBLIC_URL}/health` },
    { name: 'API Health', url: `${PUBLIC_URL}/api/health` },
    { name: 'Login Page', url: `${PUBLIC_URL}/login` },
    { name: 'Onboarding', url: `${PUBLIC_URL}/onboarding` },
    { name: 'Dashboard', url: `${PUBLIC_URL}/dashboard` },
    { name: 'Patient Portal', url: `${PUBLIC_URL}/patient-portal` },
    { name: 'Owner Portal', url: `${PUBLIC_URL}/owner-portal` }
  ];
  
  for (const {name, url} of publicUrls) {
    try {
      const response = await axios.get(url, { 
        validateStatus: (status) => status < 500,
        timeout: 5000 
      });
      const success = response.status < 400;
      console.log(`${success ? colors.green + '✓' : colors.yellow + '⚠'} ${colors.reset}${name}: ${url} (${response.status})`);
    } catch (error) {
      console.log(`${colors.red}✗ ${colors.reset}${name}: ${url} (${error.message})`);
    }
  }
  
  return {
    totalTests,
    passedTests,
    percentage: overallPercentage,
    success: passedTests === totalTests
  };
}

// Run tests
if (require.main === module) {
  runTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(colors.red + 'Test execution failed:' + colors.reset, error);
      process.exit(1);
    });
}

module.exports = { runTests };
