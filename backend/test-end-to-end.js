#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Store test data
const testData = {
  user: null,
  token: null,
  hospital: null,
  contract: null,
  patient: null
};

async function testHealthCheck() {
  log.header('1. HEALTH CHECK TEST');
  
  try {
    // Backend health check
    const backendHealth = await axios.get(`${API_URL}/health`);
    if (backendHealth.data.status === 'healthy') {
      log.success('Backend health check passed');
      log.info(`Service: ${backendHealth.data.service}`);
      log.info(`Environment: ${backendHealth.data.environment}`);
    }
    
    // Frontend check
    const frontendResponse = await axios.get(FRONTEND_URL);
    if (frontendResponse.status === 200) {
      log.success('Frontend is accessible');
    }
    
    return true;
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  log.header('2. AUTHENTICATION TEST');
  
  try {
    // Register new user
    const timestamp = Date.now();
    const registerData = {
      email: `test${timestamp}@grandpro.ng`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin'
    };
    
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, registerData);
    if (registerResponse.data.success) {
      testData.user = registerResponse.data.user;
      log.success('User registration successful');
      log.info(`User ID: ${testData.user.id}`);
    }
    
    // Login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    
    if (loginResponse.data.token) {
      testData.token = loginResponse.data.token;
      log.success('Login successful - JWT token received');
      log.info(`Token length: ${testData.token.length} characters`);
    }
    
    return true;
  } catch (error) {
    log.error(`Authentication test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testHospitalOnboarding() {
  log.header('3. HOSPITAL ONBOARDING TEST');
  
  if (!testData.token) {
    log.warning('No auth token, skipping hospital tests');
    return false;
  }
  
  const headers = { Authorization: `Bearer ${testData.token}` };
  
  try {
    // Create hospital
    const hospitalData = {
      name: 'Lagos State Teaching Hospital',
      address: '456 Marina Road, Lagos Island',
      city: 'Lagos',
      state: 'Lagos',
      phoneNumber: '+2348098765432',
      email: 'info@lasuth.ng',
      type: 'teaching',
      bedCapacity: 500,
      hasEmergency: true,
      hasPharmacy: true,
      hasLab: true,
      ownerName: 'Prof. Adebowale Ogunleye',
      ownerEmail: 'ogunleye@lasuth.ng',
      ownerPhone: '+2348055555555'
    };
    
    const hospitalResponse = await axios.post(`${API_URL}/api/hospitals`, hospitalData, { headers });
    if (hospitalResponse.data.success) {
      testData.hospital = hospitalResponse.data.hospital;
      log.success('Hospital created successfully');
      log.info(`Hospital ID: ${testData.hospital.id}`);
      log.info(`Hospital Code: ${testData.hospital.code}`);
    }
    
    // Get hospital details
    const detailsResponse = await axios.get(
      `${API_URL}/api/hospitals/${testData.hospital.id}`, 
      { headers }
    );
    if (detailsResponse.data.success) {
      log.success('Hospital details retrieved successfully');
    }
    
    return true;
  } catch (error) {
    log.error(`Hospital onboarding test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testContractGeneration() {
  log.header('4. CONTRACT GENERATION TEST');
  
  if (!testData.token || !testData.hospital) {
    log.warning('Missing prerequisites, skipping contract tests');
    return false;
  }
  
  const headers = { Authorization: `Bearer ${testData.token}` };
  
  try {
    // Generate contract
    const contractData = {
      hospitalId: testData.hospital.id,
      hospitalName: testData.hospital.name,
      ownerName: 'Prof. Adebowale Ogunleye',
      ownerEmail: 'ogunleye@lasuth.ng',
      contractTerms: 'Standard GrandPro HMSO Service Agreement with 15% commission on monthly revenue',
      commissionRate: 15,
      contractDuration: 24
    };
    
    const contractResponse = await axios.post(
      `${API_URL}/api/contracts/generate`, 
      contractData, 
      { headers }
    );
    
    if (contractResponse.data.success) {
      testData.contract = contractResponse.data.contract;
      log.success('Contract generated successfully');
      log.info(`Contract Number: ${testData.contract.contract_number}`);
      log.info(`PDF URL: ${testData.contract.pdf_url}`);
      
      // Verify PDF exists
      if (testData.contract.pdf_url) {
        const pdfPath = `/root/grandpro-hmso-new/backend${testData.contract.pdf_url}`;
        if (fs.existsSync(pdfPath)) {
          const stats = fs.statSync(pdfPath);
          log.success(`PDF file created (${(stats.size / 1024).toFixed(2)} KB)`);
        }
      }
    }
    
    // Sign contract
    const signData = {
      signatureData: 'data:image/png;base64,SIGNATURE_DATA',
      signerName: 'Prof. Adebowale Ogunleye',
      signerRole: 'Hospital Director'
    };
    
    const signResponse = await axios.post(
      `${API_URL}/api/contracts/${testData.contract.id}/sign`,
      signData,
      { headers }
    );
    
    if (signResponse.data.success) {
      log.success('Contract signed successfully');
      log.info(`Contract Status: ${signResponse.data.contract.status}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Contract generation test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testOnboardingProgress() {
  log.header('5. ONBOARDING PROGRESS TEST');
  
  if (!testData.token || !testData.hospital) {
    log.warning('Missing prerequisites, skipping onboarding tests');
    return false;
  }
  
  const headers = { Authorization: `Bearer ${testData.token}` };
  
  try {
    // Update onboarding progress
    const progressData = {
      hospitalId: testData.hospital.id,
      step: 'application',
      completed: true
    };
    
    const progressResponse = await axios.post(
      `${API_URL}/api/onboarding/progress`,
      progressData,
      { headers }
    );
    
    if (progressResponse.data.success) {
      log.success('Onboarding progress updated');
    }
    
    // Get onboarding status
    const statusResponse = await axios.get(
      `${API_URL}/api/onboarding/status?hospitalId=${testData.hospital.id}`,
      { headers }
    );
    
    if (statusResponse.data.success) {
      log.success('Onboarding status retrieved');
      const status = statusResponse.data.onboardingStatuses[0];
      if (status) {
        log.info(`Completion: ${status.completion_percentage}%`);
        log.info(`Current Step: ${status.current_step}`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Onboarding progress test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testWorkflowIntegration() {
  log.header('6. WORKFLOW INTEGRATION TEST');
  
  if (!testData.token) {
    log.warning('Missing prerequisites, skipping workflow tests');
    return false;
  }
  
  const headers = { Authorization: `Bearer ${testData.token}` };
  
  try {
    // List all hospitals
    const hospitalsResponse = await axios.get(`${API_URL}/api/hospitals`, { headers });
    if (hospitalsResponse.data.hospitals && hospitalsResponse.data.hospitals.length > 0) {
      log.success(`Retrieved ${hospitalsResponse.data.hospitals.length} hospitals`);
    }
    
    // List all contracts
    const contractsResponse = await axios.get(`${API_URL}/api/contracts`, { headers });
    if (contractsResponse.data.contracts) {
      log.success(`Retrieved ${contractsResponse.data.contracts.length} contracts`);
    }
    
    // Check onboarding statuses
    const onboardingResponse = await axios.get(`${API_URL}/api/onboarding/status`, { headers });
    if (onboardingResponse.data.onboardingStatuses) {
      log.success(`Retrieved ${onboardingResponse.data.onboardingStatuses.length} onboarding records`);
    }
    
    return true;
  } catch (error) {
    log.error(`Workflow integration test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║     GrandPro HMSO - End-to-End API Test Suite           ║
║     Platform: Hospital Management System                 ║
║     Context: Nigerian Healthcare                         ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

  const startTime = Date.now();
  const results = [];
  
  // Run tests
  results.push(await testHealthCheck());
  results.push(await testAuthentication());
  results.push(await testHospitalOnboarding());
  results.push(await testContractGeneration());
  results.push(await testOnboardingProgress());
  results.push(await testWorkflowIntegration());
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter(r => r).length;
  const failed = results.length - passed;
  
  log.header('TEST SUMMARY');
  console.log(`
${colors.bright}Total Tests: ${results.length}
${colors.green}Passed: ${passed}
${colors.red}Failed: ${failed}
${colors.cyan}Duration: ${duration}s
${colors.reset}
${colors.bright}Result: ${passed === results.length ? 
  `${colors.green}✅ ALL TESTS PASSED!` : 
  `${colors.red}❌ SOME TESTS FAILED`}${colors.reset}
`);

  if (testData.hospital && testData.contract) {
    console.log(`${colors.bright}${colors.yellow}
📋 Test Data Created:
- User: ${testData.user?.email}
- Hospital: ${testData.hospital?.name} (${testData.hospital?.code})
- Contract: ${testData.contract?.contract_number}
${colors.reset}`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  log.error(`Test suite error: ${error.message}`);
  process.exit(1);
});
