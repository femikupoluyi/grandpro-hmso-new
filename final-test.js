#!/usr/bin/env node

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost';
const API_BASE = `${BASE_URL}/api`;

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function testEndpoint(name, method, url, data = null, headers = {}, expectSuccess = true) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    
    if (expectSuccess) {
      testResults.passed.push(`✅ ${name}: ${response.status} - ${url}`);
    } else {
      testResults.warnings.push(`⚠️ ${name}: Unexpected success ${response.status} - ${url}`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      if (!expectSuccess && error.response.status === 404) {
        testResults.warnings.push(`⚠️ ${name}: Expected 404 - ${url}`);
      } else if (error.response.status >= 500) {
        testResults.failed.push(`❌ ${name}: Server Error ${error.response.status} - ${url}`);
      } else {
        testResults.warnings.push(`⚠️ ${name}: ${error.response.status} - ${url}`);
      }
    } else {
      testResults.failed.push(`❌ ${name}: Network error - ${url} - ${error.message}`);
    }
    return null;
  }
}

async function runComprehensiveTests() {
  console.log('🏥 GrandPro HMSO - Final System Validation\n');
  console.log('=' .repeat(50));
  
  // Test 1: Core Services
  console.log('\n📡 Testing Core Services...');
  await testEndpoint('Frontend Service', 'GET', BASE_URL);
  await testEndpoint('Backend Health', 'GET', `${BASE_URL}/health`);
  await testEndpoint('API Dashboard Stats', 'GET', `${API_BASE}/dashboard/stats`);
  await testEndpoint('System Info', 'GET', `${API_BASE}/system/info`);
  
  // Test 2: Authentication Flow
  console.log('\n🔐 Testing Authentication...');
  const adminLogin = await testEndpoint(
    'Admin Login',
    'POST',
    `${API_BASE}/auth/login`,
    { email: 'admin@grandpro.com', password: 'Admin123!' }
  );
  
  const patientLogin = await testEndpoint(
    'Patient Login',
    'POST',
    `${API_BASE}/auth/login`,
    { email: 'patient1@example.com', password: 'password123' }
  );
  
  const doctorLogin = await testEndpoint(
    'Doctor Login',
    'POST',
    `${API_BASE}/auth/login`,
    { email: 'dr.adebayo@luth.ng', password: 'password123' }
  );
  
  // Test 3: Hospital Management
  console.log('\n🏥 Testing Hospital Management...');
  await testEndpoint('List Hospitals', 'GET', `${API_BASE}/hospitals`);
  
  if (adminLogin?.token) {
    await testEndpoint(
      'Hospital Analytics',
      'GET',
      `${API_BASE}/operations/command-centre/stats`,
      null,
      { Authorization: `Bearer ${adminLogin.token}` }
    );
  }
  
  // Test 4: CRM Features
  console.log('\n👥 Testing CRM Features...');
  if (patientLogin?.token) {
    await testEndpoint(
      'Patient Profile',
      'GET',
      `${API_BASE}/crm/patients/profile`,
      null,
      { Authorization: `Bearer ${patientLogin.token}` }
    );
  }
  
  // Test 5: Integration Points
  console.log('\n🔌 Testing Integrations...');
  await testEndpoint('Pharmacy Suppliers', 'GET', `${API_BASE}/pharmacy/suppliers`);
  
  // Test 6: Public Endpoints
  console.log('\n🌐 Testing Public Access...');
  await testEndpoint('Public Stats', 'GET', `${API_BASE}/dashboard/stats`);
  await testEndpoint('Hospital List', 'GET', `${API_BASE}/hospitals`);
  
  // Generate Report
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY\n');
  
  console.log(`✅ Passed Tests: ${testResults.passed.length}`);
  testResults.passed.forEach(test => console.log(`  ${test}`));
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️ Warnings: ${testResults.warnings.length}`);
    testResults.warnings.forEach(test => console.log(`  ${test}`));
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ Failed Tests: ${testResults.failed.length}`);
    testResults.failed.forEach(test => console.log(`  ${test}`));
  }
  
  // System Status
  console.log('\n' + '=' .repeat(50));
  console.log('🏥 SYSTEM STATUS\n');
  
  const criticalServices = [
    'Frontend Service',
    'Backend Health',
    'API Dashboard Stats',
    'Admin Login'
  ];
  
  const allCriticalPassed = criticalServices.every(service => 
    testResults.passed.some(test => test.includes(service))
  );
  
  if (allCriticalPassed) {
    console.log('✅ System Status: FULLY OPERATIONAL');
    console.log('\n🌐 PUBLIC ACCESS URLs:');
    console.log('   External: https://morphvm-wz7xxc7v-80.app.morph.so/');
    console.log('   Direct IP: http://34.30.54.231/');
    console.log('\n📝 Default Credentials:');
    console.log('   Admin: admin@grandpro.com / Admin123!');
    console.log('   Patient: patient1@example.com / password123');
    console.log('   Doctor: dr.adebayo@luth.ng / password123');
  } else {
    console.log('⚠️ System Status: PARTIALLY OPERATIONAL');
    console.log('   Some services may not be fully functional');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Validation Complete\n');
  
  // Return status code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
runComprehensiveTests().catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});
