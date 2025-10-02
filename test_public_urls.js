#!/usr/bin/env node

/**
 * Test Public URLs for GrandPro HMSO Platform
 * Tests both backend API and frontend accessibility
 */

const https = require('https');

// Configuration
const BACKEND_URL = 'https://grandpro-backend-morphvm-wz7xxc7v.http.cloud.morph.so';
const FRONTEND_URL = 'https://grandpro-frontend-static-morphvm-wz7xxc7v.http.cloud.morph.so';

// Test utilities
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.method === 'POST' && options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testBackendHealth() {
  console.log('\n🔍 Testing Backend Health Check...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    const data = JSON.parse(response.body);
    
    console.log('✅ Backend Health Check:', {
      status: response.statusCode,
      service: data.service,
      environment: data.environment,
      timezone: data.timezone,
      currency: data.currency
    });
    
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Backend Health Check Failed:', error.message);
    return false;
  }
}

async function testOnboardingAPI() {
  console.log('\n🔍 Testing Onboarding API...');
  
  const testData = {
    ownerEmail: `test.${Date.now()}@hospital.ng`,
    ownerName: 'Dr. Adebayo Ogundimu',
    ownerPhone: '+2348012345678',
    password: 'SecurePass123!',
    hospitalName: 'Lagos State General Hospital',
    hospitalAddress: '123 Marina Road, Lagos Island',
    city: 'Lagos',
    state: 'Lagos',
    bedCapacity: 250,
    staffCount: 300
  };
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/onboarding/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: testData
    });
    
    const data = JSON.parse(response.body);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ Onboarding API Test Passed:', {
        applicationId: data.application?.id,
        status: data.application?.status,
        hospitalName: data.application?.hospital_name
      });
      return true;
    } else {
      console.log('⚠️ Onboarding API Response:', response.statusCode, data);
      return false;
    }
  } catch (error) {
    console.error('❌ Onboarding API Test Failed:', error.message);
    return false;
  }
}

async function testFrontend() {
  console.log('\n🔍 Testing Frontend Accessibility...');
  try {
    const response = await makeRequest(FRONTEND_URL);
    
    if (response.statusCode === 200) {
      const hasHTML = response.body.includes('<!DOCTYPE html>') || response.body.includes('<html');
      console.log('✅ Frontend Accessible:', {
        status: response.statusCode,
        contentType: response.headers['content-type'],
        hasHTML: hasHTML
      });
      return true;
    } else {
      console.log('❌ Frontend returned status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Frontend Test Failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🔍 Testing Additional API Endpoints...');
  
  const endpoints = [
    { path: '/api/auth/login', method: 'POST', expectStatus: [400, 401] }, // Should fail without valid creds
    { path: '/api/hospitals', method: 'GET', expectStatus: [200, 401] }, // Might need auth
    { path: '/api/applications', method: 'GET', expectStatus: [200, 401] } // Might need auth
  ];
  
  let passed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (endpoint.expectStatus.includes(response.statusCode)) {
        console.log(`  ✅ ${endpoint.method} ${endpoint.path} - Status: ${response.statusCode}`);
        passed++;
      } else {
        console.log(`  ❌ ${endpoint.method} ${endpoint.path} - Unexpected Status: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
    }
  }
  
  return passed === endpoints.length;
}

// Main test runner
async function runTests() {
  console.log('====================================');
  console.log('🏥 GrandPro HMSO Platform URL Tests');
  console.log('====================================');
  console.log('\nBackend URL:', BACKEND_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  
  const results = {
    backendHealth: await testBackendHealth(),
    onboardingAPI: await testOnboardingAPI(),
    frontend: await testFrontend(),
    apiEndpoints: await testAPIEndpoints()
  };
  
  console.log('\n====================================');
  console.log('📊 Test Summary');
  console.log('====================================');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! The platform is fully functional.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }
  
  console.log('\n🌐 Public URLs:');
  console.log(`   Backend API: ${BACKEND_URL}`);
  console.log(`   Frontend App: ${FRONTEND_URL}`);
  console.log('\n📝 Note: Frontend is served as static files. For full functionality,');
  console.log('   you may need to configure client-side routing.');
  
  return passed === total;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
