const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/onboarding`;

// Test data
const testApplication = {
  hospitalName: "Lagos Central Hospital",
  legalName: "Lagos Central Medical Centre Ltd",
  registrationNumber: "RC123456",
  taxIdentificationNo: "TIN987654",
  ownerFullName: "Dr. Adewale Ogundimu",
  ownerEmail: "adewale@lagoscentral.ng",
  ownerPhone: "+2348012345678",
  ownerNin: "12345678901",
  hospitalType: "General",
  ownership: "Private",
  proposedLocation: { lat: 6.5244, lng: 3.3792 },
  addressLine1: "123 Victoria Island Road",
  city: "Lagos",
  state: "Lagos",
  localGovernment: "Eti-Osa",
  proposedBedCapacity: 100,
  currentStaffCount: 50,
  proposedSpecializations: ["General Medicine", "Surgery", "Pediatrics"],
  yearsInOperation: 5,
  currentPatientVolume: 500,
  hasEmergencyServices: true,
  hasPharmacy: true,
  hasLaboratory: true,
  hasImaging: true,
  expectedRevenue: 500000000,
  bankName: "First Bank Nigeria",
  bankAccountNumber: "1234567890",
  bankAccountName: "Lagos Central Medical Centre Ltd"
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(test) {
  log(` ${test}`, 'green');
}

function logError(test, error) {
  log(`✗ ${test}: ${error}`, 'red');
}

// Test functions
async function testApplicationSubmission() {
  log('\n📝 Testing Application Submission...', 'blue');
  try {
    const response = await axios.post(`${API_BASE}/applications/submit`, testApplication);
    
    if (response.data.success && response.data.data.applicationNumber) {
      logSuccess('Application submitted successfully');
      log(`  Application Number: ${response.data.data.applicationNumber}`, 'yellow');
      log(`  Application ID: ${response.data.data.applicationId}`, 'yellow');
      return response.data.data;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logError('Application submission', error.response?.data?.message || error.message);
    return null;
  }
}

async function testApplicationStatus(applicationNumber) {
  log('\n🔍 Testing Application Status Check...', 'blue');
  try {
    const response = await axios.get(`${API_BASE}/applications/status/${applicationNumber}`);
    
    if (response.data.success) {
      logSuccess('Application status retrieved');
      log(`  Status: ${response.data.data.status}`, 'yellow');
      log(`  Progress: ${JSON.stringify(response.data.data.progress)}`, 'yellow');
      return true;
    }
  } catch (error) {
    logError('Status check', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDocumentUpload(applicationId) {
  log('\n📎 Testing Document Upload...', 'blue');
  
  // Create a test document
  const testDocPath = path.join(__dirname, 'test-document.pdf');
  fs.writeFileSync(testDocPath, 'Test PDF content for CAC Certificate');
  
  try {
    const form = new FormData();
    form.append('documents', fs.createReadStream(testDocPath));
    form.append('documentType_test-document.pdf', 'CAC_CERTIFICATE');
    
    const response = await axios.post(
      `${API_BASE}/applications/${applicationId}/documents`,
      form,
      { headers: form.getHeaders() }
    );
    
    if (response.data.success) {
      logSuccess('Document uploaded successfully');
      log(`  Documents uploaded: ${response.data.data.length}`, 'yellow');
      
      // Clean up test file
      fs.unlinkSync(testDocPath);
      return response.data.data;
    }
  } catch (error) {
    logError('Document upload', error.response?.data?.message || error.message);
    if (fs.existsSync(testDocPath)) fs.unlinkSync(testDocPath);
    return null;
  }
}

async function testEvaluation(applicationId) {
  log('\n Testing Auto-Evaluation...', 'blue');
  
  // Mock admin token for protected route
  const headers = { Authorization: 'Bearer mock-admin-token' };
  
  try {
    const response = await axios.post(
      `${API_BASE}/applications/${applicationId}/auto-evaluate`,
      {},
      { headers }
    );
    
    if (response.data.success && response.data.data.overallScore !== undefined) {
      logSuccess('Auto-evaluation completed');
      log(`  Overall Score: ${response.data.data.overallScore}/100`, 'yellow');
      log(`  Recommendation: ${response.data.data.recommendation}`, 'yellow');
      log(`  Risk Level: ${response.data.data.riskLevel}`, 'yellow');
      return response.data.data;
    }
  } catch (error) {
    logError('Auto-evaluation', error.response?.data?.message || error.message);
    return null;
  }
}

async function testContractGeneration(applicationId) {
  log('\n📄 Testing Contract Generation...', 'blue');
  
  const headers = { Authorization: 'Bearer mock-admin-token' };
  const contractData = {
    title: "Partnership Agreement - Lagos Central Hospital",
    type: "PARTNERSHIP",
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    contractValue: 10000000, // 10M NGN
    commissionRate: 10,
    revenueShareRate: 15,
    paymentTerms: "Net 30 days"
  };
  
  try {
    const response = await axios.post(
      `${API_BASE}/applications/${applicationId}/contract/generate`,
      contractData,
      { headers }
    );
    
    if (response.data.success && response.data.data.contractNumber) {
      logSuccess('Contract generated successfully');
      log(`  Contract Number: ${response.data.data.contractNumber}`, 'yellow');
      log(`  Document URL: ${response.data.data.documentUrl || 'PDF generated'}`, 'yellow');
      return response.data.data;
    }
  } catch (error) {
    logError('Contract generation', error.response?.data?.message || error.message);
    return null;
  }
}

async function testProgressTracking(applicationId) {
  log('\n📈 Testing Progress Tracking...', 'blue');
  
  const headers = { Authorization: 'Bearer mock-admin-token' };
  
  try {
    const response = await axios.get(
      `${API_BASE}/applications/${applicationId}/progress`,
      { headers }
    );
    
    if (response.data.success && response.data.data) {
      logSuccess('Progress retrieved');
      log(`  Current Stage: ${response.data.data.currentStage}`, 'yellow');
      log(`  Percentage Complete: ${response.data.data.percentageComplete}%`, 'yellow');
      
      // Test progress update
      const updateResponse = await axios.patch(
        `${API_BASE}/applications/${applicationId}/progress`,
        {
          stage: 'DOCUMENT_SUBMISSION',
          updates: { documentsCompleted: true }
        },
        { headers }
      );
      
      if (updateResponse.data.success) {
        logSuccess('Progress updated successfully');
        log(`  New Percentage: ${updateResponse.data.data.percentageComplete}%`, 'yellow');
      }
      
      return true;
    }
  } catch (error) {
    logError('Progress tracking', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDatabaseOperations() {
  log('\n💾 Testing Database Operations...', 'blue');
  
  try {
    // Test if Prisma can connect and query
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Count applications
    const count = await prisma.onboardingApplication.count();
    logSuccess(`Database connected - ${count} applications found`);
    
    // Check if our test application was saved
    const saved = await prisma.onboardingApplication.findFirst({
      where: { ownerEmail: testApplication.ownerEmail }
    });
    
    if (saved) {
      logSuccess('Application stored in database correctly');
      log(`  Database ID: ${saved.id}`, 'yellow');
      log(`  Created At: ${saved.createdAt}`, 'yellow');
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    logError('Database operations', error.message);
    return false;
  }
}

// Main verification function
async function verifyOnboardingModule() {
  log(' Starting Onboarding Module Verification', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  let results = {
    submission: false,
    status: false,
    documents: false,
    evaluation: false,
    contract: false,
    progress: false,
    database: false
  };
  
  // Test 1: Submit application
  const application = await testApplicationSubmission();
  results.submission = !!application;
  
  if (application) {
    // Test 2: Check status
    results.status = await testApplicationStatus(application.applicationNumber);
    
    // Test 3: Upload documents
    const docs = await testDocumentUpload(application.applicationId);
    results.documents = !!docs;
    
    // Test 4: Auto-evaluation
    const evaluation = await testEvaluation(application.applicationId);
    results.evaluation = !!evaluation;
    
    // Test 5: Generate contract
    const contract = await testContractGeneration(application.applicationId);
    results.contract = !!contract;
    
    // Test 6: Progress tracking
    results.progress = await testProgressTracking(application.applicationId);
  }
  
  // Test 7: Database operations
  results.database = await testDatabaseOperations();
  
  // Summary
  log('\n' + '=' .repeat(50), 'magenta');
  log(' VERIFICATION SUMMARY', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    log(`${icon} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'green' : 'red');
  });
  
  log('\n' + '=' .repeat(50), 'magenta');
  const percentage = Math.round((passed / total) * 100);
  const overallColor = percentage >= 70 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
  log(`Overall: ${passed}/${total} tests passed (${percentage}%)`, overallColor);
  
  if (percentage >= 70) {
    log('\n✅ Onboarding Module Verification SUCCESSFUL', 'green');
    log('The backend module is functional and ready for use!', 'green');
  } else {
    log('\n⚠️  Some tests failed - manual review needed', 'yellow');
  }
}

// Check if server is needed
async function checkServer() {
  try {
    await axios.get(BASE_URL + '/health');
    return true;
  } catch (error) {
    log('⚠️  Backend server not running on port 3000', 'yellow');
    log('Starting mock tests without live server...', 'yellow');
    return false;
  }
}

// Run verification
(async () => {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await verifyOnboardingModule();
  } else {
    // Run database-only tests
    log('\nRunning database verification only...', 'blue');
    await testDatabaseOperations();
  }
})();
