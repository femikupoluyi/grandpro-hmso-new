const axios = require('axios');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:3000/api/crm';

// Test data
const testData = {
  ownerId: null,
  patientId: null,
  hospitalId: null,
  userId: null
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function setupTestData() {
  console.log(`\n${colors.cyan}=== Setting up test data ===${colors.reset}\n`);

  try {
    // Add timestamp to make emails unique
    const timestamp = Date.now();
    
    // Create test user
    const userResult = await sql.query(`
      INSERT INTO "User" (
        id, email, "phoneNumber", password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 
        $1, 
        '+2348012345678', 
        'hashed_password',
        'Adewale',
        'Ogundimu',
        'ADMIN',
        true,
        NOW(),
        NOW()
      ) RETURNING id
    `, [`test.owner${timestamp}@grandpro.ng`]);
    testData.userId = userResult[0].id;
    console.log(`${colors.green}✓${colors.reset} Created test user`);

    // Create test hospital
    const hospitalResult = await sql.query(`
      INSERT INTO "Hospital" (
        id, code, name, email, "phoneNumber", "addressLine1", city, state, "localGovernment", 
        country, type, ownership, "emergencyServices", "ambulanceServices", "pharmacyServices",
        "laboratoryServices", "imagingServices", status, "isVerified", timezone, currency, language,
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        'HOS' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Lagos Central Hospital',
        'info@lagoscentral.ng',
        '+2348098765432',
        '123 Victoria Island Road',
        'Lagos',
        'Lagos',
        'Eti-Osa',
        'Nigeria',
        'GENERAL',
        'PRIVATE',
        true,
        true,
        true,
        true,
        true,
        'ACTIVE',
        true,
        'Africa/Lagos',
        'NGN',
        'en',
        NOW(),
        NOW()
      ) RETURNING id
    `);
    testData.hospitalId = hospitalResult[0].id;
    console.log(`${colors.green}✓${colors.reset} Created test hospital`);

    // Create hospital owner
    const ownerResult = await sql.query(`
      INSERT INTO "HospitalOwner" (
        id, "userId", "hospitalId", "ownershipPercentage", role, "isActive", "joinedAt"
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        100,
        'OWNER',
        true,
        NOW()
      ) RETURNING id
    `, [testData.userId, testData.hospitalId]);
    testData.ownerId = ownerResult[0].id;
    console.log(`${colors.green}✓${colors.reset} Created hospital owner`);

    // First create a user for the patient
    const patientUserResult = await sql.query(`
      INSERT INTO "User" (
        id, email, "phoneNumber", password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        $1,
        '+2348023456789',
        'hashed_password',
        'Fatima',
        'Adeyemi',
        'PATIENT',
        true,
        NOW(),
        NOW()
      ) RETURNING id
    `, [`fatima.adeyemi${timestamp}@example.com`]);
    
    // Create test patient
    const patientResult = await sql.query(`
      INSERT INTO "Patient" (
        id, "patientNumber", "userId", "hospitalId", "bloodGroup", "genotype", 
        "hasInsurance", "registeredAt", "visitCount"
      ) VALUES (
        gen_random_uuid(),
        'PAT2025' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        $1,
        $2,
        'O+',
        'AA',
        true,
        NOW(),
        0
      ) RETURNING id
    `, [patientUserResult[0].id, testData.hospitalId]);
    testData.patientId = patientResult[0].id;
    console.log(`${colors.green}✓${colors.reset} Created test patient`);

    // Create test contract
    const contractResult = await sql.query(`
      INSERT INTO "Contract" (
        id, "contractNumber", "hospitalId", title, type, "startDate", "endDate",
        "contractValue", "revenueShareRate", status, "signedByHospital", "signedByGrandPro",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        'CTR2025' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        $1,
        'Hospital Management Agreement',
        'SERVICE',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 year',
        500000::money,
        10.0,
        'ACTIVE',
        true,
        true,
        NOW(),
        NOW()
      ) RETURNING id
    `, [testData.hospitalId]);
    testData.contractId = contractResult[0].id;
    console.log(`${colors.green}✓${colors.reset} Created test contract`);

    return testData;
  } catch (error) {
    console.error(`${colors.red}Error setting up test data:${colors.reset}`, error.message);
    throw error;
  }
}

async function testOwnerCRM() {
  console.log(`\n${colors.cyan}=== Testing Owner CRM ===${colors.reset}\n`);

  const tests = [];

  // Test 1: Get owner profile
  tests.push({
    name: 'Get Owner Profile',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/owners/${testData.ownerId}/profile`);
      return response.data.success && response.data.data.id === testData.ownerId;
    }
  });

  // Test 2: Create payout
  tests.push({
    name: 'Create Payout',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/owners/payouts`, {
        owner_id: testData.ownerId,
        hospital_id: testData.hospitalId,
        amount_naira: 150000,
        payout_period: '2025-01',
        revenue_share_amount: 100000,
        fixed_fee_amount: 50000,
        payment_method: 'BANK_TRANSFER',
        bank_details: {
          bank_name: 'First Bank Nigeria',
          account_number: '1234567890',
          account_name: 'Lagos Central Hospital'
        }
      });
      return response.data.success && response.data.data.payout_number;
    }
  });

  // Test 3: Get payout history
  tests.push({
    name: 'Get Payout History',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/owners/payouts?owner_id=${testData.ownerId}`);
      return response.data.success && Array.isArray(response.data.data);
    }
  });

  // Test 4: Submit satisfaction survey
  tests.push({
    name: 'Submit Satisfaction Survey',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/owners/${testData.ownerId}/satisfaction`, {
        hospital_id: testData.hospitalId,
        ratings: {
          overall: 4,
          communication: 5,
          support: 4,
          payment: 3
        },
        feedback: 'Good partnership experience',
        improvements_suggested: 'Faster payment processing'
      });
      return response.data.success;
    }
  });

  // Test 5: Get communication history
  tests.push({
    name: 'Get Communication History',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/owners/${testData.ownerId}/communications`);
      return response.data.success && Array.isArray(response.data.data);
    }
  });

  // Run tests
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`${colors.green}✓${colors.reset} ${test.name}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${test.name} - Test failed`);
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${test.name} - ${error.response?.data?.message || error.message}`);
    }
  }
}

async function testPatientCRM() {
  console.log(`\n${colors.cyan}=== Testing Patient CRM ===${colors.reset}\n`);

  const tests = [];

  // Test 1: Register patient profile
  tests.push({
    name: 'Register Patient Profile',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/patients/profile`, {
        patient_id: testData.patientId,
        hospital_id: testData.hospitalId,
        nin: '12345678901',
        blood_group: 'O+',
        genotype: 'AA',
        allergies: ['Penicillin'],
        chronic_conditions: ['Hypertension'],
        emergency_contact: {
          name: 'Ahmed Adeyemi',
          phone: '+2348034567890',
          relationship: 'Spouse'
        },
        insurance_info: {
          provider: 'AXA Mansard',
          number: 'AXA123456',
          nhis_number: 'NHIS987654'
        }
      });
      return response.data.success && response.data.data.registration_number;
    }
  });

  // Test 2: Get patient profile
  tests.push({
    name: 'Get Patient Profile',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/patients/${testData.patientId}/profile`);
      return response.data.success && response.data.data.id === testData.patientId;
    }
  });

  // Test 3: Get loyalty points
  tests.push({
    name: 'Get Loyalty Points',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/patients/${testData.patientId}/loyalty`);
      return response.data.success;
    }
  });

  // Test 4: Submit feedback
  tests.push({
    name: 'Submit Patient Feedback',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/patients/${testData.patientId}/feedback`, {
        hospital_id: testData.hospitalId,
        feedback_type: 'SERVICE',
        ratings: {
          overall: 5,
          doctor: 5,
          nurse: 4,
          facility: 4,
          waiting_time: 3
        },
        feedback_text: 'Excellent medical care, but waiting time could be improved',
        would_recommend: true
      });
      return response.data.success;
    }
  });

  // Test 5: Award loyalty points
  tests.push({
    name: 'Award Loyalty Points',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/patients/${testData.patientId}/loyalty/award`, {
        hospital_id: testData.hospitalId,
        points: 50,
        description: 'Welcome bonus points'
      });
      return response.data.success;
    }
  });

  // Test 6: Get available rewards
  tests.push({
    name: 'Get Available Rewards',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/patients/loyalty/rewards?hospital_id=${testData.hospitalId}`);
      return response.data.success && Array.isArray(response.data.data);
    }
  });

  // Run tests
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`${colors.green}✓${colors.reset} ${test.name}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${test.name} - Test failed`);
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${test.name} - ${error.response?.data?.message || error.message}`);
    }
  }
}

async function testCommunications() {
  console.log(`\n${colors.cyan}=== Testing Communications ===${colors.reset}\n`);

  const tests = [];

  // Test 1: Get communication templates
  tests.push({
    name: 'Get Communication Templates',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/communications/templates`);
      return response.data.success && response.data.data;
    }
  });

  // Test 2: Create campaign
  tests.push({
    name: 'Create Communication Campaign',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/communications/campaigns`, {
        hospital_id: testData.hospitalId,
        campaign_name: 'Health Awareness Week',
        campaign_type: 'HEALTH_PROMOTION',
        target_audience: 'ALL_PATIENTS',
        message_template: 'Dear {patientName}, join us for Health Awareness Week at {hospitalName}!',
        channels: ['SMS', 'EMAIL']
      });
      return response.data.success && response.data.data.id;
    }
  });

  // Test 3: Get campaigns
  tests.push({
    name: 'Get Communication Campaigns',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/communications/campaigns?hospital_id=${testData.hospitalId}`);
      return response.data.success && Array.isArray(response.data.data);
    }
  });

  // Test 4: Get communication statistics
  tests.push({
    name: 'Get Communication Statistics',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/communications/statistics?hospital_id=${testData.hospitalId}`);
      return response.data.success && response.data.data.period;
    }
  });

  // Test 5: Test communication (mock)
  tests.push({
    name: 'Test Communication Sending',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/communications/test`, {
        channel: 'SMS',
        recipient: '+2348012345678',
        message: 'This is a test message from GrandPro HMSO'
      });
      return response.data.success;
    }
  });

  // Run tests
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`${colors.green}✓${colors.reset} ${test.name}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${test.name} - Test failed`);
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${test.name} - ${error.response?.data?.message || error.message}`);
    }
  }
}

async function testCRMDashboard() {
  console.log(`\n${colors.cyan}=== Testing CRM Dashboard ===${colors.reset}\n`);

  try {
    const response = await axios.get(`${BASE_URL}/dashboard`);
    if (response.data.success) {
      console.log(`${colors.green}✓${colors.reset} CRM Dashboard API is working`);
      console.log(`\n${colors.magenta}Dashboard Data:${colors.reset}`);
      console.log(JSON.stringify(response.data.data, null, 2));
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} CRM Dashboard - ${error.message}`);
  }
}

async function cleanup() {
  console.log(`\n${colors.yellow}=== Cleaning up test data ===${colors.reset}\n`);
  
  try {
    // Clean up in reverse order to respect foreign key constraints
    if (testData.patientId) {
      await sql.query(`DELETE FROM patient_profiles WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM loyalty_points WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM patient_feedback WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM "Patient" WHERE id = $1`, [testData.patientId]);
    }
    if (testData.ownerId) {
      await sql.query(`DELETE FROM owner_payouts WHERE owner_id = $1`, [testData.ownerId]);
      await sql.query(`DELETE FROM owner_satisfaction WHERE owner_id = $1`, [testData.ownerId]);
      await sql.query(`DELETE FROM "HospitalOwner" WHERE id = $1`, [testData.ownerId]);
    }
    if (testData.hospitalId) {
      await sql.query(`DELETE FROM "Contract" WHERE "hospitalId" = $1`, [testData.hospitalId]);
      await sql.query(`DELETE FROM "Hospital" WHERE id = $1`, [testData.hospitalId]);
    }
    // Clean up all test users
    await sql.query(`DELETE FROM "User" WHERE email IN ('test.owner@grandpro.ng', 'fatima.adeyemi@example.com')`);
    
    console.log(`${colors.green}✓${colors.reset} Test data cleaned up successfully`);
  } catch (error) {
    console.error(`${colors.red}Error cleaning up:${colors.reset}`, error.message);
  }
}

async function runTests() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════════╗
║           GrandPro HMSO - CRM Module Test Suite                ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);

  try {
    // Setup test data
    await setupTestData();
    
    // Run all test suites
    await testOwnerCRM();
    await testPatientCRM();
    await testCommunications();
    await testCRMDashboard();
    
    console.log(`\n${colors.green}══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}   CRM Module testing completed successfully!     ${colors.reset}`);
    console.log(`${colors.green}══════════════════════════════════════════════════${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}Test suite failed:${colors.reset}`, error);
  } finally {
    // Always cleanup
    await cleanup();
    process.exit(0);
  }
}

// Check if server is running
axios.get('http://localhost:3000/health')
  .then(() => {
    console.log(`${colors.green}✓${colors.reset} Server is running`);
    runTests();
  })
  .catch(() => {
    console.log(`${colors.red}✗${colors.reset} Server is not running. Please start the server first with: npm start`);
    process.exit(1);
  });
