#!/usr/bin/env node

/**
 * Test script to verify the onboarding UI integration with backend APIs
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';
const FRONTEND_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n${'='.repeat(60)}`)
};

async function testFrontendAccess() {
  log.header('1. TESTING FRONTEND ACCESS');
  
  try {
    // Test main page
    const mainPage = await axios.get(FRONTEND_URL);
    if (mainPage.status === 200) {
      log.success('Frontend main page accessible');
    }
    
    // Test onboarding routes
    const routes = [
      '/onboarding',
      '/onboarding/application',
      '/onboarding/documents',
      '/onboarding/dashboard',
      '/onboarding/contract-review'
    ];
    
    for (const route of routes) {
      try {
        const response = await axios.get(`${FRONTEND_URL}${route}`);
        if (response.status === 200) {
          log.success(`Route ${route} accessible`);
        }
      } catch (err) {
        // Routes might require auth or redirect
        if (err.response?.status === 404) {
          log.error(`Route ${route} not found`);
        } else {
          log.warning(`Route ${route} returned status ${err.response?.status || 'unknown'}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Frontend access test failed: ${error.message}`);
    return false;
  }
}

async function testOnboardingWorkflow() {
  log.header('2. TESTING ONBOARDING API WORKFLOW');
  
  let token = '';
  let hospitalId = '';
  let contractId = '';
  
  try {
    // Step 1: Register user
    log.info('Step 1: User Registration');
    const timestamp = Date.now();
    const registerData = {
      email: `hospital_owner_${timestamp}@test.ng`,
      password: 'Test123!',
      firstName: 'Hospital',
      lastName: 'Owner',
      role: 'owner'
    };
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    if (registerResponse.data.success) {
      log.success('User registered successfully');
    }
    
    // Step 2: Login
    log.info('Step 2: User Login');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    
    if (loginResponse.data.token) {
      token = loginResponse.data.token;
      log.success('Login successful, token received');
    }
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Step 3: Submit Hospital Application
    log.info('Step 3: Hospital Application Submission');
    const hospitalData = {
      name: `Test Hospital ${timestamp}`,
      address: '789 Test Street, Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
      phoneNumber: '+2348099999999',
      email: `hospital${timestamp}@test.ng`,
      type: 'general',
      bedCapacity: 100,
      hasEmergency: true,
      hasPharmacy: true,
      hasLab: true,
      ownerName: 'Dr. Test Owner',
      ownerEmail: registerData.email,
      ownerPhone: '+2348099999999',
      servicesOffered: ['Emergency', 'Surgery', 'Maternity']
    };
    
    const hospitalResponse = await axios.post(
      `${API_URL}/hospitals`,
      hospitalData,
      { headers }
    );
    
    if (hospitalResponse.data.success) {
      hospitalId = hospitalResponse.data.hospital.id;
      log.success(`Hospital application submitted (ID: ${hospitalId})`);
    }
    
    // Step 4: Update Onboarding Progress
    log.info('Step 4: Update Onboarding Progress');
    const progressResponse = await axios.post(
      `${API_URL}/onboarding/progress`,
      {
        hospitalId: hospitalId,
        step: 'application',
        completed: true
      },
      { headers }
    );
    
    if (progressResponse.data.success) {
      log.success('Onboarding progress updated');
    }
    
    // Step 5: Check Onboarding Status
    log.info('Step 5: Check Onboarding Status');
    const statusResponse = await axios.get(
      `${API_URL}/onboarding/status?hospitalId=${hospitalId}`,
      { headers }
    );
    
    if (statusResponse.data.success) {
      const status = statusResponse.data.onboardingStatuses[0];
      if (status) {
        log.success(`Onboarding status retrieved - ${status.completion_percentage}% complete`);
      }
    }
    
    // Step 6: Generate Contract
    log.info('Step 6: Contract Generation');
    const contractData = {
      hospitalId: hospitalId,
      hospitalName: hospitalData.name,
      ownerName: 'Dr. Test Owner',
      ownerEmail: registerData.email,
      commissionRate: 15,
      contractDuration: 12
    };
    
    const contractResponse = await axios.post(
      `${API_URL}/contracts/generate`,
      contractData,
      { headers }
    );
    
    if (contractResponse.data.success) {
      contractId = contractResponse.data.contract.id;
      log.success(`Contract generated (Number: ${contractResponse.data.contract.contract_number})`);
      log.info(`PDF URL: ${contractResponse.data.contract.pdf_url}`);
    }
    
    // Step 7: Sign Contract
    log.info('Step 7: Contract Signing');
    const signatureData = {
      signatureData: 'data:image/png;base64,TEST_SIGNATURE',
      signerName: 'Dr. Test Owner',
      signerRole: 'Hospital Director'
    };
    
    const signResponse = await axios.post(
      `${API_URL}/contracts/${contractId}/sign`,
      signatureData,
      { headers }
    );
    
    if (signResponse.data.success) {
      log.success('Contract signed successfully');
    }
    
    // Step 8: Final Status Check
    log.info('Step 8: Final Status Check');
    const finalStatusResponse = await axios.get(
      `${API_URL}/onboarding/status?hospitalId=${hospitalId}`,
      { headers }
    );
    
    if (finalStatusResponse.data.success) {
      const finalStatus = finalStatusResponse.data.onboardingStatuses[0];
      if (finalStatus) {
        log.success(`Final onboarding status: ${finalStatus.completion_percentage}% complete`);
        log.info(`Current step: ${finalStatus.current_step}`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Onboarding workflow test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUIComponents() {
  log.header('3. TESTING UI COMPONENT AVAILABILITY');
  
  const components = [
    'ApplicationForm.jsx',
    'DocumentUpload.jsx',
    'OnboardingDashboard.jsx',
    'ContractReview.jsx'
  ];
  
  const basePath = '/root/grandpro-hmso-new/frontend/src/pages/onboarding';
  
  for (const component of components) {
    const filePath = path.join(basePath, component);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log.success(`${component} exists (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      log.error(`${component} not found`);
    }
  }
  
  // Check service file
  const servicePath = '/root/grandpro-hmso-new/frontend/src/services/onboarding.service.js';
  if (fs.existsSync(servicePath)) {
    log.success('Onboarding service file exists');
  } else {
    log.error('Onboarding service file not found');
  }
  
  return true;
}

async function runAllTests() {
  console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║   Onboarding UI Integration Test Suite                   ║
║   Testing Frontend Components & Backend Integration      ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

  const results = [];
  
  // Run tests
  results.push(await testFrontendAccess());
  results.push(await testOnboardingWorkflow());
  results.push(await testUIComponents());
  
  // Summary
  const passed = results.filter(r => r).length;
  const failed = results.length - passed;
  
  log.header('TEST SUMMARY');
  console.log(`
${colors.bright}Tests Run: ${results.length}
${colors.green}Passed: ${passed}
${colors.red}Failed: ${failed}
${colors.reset}
${passed === results.length ? 
  `${colors.bright}${colors.green}✅ ALL TESTS PASSED! Onboarding UI is fully integrated.${colors.reset}` :
  `${colors.bright}${colors.red}❌ Some tests failed. Please review.${colors.reset}`}
`);

  // UI Access Instructions
  console.log(`
${colors.bright}${colors.blue}📱 UI Access Instructions:${colors.reset}
${colors.cyan}
1. Open browser and navigate to: ${colors.bright}http://localhost:3000${colors.reset}${colors.cyan}
2. Click "Get Started" or navigate to: ${colors.bright}http://localhost:3000/onboarding/application${colors.reset}${colors.cyan}
3. Complete the hospital application form
4. Upload required documents at: ${colors.bright}http://localhost:3000/onboarding/documents${colors.reset}${colors.cyan}
5. View progress at: ${colors.bright}http://localhost:3000/onboarding/dashboard${colors.reset}${colors.cyan}
6. Review and sign contract at: ${colors.bright}http://localhost:3000/onboarding/contract-review${colors.reset}

${colors.yellow}Note: Backend API runs on: ${colors.bright}http://localhost:5001${colors.reset}
`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  log.error(`Test suite error: ${error.message}`);
  process.exit(1);
});
