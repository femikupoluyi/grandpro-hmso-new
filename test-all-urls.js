#!/usr/bin/env node

const axios = require('axios');

// Test URLs
const BASE_URL = 'http://localhost';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testAdmin = {
  email: 'admin@grandpro.com',
  password: 'Admin123!'
};

const testOwner = {
  email: 'john.owner@example.com',
  password: 'password123'
};

const testPatient = {
  email: 'patient1@example.com',
  password: 'password123'
};

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    console.log(`✅ ${name}: ${response.status} - ${url}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${name}: ${error.response.status} - ${url} - ${error.response.data?.message || error.message}`);
    } else {
      console.log(`❌ ${name}: Network error - ${url} - ${error.message}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('🏥 GrandPro HMSO - Testing All Public URLs\n');
  console.log('==========================================\n');

  // Test health check
  console.log('🔍 Testing Health Endpoints:');
  await testEndpoint('Frontend Health', 'GET', `${BASE_URL}/`);
  await testEndpoint('Backend Health', 'GET', `${BASE_URL}/health`);
  await testEndpoint('API Health', 'GET', `${API_BASE}/health`);
  
  console.log('\n🔐 Testing Authentication:');
  // Test authentication
  const adminLogin = await testEndpoint(
    'Admin Login',
    'POST',
    `${API_BASE}/auth/login`,
    testAdmin
  );
  
  const ownerLogin = await testEndpoint(
    'Owner Login',
    'POST',
    `${API_BASE}/auth/login`,
    testOwner
  );
  
  const patientLogin = await testEndpoint(
    'Patient Login',
    'POST',
    `${API_BASE}/auth/login`,
    testPatient
  );
  
  const adminToken = adminLogin?.token;
  const ownerToken = ownerLogin?.token;
  const patientToken = patientLogin?.token;
  
  console.log('\n📊 Testing Dashboard & Stats:');
  // Test dashboard endpoints
  await testEndpoint('Dashboard Stats', 'GET', `${API_BASE}/dashboard/stats`);
  await testEndpoint('System Info', 'GET', `${API_BASE}/system/info`);
  await testEndpoint('System Status', 'GET', `${API_BASE}/system/status`);
  
  console.log('\n🏥 Testing Hospital Management:');
  // Test hospital endpoints
  await testEndpoint('List Hospitals', 'GET', `${API_BASE}/hospitals`);
  await testEndpoint('Hospital Applications', 'GET', `${API_BASE}/hospital/applications`);
  
  if (adminToken) {
    console.log('\n👤 Testing Admin Features:');
    await testEndpoint(
      'Admin Dashboard',
      'GET',
      `${API_BASE}/admin/dashboard`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    
    await testEndpoint(
      'List Users',
      'GET',
      `${API_BASE}/users`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    
    await testEndpoint(
      'Operations Command Centre',
      'GET',
      `${API_BASE}/operations/command-centre/dashboard`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    
    await testEndpoint(
      'Analytics Overview',
      'GET',
      `${API_BASE}/analytics/overview`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
  }
  
  if (ownerToken) {
    console.log('\n🏢 Testing Owner Features:');
    await testEndpoint(
      'Owner Profile',
      'GET',
      `${API_BASE}/crm/owners/profile`,
      null,
      { Authorization: `Bearer ${ownerToken}` }
    );
    
    await testEndpoint(
      'Owner Contracts',
      'GET',
      `${API_BASE}/crm/owners/contracts`,
      null,
      { Authorization: `Bearer ${ownerToken}` }
    );
  }
  
  if (patientToken) {
    console.log('\n🏥 Testing Patient Features:');
    await testEndpoint(
      'Patient Profile',
      'GET',
      `${API_BASE}/crm/patients/profile`,
      null,
      { Authorization: `Bearer ${patientToken}` }
    );
    
    await testEndpoint(
      'Patient Appointments',
      'GET',
      `${API_BASE}/crm/patients/appointments`,
      null,
      { Authorization: `Bearer ${patientToken}` }
    );
  }
  
  console.log('\n🔌 Testing Integration Endpoints:');
  // Test integration endpoints
  await testEndpoint('Insurance Providers', 'GET', `${API_BASE}/insurance/providers`);
  await testEndpoint('Pharmacy Suppliers', 'GET', `${API_BASE}/pharmacy/suppliers`);
  await testEndpoint('Telemedicine Status', 'GET', `${API_BASE}/telemedicine/status`);
  
  console.log('\n📈 Testing Analytics:');
  // Test analytics endpoints
  await testEndpoint('Hospital Analytics', 'GET', `${API_BASE}/hospital-analytics/overview`);
  await testEndpoint('Predictive Analytics', 'GET', `${API_BASE}/analytics/predictive/demand`);
  
  console.log('\n🔒 Testing Security:');
  // Test security endpoints
  await testEndpoint('Security Status', 'GET', `${API_BASE}/security/status`);
  await testEndpoint('Compliance Check', 'GET', `${API_BASE}/security/compliance`);
  
  console.log('\n==========================================');
  console.log('✅ Testing Complete!\n');
  
  // Test public access from external URL if available
  console.log('🌐 Testing External Access:');
  console.log('The application should be accessible at:');
  console.log('- Internal: http://localhost');
  console.log('- External: Check your cloud provider for the public URL');
  console.log('\n📝 Login Credentials:');
  console.log('Admin: admin@grandpro.com / Admin123!');
  console.log('Hospital Owner: john.owner@example.com / password123');
  console.log('Patient: patient1@example.com / password123');
  console.log('Doctor: dr.adebayo@luth.ng / password123');
  console.log('Nurse: nurse.funke@luth.ng / password123');
}

// Run the tests
runTests().catch(console.error);
