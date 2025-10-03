#!/usr/bin/env node

/**
 * End-to-End Test: Digital Sourcing & Partner Onboarding
 * Tests the complete flow from application submission to contract signing
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Public API URL
const API_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api';

// Test data
let authToken = null;
let testUser = null;
let testApplication = null;
let testContract = null;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: () => true
    };
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { 
      success: response.status < 400, 
      data: response.data, 
      status: response.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: 500 
    };
  }
}

// Log test results
function logTest(testName, passed, details = '') {
  const symbol = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  console.log(`  ${symbol} ${testName}${details ? ': ' + details : ''}`);
  return passed;
}

async function runOnboardingTest() {
  console.log(colors.cyan + '\n' + '='.repeat(70) + colors.reset);
  console.log(colors.cyan + 'Digital Sourcing & Partner Onboarding - E2E Test' + colors.reset);
  console.log(colors.cyan + '='.repeat(70) + colors.reset);
  
  const results = [];
  const timestamp = Date.now();
  
  // Step 1: Register Hospital Owner Account
  console.log(colors.yellow + '\n1. Register Hospital Owner Account' + colors.reset);
  console.log('-'.repeat(50));
  
  const ownerData = {
    email: `owner_${timestamp}@hospital.ng`,
    password: 'SecurePass123!',
    username: `owner_${timestamp}`,
    role: 'hospital_owner',
    fullName: 'Dr. Adebayo Ogundimu',
    phoneNumber: '+2348012345678'
  };
  
  const registerResult = await apiCall('POST', '/auth/register', ownerData);
  results.push(logTest('Create hospital owner account', registerResult.success, 
    registerResult.data?.user?.email || registerResult.error));
  
  if (registerResult.success) {
    testUser = registerResult.data.user;
    
    // Login to get token
    const loginResult = await apiCall('POST', '/auth/login', {
      email: ownerData.email,
      password: ownerData.password
    });
    
    results.push(logTest('Login as hospital owner', loginResult.success));
    
    if (loginResult.success) {
      authToken = loginResult.data.token;
    }
  }
  
  // Step 2: Submit Hospital Application
  console.log(colors.yellow + '\n2. Submit Hospital Application' + colors.reset);
  console.log('-'.repeat(50));
  
  const applicationData = {
    hospitalName: `Lagos Medical Center ${timestamp}`,
    ownerName: 'Dr. Adebayo Ogundimu',
    email: `hospital_${timestamp}@medical.ng`,
    phoneNumber: '+2348098765432',
    address: '45 Marina Road, Lagos Island',
    state: 'Lagos',
    lga: 'Lagos Island',
    hospitalType: 'General Hospital',
    bedCapacity: 100,
    servicesOffered: [
      'General Medicine',
      'Surgery',
      'Pediatrics',
      'Obstetrics & Gynecology',
      'Laboratory Services',
      'Pharmacy'
    ],
    hasOperatingLicense: true,
    licenseNumber: `LAG/MED/${timestamp}`,
    yearEstablished: 2015,
    staffCount: 75,
    hasEmergencyUnit: true,
    hasICU: true,
    insuranceProviders: ['NHIS', 'AXA Mansard', 'Hygeia HMO']
  };
  
  const appResult = await apiCall('POST', '/onboarding/applications', applicationData);
  results.push(logTest('Submit application', appResult.success,
    appResult.data?.id || appResult.error));
  
  if (appResult.success) {
    testApplication = appResult.data;
    
    // Check application status
    const statusResult = await apiCall('GET', `/onboarding/applications/${testApplication.id}`);
    results.push(logTest('Retrieve application status', statusResult.success,
      statusResult.data?.status || 'pending'));
  }
  
  // Step 3: Upload Required Documents
  console.log(colors.yellow + '\n3. Upload Required Documents' + colors.reset);
  console.log('-'.repeat(50));
  
  if (testApplication) {
    // Simulate document uploads
    const documents = [
      { type: 'operating_license', name: 'operating_license.pdf', size: 2048000 },
      { type: 'tax_clearance', name: 'tax_clearance_2024.pdf', size: 1024000 },
      { type: 'cac_certificate', name: 'cac_registration.pdf', size: 1536000 },
      { type: 'facility_photos', name: 'hospital_photos.zip', size: 10240000 },
      { type: 'staff_list', name: 'staff_roster.xlsx', size: 512000 }
    ];
    
    for (const doc of documents) {
      const uploadResult = await apiCall('POST', `/onboarding/applications/${testApplication.id}/documents`, {
        documentType: doc.type,
        fileName: doc.name,
        fileSize: doc.size,
        mimeType: doc.name.endsWith('.pdf') ? 'application/pdf' : 
                  doc.name.endsWith('.zip') ? 'application/zip' : 'application/vnd.ms-excel'
      });
      
      results.push(logTest(`Upload ${doc.type}`, uploadResult.success));
    }
  }
  
  // Step 4: Automated Evaluation & Scoring
  console.log(colors.yellow + '\n4. Automated Evaluation & Scoring' + colors.reset);
  console.log('-'.repeat(50));
  
  if (testApplication) {
    // Submit evaluation scores
    const evaluationData = {
      applicationId: testApplication.id,
      scores: {
        financial: 88,
        operational: 92,
        compliance: 95,
        infrastructure: 85,
        staffing: 90,
        qualityMetrics: 87
      },
      totalScore: 89.5,
      recommendation: 'approve',
      notes: 'Well-established hospital with good infrastructure and compliance records'
    };
    
    const evalResult = await apiCall('POST', `/onboarding/applications/${testApplication.id}/evaluate`, evaluationData);
    results.push(logTest('Submit evaluation', evalResult.success,
      `Score: ${evaluationData.totalScore}/100`));
    
    // Get evaluation results
    const scoreResult = await apiCall('GET', `/onboarding/applications/${testApplication.id}/evaluation`);
    results.push(logTest('Retrieve evaluation score', scoreResult.success,
      scoreResult.data?.totalScore || 'N/A'));
  }
  
  // Step 5: Contract Generation
  console.log(colors.yellow + '\n5. Contract Generation' + colors.reset);
  console.log('-'.repeat(50));
  
  if (testApplication) {
    const contractData = {
      applicationId: testApplication.id,
      terms: {
        duration: 24, // months
        revenueShare: 15, // percentage
        minimumPatients: 500,
        paymentTerms: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
        specialClauses: [
          'Quality metrics must be maintained above 85%',
          'Monthly reporting required by 5th of each month',
          'Compliance with all HMSO standards'
        ]
      },
      financialTerms: {
        setupFee: 500000, // NGN
        monthlyManagementFee: 150000,
        performanceBonus: true,
        penaltyClause: true
      }
    };
    
    const contractResult = await apiCall('POST', '/onboarding/contracts/generate', contractData);
    results.push(logTest('Generate contract', contractResult.success,
      contractResult.data?.contractNumber || contractResult.error));
    
    if (contractResult.success) {
      testContract = contractResult.data;
      
      // Retrieve contract for review
      const reviewResult = await apiCall('GET', `/onboarding/contracts/${testContract.id}`);
      results.push(logTest('Retrieve contract for review', reviewResult.success));
    }
  }
  
  // Step 6: Digital Contract Signing
  console.log(colors.yellow + '\n6. Digital Contract Signing' + colors.reset);
  console.log('-'.repeat(50));
  
  if (testContract) {
    // First, owner reviews and accepts terms
    const acceptResult = await apiCall('POST', `/onboarding/contracts/${testContract.id}/accept`, {
      accepted: true,
      acceptedBy: testUser?.id || 'owner',
      acceptedAt: new Date().toISOString()
    });
    results.push(logTest('Accept contract terms', acceptResult.success));
    
    // Digital signature
    const signatureData = {
      contractId: testContract.id,
      signatureData: Buffer.from(`Digital Signature for Contract ${testContract.id}`).toString('base64'),
      signedBy: testUser?.id || 'owner',
      signedAt: new Date().toISOString(),
      ipAddress: '105.112.45.67', // Nigerian IP
      deviceInfo: 'Chrome/120.0 Windows 10',
      signatureType: 'digital',
      verificationCode: `VERIFY-${timestamp}`
    };
    
    const signResult = await apiCall('POST', `/onboarding/contracts/${testContract.id}/sign`, signatureData);
    results.push(logTest('Digitally sign contract', signResult.success,
      signResult.data?.status || signResult.error));
    
    // Verify signature
    const verifyResult = await apiCall('GET', `/onboarding/contracts/${testContract.id}/signature/verify`);
    results.push(logTest('Verify digital signature', verifyResult.success,
      verifyResult.data?.verified ? 'Verified' : 'Not Verified'));
  }
  
  // Step 7: Onboarding Completion
  console.log(colors.yellow + '\n7. Onboarding Completion & Dashboard Access' + colors.reset);
  console.log('-'.repeat(50));
  
  if (testApplication && testContract) {
    // Complete onboarding
    const completeResult = await apiCall('POST', `/onboarding/applications/${testApplication.id}/complete`, {
      contractId: testContract.id,
      activationDate: new Date().toISOString(),
      hospitalId: `HOSP-${timestamp}`
    });
    results.push(logTest('Complete onboarding process', completeResult.success));
    
    // Get onboarding dashboard
    const dashboardResult = await apiCall('GET', '/onboarding/dashboard');
    results.push(logTest('Access onboarding dashboard', dashboardResult.success));
    
    // Get tracking status
    const trackingResult = await apiCall('GET', `/onboarding/track/${testApplication.id}`);
    results.push(logTest('Track onboarding progress', trackingResult.success,
      trackingResult.data?.completionPercentage ? `${trackingResult.data.completionPercentage}% complete` : ''));
  }
  
  // Summary
  console.log(colors.cyan + '\n' + '='.repeat(70) + colors.reset);
  console.log(colors.cyan + 'Test Summary' + colors.reset);
  console.log(colors.cyan + '='.repeat(70) + colors.reset);
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  const status = passed === total ? colors.green : passed > total * 0.7 ? colors.yellow : colors.red;
  
  console.log(`${status}Results: ${passed}/${total} tests passed (${percentage}%)${colors.reset}`);
  
  if (testApplication) {
    console.log(colors.blue + '\nApplication Details:' + colors.reset);
    console.log(`  ID: ${testApplication.id}`);
    console.log(`  Hospital: ${applicationData.hospitalName}`);
    console.log(`  Status: ${testApplication.status || 'submitted'}`);
  }
  
  if (testContract) {
    console.log(colors.blue + '\nContract Details:' + colors.reset);
    console.log(`  ID: ${testContract.id}`);
    console.log(`  Number: ${testContract.contractNumber || 'N/A'}`);
    console.log(`  Status: ${testContract.status || 'signed'}`);
  }
  
  console.log(colors.cyan + '\n' + '='.repeat(70) + colors.reset + '\n');
  
  return passed === total;
}

// Run the test
if (require.main === module) {
  runOnboardingTest()
    .then(success => {
      if (success) {
        console.log(colors.green + '✅ All onboarding tests passed successfully!' + colors.reset);
        process.exit(0);
      } else {
        console.log(colors.red + '❌ Some tests failed. Please review the results.' + colors.reset);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(colors.red + 'Test execution failed:' + colors.reset, error.message);
      process.exit(1);
    });
}

module.exports = { runOnboardingTest };
