#!/usr/bin/env node

/**
 * Test all public URLs and functionality
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';
const API_URL = `${BASE_URL}/api`;

// Test data
const testOwner = {
  ownerName: 'Dr. Chidi Okonkwo',
  ownerEmail: `chidi.okonkwo.${Date.now()}@hospital.ng`,
  ownerPhone: '+2348012345678',
  hospitalName: 'Lagos Premier Hospital',
  hospitalType: 'tertiary',
  state: 'Lagos',
  lga: 'Lagos Island',
  address: '123 Marina Road, Lagos Island',
  bedCapacity: 150,
  staffCount: 200,
  specialties: ['Cardiology', 'Oncology', 'Neurology'],
  services: ['Emergency', 'ICU', 'Laboratory', 'Radiology'],
  cacNumber: 'RC1234567',
  tinNumber: 'TIN-98765432',
  nhisNumber: 'NHIS-456789'
};

const testPatient = {
  firstName: 'Amaka',
  lastName: 'Okafor',
  email: `amaka.okafor.${Date.now()}@example.com`,
  phone: '+2348098765432',
  dateOfBirth: '1990-05-15',
  gender: 'female',
  address: '45 Victoria Island, Lagos',
  password: 'Test@1234',
  bloodType: 'O+',
  allergies: ['Penicillin'],
  emergencyContact: {
    name: 'Emeka Okafor',
    phone: '+2348055667788',
    relationship: 'Brother'
  }
};

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, data = null, description = '') {
  try {
    const config = {
      method,
      url: `${API_URL}${path}`,
      data,
      timeout: 5000
    };

    const response = await axios(config);
    log(`✓ ${method} ${path} - ${description || 'Success'}`, 'green');
    return response.data;
  } catch (error) {
    if (error.response) {
      log(`✗ ${method} ${path} - ${error.response.status}: ${error.response.data?.error?.message || error.message}`, 'red');
    } else if (error.code === 'ECONNABORTED') {
      log(`✗ ${method} ${path} - Request timeout`, 'yellow');
    } else {
      log(`✗ ${method} ${path} - ${error.message}`, 'red');
    }
    return null;
  }
}

async function testFrontendPages() {
  log('\n=== Testing Frontend Pages ===\n', 'cyan');
  
  const pages = [
    { path: '/', name: 'Home Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/onboarding', name: 'Onboarding Module' },
    { path: '/application', name: 'Application Form' },
    { path: '/documents', name: 'Document Upload' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/patient-portal', name: 'Patient Portal' },
    { path: '/owner-portal', name: 'Owner Portal' },
    { path: '/appointments', name: 'Appointments' },
    { path: '/medical-records', name: 'Medical Records' },
    { path: '/billing', name: 'Billing' },
    { path: '/inventory', name: 'Inventory' },
    { path: '/hr', name: 'HR Management' },
    { path: '/operations', name: 'Operations Center' }
  ];

  for (const page of pages) {
    try {
      const response = await axios.get(`${BASE_URL}${page.path}`, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      if (response.status === 200) {
        log(`✓ ${page.name} (${page.path}) - Accessible`, 'green');
      } else {
        log(`⚠ ${page.name} (${page.path}) - Status ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`✗ ${page.name} (${page.path}) - ${error.message}`, 'red');
    }
  }
}

async function testOnboardingModule() {
  log('\n=== Testing Onboarding Module ===\n', 'cyan');
  
  // 1. Register hospital owner
  const registration = await testEndpoint('POST', '/onboarding/register', testOwner, 'Register Hospital Owner');
  
  if (registration && registration.applicationId) {
    const applicationId = registration.applicationId;
    log(`  Application ID: ${applicationId}`, 'blue');
    
    // 2. Get document types
    const docTypes = await testEndpoint('GET', '/onboarding/document-types', null, 'Get Document Types');
    
    // 3. Upload a sample document (simulate)
    if (docTypes && docTypes.length > 0) {
      // Note: Actual file upload would require a real file
      log('  ⚠ Document upload requires actual files - skipping simulation', 'yellow');
    }
    
    // 4. Check application status
    await testEndpoint('GET', `/onboarding/applications/${applicationId}/status`, null, 'Check Application Status');
    
    // 5. Trigger evaluation
    await testEndpoint('POST', `/onboarding/applications/${applicationId}/evaluate`, null, 'Evaluate Application');
    
    // 6. Generate contract
    await testEndpoint('POST', `/onboarding/applications/${applicationId}/generate-contract`, null, 'Generate Contract');
  }
}

async function testCRMModule() {
  log('\n=== Testing CRM Module ===\n', 'cyan');
  
  // Owner CRM
  await testEndpoint('GET', '/crm/owners', null, 'List Owners');
  await testEndpoint('GET', '/crm/owners/stats', null, 'Owner Statistics');
  
  // Patient CRM
  const patient = await testEndpoint('POST', '/crm/patients/register', testPatient, 'Register Patient');
  
  if (patient && patient.id) {
    await testEndpoint('GET', `/crm/patients/${patient.id}`, null, 'Get Patient Details');
    
    // Schedule appointment
    const appointment = {
      patientId: patient.id,
      hospitalId: 'HOSP001',
      departmentId: 'DEPT001',
      doctorId: 'DOC001',
      appointmentDate: '2025-10-10',
      appointmentTime: '10:00',
      reason: 'General Checkup'
    };
    
    await testEndpoint('POST', '/crm/appointments', appointment, 'Schedule Appointment');
  }
  
  // Communication
  await testEndpoint('GET', '/crm/campaigns', null, 'List Campaigns');
  await testEndpoint('GET', '/crm/messages/templates', null, 'Message Templates');
}

async function testHospitalManagement() {
  log('\n=== Testing Hospital Management ===\n', 'cyan');
  
  // EMR
  await testEndpoint('GET', '/hospital/emr/patients', null, 'List Patients (EMR)');
  await testEndpoint('GET', '/hospital/emr/stats', null, 'EMR Statistics');
  
  // Billing
  await testEndpoint('GET', '/hospital/billing/invoices', null, 'List Invoices');
  await testEndpoint('GET', '/hospital/billing/stats', null, 'Billing Statistics');
  
  // Inventory
  await testEndpoint('GET', '/hospital/inventory/items', null, 'List Inventory Items');
  await testEndpoint('GET', '/hospital/inventory/stats', null, 'Inventory Statistics');
  
  // HR
  await testEndpoint('GET', '/hospital/hr/staff', null, 'List Staff');
  await testEndpoint('GET', '/hospital/hr/schedules', null, 'Staff Schedules');
  await testEndpoint('GET', '/hospital/hr/stats', null, 'HR Statistics');
}

async function testOperationsCenter() {
  log('\n=== Testing Operations Center ===\n', 'cyan');
  
  await testEndpoint('GET', '/operations/dashboard', null, 'Operations Dashboard');
  await testEndpoint('GET', '/operations/metrics', null, 'Operations Metrics');
  await testEndpoint('GET', '/operations/alerts', null, 'System Alerts');
  await testEndpoint('GET', '/operations/projects', null, 'Development Projects');
}

async function testPartnerIntegrations() {
  log('\n=== Testing Partner Integrations ===\n', 'cyan');
  
  // Insurance
  await testEndpoint('GET', '/integrations/insurance/providers', null, 'Insurance Providers');
  await testEndpoint('GET', '/integrations/insurance/claims', null, 'Insurance Claims');
  
  // Pharmacy
  await testEndpoint('GET', '/integrations/pharmacy/suppliers', null, 'Pharmacy Suppliers');
  
  // Telemedicine
  await testEndpoint('GET', '/integrations/telemedicine/sessions', null, 'Telemedicine Sessions');
}

async function testDataAnalytics() {
  log('\n=== Testing Data & Analytics ===\n', 'cyan');
  
  await testEndpoint('GET', '/analytics/overview', null, 'Analytics Overview');
  await testEndpoint('GET', '/analytics/patient-flow', null, 'Patient Flow Analytics');
  await testEndpoint('GET', '/analytics/revenue', null, 'Revenue Analytics');
  await testEndpoint('GET', '/analytics/predictions', null, 'Predictive Analytics');
}

async function testHealthCheck() {
  log('\n=== Testing System Health ===\n', 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    log(`✓ Backend Health Check - ${response.data.status}`, 'green');
    log(`  Service: ${response.data.service}`, 'blue');
    log(`  Environment: ${response.data.environment}`, 'blue');
    log(`  Timestamp: ${response.data.timestamp}`, 'blue');
  } catch (error) {
    log(`✗ Backend Health Check - ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('\n========================================', 'cyan');
  log('  GrandPro HMSO - Public URL Testing', 'cyan');
  log('========================================', 'cyan');
  log(`\nBase URL: ${BASE_URL}`, 'blue');
  log(`API URL: ${API_URL}`, 'blue');
  
  await testHealthCheck();
  await testFrontendPages();
  await testOnboardingModule();
  await testCRMModule();
  await testHospitalManagement();
  await testOperationsCenter();
  await testPartnerIntegrations();
  await testDataAnalytics();
  
  log('\n========================================', 'cyan');
  log('  Testing Complete', 'cyan');
  log('========================================\n', 'cyan');
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
