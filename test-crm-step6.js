#!/usr/bin/env node

/**
 * Test CRM Module - Step 6 Verification
 */

const axios = require('axios');

const BASE_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';
const API_URL = `${BASE_URL}/api`;

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

async function testEndpoint(method, path, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${path}`,
      data,
      timeout: 5000
    };

    const response = await axios(config);
    log(`✓ ${method} ${path}`, 'green');
    return response.data;
  } catch (error) {
    if (error.response) {
      log(`✗ ${method} ${path} - ${error.response.status}: ${error.response.data?.error?.message || error.message}`, 'red');
    } else {
      log(`✗ ${method} ${path} - ${error.message}`, 'red');
    }
    return null;
  }
}

async function testCRMModule() {
  log('\n=== TESTING CRM MODULE (STEP 6) ===\n', 'cyan');
  
  log('Owner CRM Endpoints:', 'blue');
  const owners = await testEndpoint('GET', '/crm-v2/owners');
  if (owners && owners.data) {
    log(`  Found ${owners.data.length} owners`, 'green');
  }
  
  const ownerStats = await testEndpoint('GET', '/crm-v2/owners/stats');
  if (ownerStats && ownerStats.data) {
    log(`  Total owners: ${ownerStats.data.totalOwners}`, 'green');
    log(`  Average satisfaction: ${ownerStats.data.averageSatisfaction}`, 'green');
  }
  
  // Test owner creation
  const newOwner = {
    first_name: 'Test',
    last_name: 'Owner',
    email: `test.owner.${Date.now()}@hospital.ng`,
    phone: '+2348012345678',
    hospital_id: 1
  };
  const createdOwner = await testEndpoint('POST', '/crm-v2/owners', newOwner);
  
  log('\nPatient CRM Endpoints:', 'blue');
  const patients = await testEndpoint('GET', '/crm-v2/patients');
  if (patients && patients.data) {
    log(`  Found ${patients.data.length} patients`, 'green');
  }
  
  // Test patient registration
  const newPatient = {
    first_name: 'Test',
    last_name: 'Patient',
    email: `test.patient.${Date.now()}@email.com`,
    phone: '+2348098765432',
    date_of_birth: '1990-01-01',
    gender: 'male',
    address: 'Test Address',
    city: 'Lagos',
    state: 'Lagos'
  };
  const createdPatient = await testEndpoint('POST', '/crm-v2/patients/register', newPatient);
  if (createdPatient && createdPatient.data) {
    log(`  Created patient: ${createdPatient.data.patient_code}`, 'green');
    
    // Test patient detail view
    await testEndpoint('GET', `/crm-v2/patients/${createdPatient.data.id}`);
  }
  
  log('\nCommunication & Campaign Endpoints:', 'blue');
  await testEndpoint('GET', '/crm-v2/campaigns');
  await testEndpoint('GET', '/crm-v2/communications');
  
  // Test campaign creation
  const newCampaign = {
    name: 'Test Health Campaign',
    type: 'educational',
    target_audience: 'all_patients',
    message_template: 'Dear {name}, stay healthy!'
  };
  await testEndpoint('POST', '/crm-v2/campaigns', newCampaign);
  
  log('\nAppointment Management:', 'blue');
  await testEndpoint('GET', '/crm-v2/appointments');
  
  // Test appointment scheduling
  if (createdPatient && createdPatient.data) {
    const newAppointment = {
      patient_id: createdPatient.data.id,
      hospital_id: 1,
      appointment_date: '2025-10-15',
      appointment_time: '10:00',
      type: 'consultation'
    };
    await testEndpoint('POST', '/crm-v2/appointments', newAppointment);
  }
  
  log('\nFeedback & Loyalty:', 'blue');
  await testEndpoint('GET', '/crm-v2/feedback');
  
  // Test feedback submission
  const newFeedback = {
    source_type: 'patient',
    source_id: 1,
    type: 'compliment',
    message: 'Great service!'
  };
  await testEndpoint('POST', '/crm-v2/feedback', newFeedback);
  
  log('\nPayouts (Owner Financial Management):', 'blue');
  if (createdOwner && createdOwner.data) {
    await testEndpoint('GET', `/crm-v2/owners/${createdOwner.data.id}/payouts`);
    
    // Test payout creation
    const newPayout = {
      owner_id: createdOwner.data.id,
      period_start: '2025-10-01',
      period_end: '2025-10-31',
      gross_revenue: 1000000,
      net_amount: 900000
    };
    await testEndpoint('POST', '/crm-v2/payouts', newPayout);
  }
  
  log('\n=== CRM MODULE TEST COMPLETE ===\n', 'cyan');
}

// Run tests
testCRMModule().catch(error => {
  log(`Test failed: ${error.message}`, 'red');
});
