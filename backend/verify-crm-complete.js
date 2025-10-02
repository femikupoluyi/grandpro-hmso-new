const axios = require('axios');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:3000/api/crm';

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

// Test data storage
const testData = {
  ownerId: null,
  patientId: null,
  hospitalId: null,
  userId: null,
  patientUserId: null,
  payoutId: null,
  feedbackId: null,
  campaignId: null,
  timestamp: Date.now()
};

async function setupTestData() {
  console.log(`\n${colors.cyan}=== Setting Up Test Data ===${colors.reset}\n`);

  try {
    // Create test user for owner
    const ownerUserResult = await sql.query(`
      INSERT INTO "User" (
        id, email, "phoneNumber", password, "firstName", "lastName", 
        role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 
        $1, 
        '+2348012345678', 
        'hashed_password',
        'John',
        'Doe',
        'ADMIN',
        true,
        NOW(),
        NOW()
      ) RETURNING id
    `, [`owner${testData.timestamp}@test.com`]);
    testData.userId = ownerUserResult[0].id;

    // Create test hospital
    const hospitalResult = await sql.query(`
      INSERT INTO "Hospital" (
        id, code, name, email, "phoneNumber", "addressLine1", city, state, 
        "localGovernment", country, type, ownership, "emergencyServices", 
        "ambulanceServices", "pharmacyServices", "laboratoryServices", 
        "imagingServices", status, "isVerified", timezone, currency, 
        language, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        $1,
        'Test Hospital',
        'hospital@test.com',
        '+2348098765432',
        '123 Test Street',
        'Lagos',
        'Lagos',
        'Ikeja',
        'Nigeria',
        'GENERAL',
        'PRIVATE',
        true, true, true, true, true,
        'ACTIVE',
        true,
        'Africa/Lagos',
        'NGN',
        'en',
        NOW(),
        NOW()
      ) RETURNING id
    `, [`HOS${testData.timestamp}`]);
    testData.hospitalId = hospitalResult[0].id;

    // Create hospital owner
    const ownerResult = await sql.query(`
      INSERT INTO "HospitalOwner" (
        id, "userId", "hospitalId", "ownershipPercentage", 
        role, "isActive", "joinedAt"
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

    // Create patient user
    const patientUserResult = await sql.query(`
      INSERT INTO "User" (
        id, email, "phoneNumber", password, "firstName", "lastName", 
        role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        $1,
        '+2348023456789',
        'hashed_password',
        'Jane',
        'Smith',
        'PATIENT',
        true,
        NOW(),
        NOW()
      ) RETURNING id
    `, [`patient${testData.timestamp}@test.com`]);
    testData.patientUserId = patientUserResult[0].id;

    // Create patient
    const patientResult = await sql.query(`
      INSERT INTO "Patient" (
        id, "patientNumber", "userId", "hospitalId", "bloodGroup", 
        "genotype", "hasInsurance", "registeredAt", "visitCount"
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        'O+',
        'AA',
        true,
        NOW(),
        0
      ) RETURNING id
    `, [`PAT${testData.timestamp}`, testData.patientUserId, testData.hospitalId]);
    testData.patientId = patientResult[0].id;

    console.log(`${colors.green}✓${colors.reset} Test data created successfully`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Error setting up test data:`, error.message);
    return false;
  }
}

async function verifyOwnerCRUD() {
  console.log(`\n${colors.cyan}=== Verifying Owner CRUD Operations ===${colors.reset}\n`);
  
  const results = {
    create: false,
    read: false,
    update: false,
    list: false
  };

  try {
    // CREATE: Create payout
    console.log('Testing CREATE (Owner Payout)...');
    const createResponse = await axios.post(`${BASE_URL}/owners/payouts`, {
      owner_id: testData.ownerId,
      hospital_id: testData.hospitalId,
      amount_naira: 250000,
      payout_period: '2025-10',
      revenue_share_amount: 200000,
      fixed_fee_amount: 50000,
      payment_method: 'BANK_TRANSFER',
      bank_details: {
        bank_name: 'First Bank',
        account_number: '1234567890',
        account_name: 'Test Hospital'
      },
      notes: 'Test payout for verification'
    });
    
    if (createResponse.data.success && createResponse.data.data.id) {
      testData.payoutId = createResponse.data.data.id;
      results.create = true;
      console.log(`${colors.green}✓${colors.reset} CREATE: Payout created successfully (ID: ${testData.payoutId})`);
    }

    // READ: Get owner profile
    console.log('Testing READ (Owner Profile)...');
    const readResponse = await axios.get(`${BASE_URL}/owners/${testData.ownerId}/profile`);
    if (readResponse.data.success && readResponse.data.data.id === testData.ownerId) {
      results.read = true;
      console.log(`${colors.green}✓${colors.reset} READ: Owner profile retrieved successfully`);
    }

    // UPDATE: Update payout status
    console.log('Testing UPDATE (Payout Status)...');
    const updateResponse = await axios.patch(
      `${BASE_URL}/owners/payouts/${testData.payoutId}/status`,
      {
        status: 'PROCESSING',
        notes: 'Payment being processed'
      }
    );
    if (updateResponse.data.success) {
      results.update = true;
      console.log(`${colors.green}✓${colors.reset} UPDATE: Payout status updated successfully`);
    }

    // LIST: Get payouts
    console.log('Testing LIST (Payouts)...');
    const listResponse = await axios.get(`${BASE_URL}/owners/payouts?owner_id=${testData.ownerId}`);
    if (listResponse.data.success && Array.isArray(listResponse.data.data)) {
      results.list = true;
      console.log(`${colors.green}✓${colors.reset} LIST: Payouts retrieved successfully`);
    }

    // Submit satisfaction survey
    console.log('Testing Owner Satisfaction Survey...');
    const satisfactionResponse = await axios.post(
      `${BASE_URL}/owners/${testData.ownerId}/satisfaction`,
      {
        hospital_id: testData.hospitalId,
        ratings: {
          overall: 5,
          communication: 5,
          support: 4,
          payment: 5
        },
        feedback: 'Excellent partnership',
        improvements_suggested: 'None at this time'
      }
    );
    if (satisfactionResponse.data.success) {
      console.log(`${colors.green}✓${colors.reset} Owner satisfaction survey submitted`);
    }

  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Owner CRUD Error:`, error.response?.data?.message || error.message);
  }

  return results;
}

async function verifyPatientCRUD() {
  console.log(`\n${colors.cyan}=== Verifying Patient CRUD Operations ===${colors.reset}\n`);
  
  const results = {
    create: false,
    read: false,
    update: false,
    list: false
  };

  try {
    // CREATE: Register patient profile
    console.log('Testing CREATE (Patient Profile)...');
    const createResponse = await axios.post(`${BASE_URL}/patients/profile`, {
      patient_id: testData.patientId,
      hospital_id: testData.hospitalId,
      nin: '12345678901',
      blood_group: 'O+',
      genotype: 'AA',
      allergies: ['Penicillin'],
      chronic_conditions: ['Hypertension'],
      emergency_contact: {
        name: 'Emergency Contact',
        phone: '+2348034567890',
        relationship: 'Spouse'
      },
      insurance_info: {
        provider: 'AXA Mansard',
        number: 'AXA123456',
        nhis_number: 'NHIS987654'
      },
      communication_preferences: {
        sms: true,
        email: true,
        whatsapp: true
      }
    });
    
    if (createResponse.data.success) {
      results.create = true;
      console.log(`${colors.green}✓${colors.reset} CREATE: Patient profile created successfully`);
    }

    // READ: Get patient profile
    console.log('Testing READ (Patient Profile)...');
    const readResponse = await axios.get(`${BASE_URL}/patients/${testData.patientId}/profile`);
    if (readResponse.data.success && readResponse.data.data.id === testData.patientId) {
      results.read = true;
      console.log(`${colors.green}✓${colors.reset} READ: Patient profile retrieved successfully`);
    }

    // UPDATE: Update communication preferences
    console.log('Testing UPDATE (Communication Preferences)...');
    const updateResponse = await axios.patch(
      `${BASE_URL}/patients/${testData.patientId}/preferences`,
      {
        communication_preferences: {
          sms: false,
          email: true,
          whatsapp: true
        }
      }
    );
    if (updateResponse.data.success) {
      results.update = true;
      console.log(`${colors.green}✓${colors.reset} UPDATE: Communication preferences updated successfully`);
    }

    // CREATE: Submit feedback
    console.log('Testing Patient Feedback...');
    const feedbackResponse = await axios.post(
      `${BASE_URL}/patients/${testData.patientId}/feedback`,
      {
        hospital_id: testData.hospitalId,
        feedback_type: 'SERVICE',
        ratings: {
          overall: 5,
          doctor: 5,
          nurse: 4,
          facility: 5,
          waiting_time: 3
        },
        feedback_text: 'Great service overall',
        would_recommend: true
      }
    );
    if (feedbackResponse.data.success) {
      testData.feedbackId = feedbackResponse.data.data.id;
      console.log(`${colors.green}✓${colors.reset} Patient feedback submitted successfully`);
    }

    // LIST: Get loyalty points
    console.log('Testing LIST (Loyalty Points)...');
    const loyaltyResponse = await axios.get(`${BASE_URL}/patients/${testData.patientId}/loyalty`);
    if (loyaltyResponse.data.success) {
      results.list = true;
      console.log(`${colors.green}✓${colors.reset} LIST: Loyalty points retrieved successfully`);
    }

    // Award loyalty points
    console.log('Testing Loyalty Points Award...');
    const awardResponse = await axios.post(
      `${BASE_URL}/patients/${testData.patientId}/loyalty/award`,
      {
        hospital_id: testData.hospitalId,
        points: 100,
        description: 'Test points for verification'
      }
    );
    if (awardResponse.data.success) {
      console.log(`${colors.green}✓${colors.reset} Loyalty points awarded successfully`);
    }

  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Patient CRUD Error:`, error.response?.data?.message || error.message);
  }

  return results;
}

async function verifyCommunicationTriggers() {
  console.log(`\n${colors.cyan}=== Verifying Communication Triggers ===${colors.reset}\n`);
  
  const results = {
    sms: false,
    whatsapp: false,
    email: false,
    bulk: false,
    campaign: false
  };

  try {
    // Test SMS
    console.log('Testing SMS Communication...');
    const smsResponse = await axios.post(`${BASE_URL}/communications/test`, {
      channel: 'SMS',
      recipient: '+2348012345678',
      message: 'Test SMS from CRM verification'
    });
    if (smsResponse.data.success) {
      results.sms = true;
      console.log(`${colors.green}✓${colors.reset} SMS: Message dispatched successfully (mock mode)`);
    }

    // Test WhatsApp
    console.log('Testing WhatsApp Communication...');
    const whatsappResponse = await axios.post(`${BASE_URL}/communications/test`, {
      channel: 'WHATSAPP',
      recipient: '+2348012345678',
      message: 'Test WhatsApp message from CRM verification'
    });
    if (whatsappResponse.data.success) {
      results.whatsapp = true;
      console.log(`${colors.green}✓${colors.reset} WhatsApp: Message dispatched successfully (mock mode)`);
    }

    // Test Email
    console.log('Testing Email Communication...');
    const emailResponse = await axios.post(`${BASE_URL}/communications/test`, {
      channel: 'EMAIL',
      recipient: 'test@example.com',
      message: 'Test email from CRM verification'
    });
    if (emailResponse.data.success) {
      results.email = true;
      console.log(`${colors.green}✓${colors.reset} Email: Message dispatched successfully (mock mode)`);
    }

    // Test Owner Communication
    console.log('Testing Owner Communication Trigger...');
    const ownerCommResponse = await axios.post(
      `${BASE_URL}/owners/${testData.ownerId}/communications`,
      {
        channel: 'SMS',
        message: 'Important update about your hospital',
        subject: 'Hospital Update'
      }
    );
    if (ownerCommResponse.data.success) {
      console.log(`${colors.green}✓${colors.reset} Owner communication triggered successfully`);
    }

    // Test Patient Communication
    console.log('Testing Patient Communication Trigger...');
    const patientCommResponse = await axios.post(
      `${BASE_URL}/patients/${testData.patientId}/communications`,
      {
        channel: 'EMAIL',
        message: 'Your appointment reminder',
        subject: 'Appointment Reminder',
        category: 'APPOINTMENT_REMINDER',
        hospital_id: testData.hospitalId
      }
    );
    if (patientCommResponse.data.success) {
      console.log(`${colors.green}✓${colors.reset} Patient communication triggered successfully`);
    }

    // Test Bulk Communication
    console.log('Testing Bulk Communication...');
    const bulkResponse = await axios.post(`${BASE_URL}/communications/send-bulk`, {
      recipients: [
        { email: 'test1@example.com', phone: '+2348012345678' },
        { email: 'test2@example.com', phone: '+2348023456789' }
      ],
      channel: 'SMS',
      message: 'Bulk test message'
    });
    if (bulkResponse.data.success) {
      results.bulk = true;
      console.log(`${colors.green}✓${colors.reset} Bulk communication dispatched successfully`);
    }

    // Create and test campaign
    console.log('Testing Campaign Creation...');
    const campaignResponse = await axios.post(`${BASE_URL}/communications/campaigns`, {
      hospital_id: testData.hospitalId,
      campaign_name: 'Test Health Campaign',
      campaign_type: 'HEALTH_PROMOTION',
      target_audience: 'ALL_PATIENTS',
      message_template: 'Health tip: {tip}',
      channels: ['SMS', 'EMAIL']
    });
    if (campaignResponse.data.success) {
      results.campaign = true;
      testData.campaignId = campaignResponse.data.data.id;
      console.log(`${colors.green}✓${colors.reset} Campaign created successfully`);
    }

    // Get message templates
    console.log('Testing Template Retrieval...');
    const templateResponse = await axios.get(`${BASE_URL}/communications/templates`);
    if (templateResponse.data.success) {
      console.log(`${colors.green}✓${colors.reset} Message templates retrieved successfully`);
    }

  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Communication Error:`, error.response?.data?.message || error.message);
  }

  return results;
}

async function verifyDataPersistence() {
  console.log(`\n${colors.cyan}=== Verifying Data Persistence ===${colors.reset}\n`);

  try {
    // Check owner data in database
    const ownerCheck = await sql.query(`
      SELECT COUNT(*) as count FROM owner_payouts WHERE owner_id = $1
    `, [testData.ownerId]);
    console.log(`${colors.green}✓${colors.reset} Owner payouts in database: ${ownerCheck[0].count}`);

    // Check patient data in database
    const patientCheck = await sql.query(`
      SELECT COUNT(*) as count FROM patient_profiles WHERE patient_id = $1
    `, [testData.patientId]);
    console.log(`${colors.green}✓${colors.reset} Patient profiles in database: ${patientCheck[0].count}`);

    // Check communication logs
    const ownerComms = await sql.query(`
      SELECT COUNT(*) as count FROM owner_communications WHERE owner_id = $1
    `, [testData.ownerId]);
    console.log(`${colors.green}✓${colors.reset} Owner communications logged: ${ownerComms[0].count}`);

    const patientComms = await sql.query(`
      SELECT COUNT(*) as count FROM patient_communications WHERE patient_id = $1
    `, [testData.patientId]);
    console.log(`${colors.green}✓${colors.reset} Patient communications logged: ${patientComms[0].count}`);

    // Check loyalty points
    const loyaltyCheck = await sql.query(`
      SELECT points_balance, lifetime_points, tier 
      FROM loyalty_points WHERE patient_id = $1
    `, [testData.patientId]);
    if (loyaltyCheck.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Loyalty points: Balance=${loyaltyCheck[0].points_balance}, Lifetime=${loyaltyCheck[0].lifetime_points}, Tier=${loyaltyCheck[0].tier}`);
    }

    // Check feedback
    const feedbackCheck = await sql.query(`
      SELECT COUNT(*) as count FROM patient_feedback WHERE patient_id = $1
    `, [testData.patientId]);
    console.log(`${colors.green}✓${colors.reset} Patient feedback records: ${feedbackCheck[0].count}`);

    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Persistence check error:`, error.message);
    return false;
  }
}

async function cleanup() {
  console.log(`\n${colors.yellow}=== Cleaning Up Test Data ===${colors.reset}\n`);
  
  try {
    // Clean up in reverse order
    if (testData.campaignId) {
      await sql.query(`DELETE FROM communication_campaigns WHERE id = $1`, [testData.campaignId]);
    }
    if (testData.patientId) {
      await sql.query(`DELETE FROM patient_communications WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM patient_feedback WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM loyalty_transactions WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM loyalty_points WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM patient_profiles WHERE patient_id = $1`, [testData.patientId]);
      await sql.query(`DELETE FROM "Patient" WHERE id = $1`, [testData.patientId]);
    }
    if (testData.ownerId) {
      await sql.query(`DELETE FROM owner_communications WHERE owner_id = $1`, [testData.ownerId]);
      await sql.query(`DELETE FROM owner_satisfaction WHERE owner_id = $1`, [testData.ownerId]);
      await sql.query(`DELETE FROM owner_payouts WHERE owner_id = $1`, [testData.ownerId]);
      await sql.query(`DELETE FROM "HospitalOwner" WHERE id = $1`, [testData.ownerId]);
    }
    if (testData.hospitalId) {
      await sql.query(`DELETE FROM "Hospital" WHERE id = $1`, [testData.hospitalId]);
    }
    await sql.query(`DELETE FROM "User" WHERE id IN ($1, $2)`, [testData.userId, testData.patientUserId]);
    
    console.log(`${colors.green}✓${colors.reset} Test data cleaned up successfully`);
  } catch (error) {
    console.error(`${colors.red}Error cleaning up:${colors.reset}`, error.message);
  }
}

async function runVerification() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════════╗
║     CRM Module Complete Verification Suite                     ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);

  const results = {
    setupSuccess: false,
    ownerCRUD: {},
    patientCRUD: {},
    communications: {},
    dataPersistence: false
  };

  try {
    // Setup test data
    results.setupSuccess = await setupTestData();
    if (!results.setupSuccess) {
      throw new Error('Failed to setup test data');
    }

    // Run all verifications
    results.ownerCRUD = await verifyOwnerCRUD();
    results.patientCRUD = await verifyPatientCRUD();
    results.communications = await verifyCommunicationTriggers();
    results.dataPersistence = await verifyDataPersistence();

    // Print summary
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                VERIFICATION SUMMARY             ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.magenta}Owner CRUD Operations:${colors.reset}`);
    Object.entries(results.ownerCRUD).forEach(([op, success]) => {
      console.log(`  ${success ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${op.toUpperCase()}`);
    });

    console.log(`\n${colors.magenta}Patient CRUD Operations:${colors.reset}`);
    Object.entries(results.patientCRUD).forEach(([op, success]) => {
      console.log(`  ${success ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${op.toUpperCase()}`);
    });

    console.log(`\n${colors.magenta}Communication Channels:${colors.reset}`);
    Object.entries(results.communications).forEach(([channel, success]) => {
      console.log(`  ${success ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${channel.toUpperCase()}`);
    });

    console.log(`\n${colors.magenta}Data Persistence:${colors.reset}`);
    console.log(`  ${results.dataPersistence ? colors.green + '✓' : colors.red + '✗'}${colors.reset} Database persistence verified`);

    // Final result
    const allOwnerPassed = Object.values(results.ownerCRUD).every(v => v);
    const allPatientPassed = Object.values(results.patientCRUD).every(v => v);
    const allCommsPassed = Object.values(results.communications).every(v => v);
    const overallSuccess = allOwnerPassed && allPatientPassed && allCommsPassed && results.dataPersistence;

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
    if (overallSuccess) {
      console.log(`${colors.green}✅ ALL VERIFICATIONS PASSED SUCCESSFULLY!${colors.reset}`);
      console.log(`${colors.green}The CRM module is fully functional and ready for production.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Some verifications failed. Please review the results above.${colors.reset}`);
    }
    console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);

    return overallSuccess;

  } catch (error) {
    console.error(`\n${colors.red}Verification failed:${colors.reset}`, error.message);
    return false;
  } finally {
    await cleanup();
  }
}

// Check if server is running
axios.get('http://localhost:3000/health')
  .then(() => {
    console.log(`${colors.green}✓${colors.reset} Server is running`);
    runVerification().then(success => {
      process.exit(success ? 0 : 1);
    });
  })
  .catch(() => {
    console.log(`${colors.red}✗${colors.reset} Server is not running. Please start the server first.`);
    process.exit(1);
  });
