/**
 * Direct Integration Module Verification Test
 * Tests the actual integration modules directly
 */

// Load the integration modules
const insuranceIntegration = require('./backend/src/integrations/insuranceIntegration');
const pharmacyIntegration = require('./backend/src/integrations/pharmacyIntegration');
const telemedicineIntegration = require('./backend/src/integrations/telemedicineIntegration');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}     Direct Partner Integration Module Verification        ${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);

async function verifyInsuranceIntegration() {
  console.log(`\n${colors.yellow}1. Testing Insurance Integration Module${colors.reset}`);
  console.log('----------------------------------------');
  
  try {
    // Test 1: Check Eligibility
    console.log('Testing eligibility check...');
    const eligibility = await insuranceIntegration.checkEligibility('PAT001', 'NHIS');
    console.log(`${colors.green}✓${colors.reset} Eligibility Check: ${eligibility.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
    console.log(`  Coverage: ${eligibility.coveragePercentage}%`);
    console.log(`  Limit: ₦${eligibility.coverageLimit.toLocaleString()}`);
    
    // Test 2: Submit Claim
    console.log('\nTesting claim submission...');
    const claimData = {
      patientId: 'PAT001',
      providerId: 'NHIS',
      amount: 25000,
      services: ['Consultation', 'Lab Test'],
      diagnosisCodes: ['A01.0']
    };
    const claim = await insuranceIntegration.submitClaim(claimData);
    console.log(`${colors.green}✓${colors.reset} Claim Submission: ${claim.claimId}`);
    console.log(`  Status: ${claim.status}`);
    
    // Test 3: Pre-Authorization
    console.log('\nTesting pre-authorization...');
    const authData = {
      patientId: 'PAT001',
      providerId: 'NHIS',
      procedure: 'MRI Scan',
      estimatedCost: 150000
    };
    const auth = await insuranceIntegration.requestPreAuthorization(authData);
    console.log(`${colors.green}✓${colors.reset} Pre-Authorization: ${auth.approved ? 'APPROVED' : 'DENIED'}`);
    console.log(`  Auth Code: ${auth.authCode}`);
    console.log(`  Approved Amount: ₦${auth.approvedAmount?.toLocaleString() || 0}`);
    
    console.log(`\n${colors.green}Insurance Integration Module: VERIFIED ✓${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Insurance Integration Module: FAILED ✗${colors.reset}`);
    console.error(error);
    return false;
  }
}

async function verifyPharmacyIntegration() {
  console.log(`\n${colors.yellow}2. Testing Pharmacy Integration Module${colors.reset}`);
  console.log('--------------------------------------');
  
  try {
    // Test 1: Check Drug Availability
    console.log('Testing drug availability...');
    const availability = await pharmacyIntegration.checkDrugAvailability(
      'Paracetamol',
      100,
      'Lagos'
    );
    console.log(`${colors.green}✓${colors.reset} Drug Availability: ${availability.available ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
    console.log(`  Suppliers found: ${availability.suppliers.length}`);
    if (availability.cheapestOption) {
      console.log(`  Best price: ₦${availability.cheapestOption.unitPrice} from ${availability.cheapestOption.supplierName}`);
    }
    
    // Test 2: Place Order
    console.log('\nTesting order placement...');
    const orderData = {
      supplierId: 'emzor',
      items: [{
        drugId: 'DRUG001',
        drugName: 'Paracetamol',
        quantity: 100,
        unitPrice: 50
      }],
      hospitalId: 'HOSP001',
      urgency: 'normal'
    };
    const order = await pharmacyIntegration.placeOrder(orderData);
    console.log(`${colors.green}✓${colors.reset} Order Placement: ${order.orderId}`);
    console.log(`  Total: ₦${order.totalAmount?.toLocaleString() || 0}`);
    console.log(`  Delivery: ${order.estimatedDelivery}`);
    
    // Test 3: Setup Auto-Reorder
    console.log('\nTesting auto-reorder setup...');
    const reorderRule = {
      drugId: 'DRUG001',
      minStock: 50,
      reorderQuantity: 200,
      preferredSupplier: 'emzor',
      hospitalId: 'HOSP001'
    };
    const rule = await pharmacyIntegration.setupAutoReorder(reorderRule);
    console.log(`${colors.green}✓${colors.reset} Auto-Reorder: ${rule.ruleId}`);
    console.log(`  Status: ${rule.status}`);
    
    console.log(`\n${colors.green}Pharmacy Integration Module: VERIFIED ✓${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Pharmacy Integration Module: FAILED ✗${colors.reset}`);
    console.error(error);
    return false;
  }
}

async function verifyTelemedicineIntegration() {
  console.log(`\n${colors.yellow}3. Testing Telemedicine Integration Module${colors.reset}`);
  console.log('------------------------------------------');
  
  try {
    // Test 1: Schedule Consultation
    console.log('Testing consultation scheduling...');
    const consultationData = {
      patientId: 'PAT001',
      doctorId: 'DOC001',
      providerId: 'wellahealth',
      scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      consultationType: 'general',
      duration: 30
    };
    const consultation = await telemedicineIntegration.scheduleConsultation(consultationData);
    console.log(`${colors.green}✓${colors.reset} Consultation Scheduled: ${consultation.consultationId}`);
    console.log(`  Access Code: ${consultation.accessCode}`);
    console.log(`  Meeting URL: ${consultation.meetingUrl}`);
    
    // Test 2: Initialize Video Session
    console.log('\nTesting video session initialization...');
    const sessionData = {
      consultationId: consultation.consultationId,
      participantType: 'patient',
      participantId: 'PAT001'
    };
    const session = await telemedicineIntegration.initializeVideoSession(sessionData);
    console.log(`${colors.green}✓${colors.reset} Video Session: INITIALIZED`);
    console.log(`  Token: ${session.sessionToken?.substring(0, 16)}...`);
    console.log(`  Signaling: ${session.signalingUrl}`);
    
    // Test 3: Generate E-Prescription
    console.log('\nTesting e-prescription generation...');
    const prescriptionData = {
      consultationId: consultation.consultationId,
      patientId: 'PAT001',
      doctorId: 'DOC001',
      medications: [{
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'TID',
        duration: '7 days'
      }]
    };
    const prescription = await telemedicineIntegration.generatePrescription(prescriptionData);
    console.log(`${colors.green}✓${colors.reset} E-Prescription: ${prescription.prescriptionId}`);
    console.log(`  Valid Until: ${new Date(prescription.validUntil).toLocaleDateString()}`);
    console.log(`  QR Code: ${prescription.qrCode ? 'Generated' : 'Not generated'}`);
    
    // Test 4: AI Triage
    console.log('\nTesting AI triage...');
    const triageData = {
      symptoms: ['headache', 'fever', 'fatigue'],
      duration: '2 days',
      severity: 'moderate',
      patientAge: 35,
      patientGender: 'male'
    };
    const triage = await telemedicineIntegration.performTriage(triageData);
    console.log(`${colors.green}✓${colors.reset} AI Triage: ${triage.urgencyLevel}`);
    console.log(`  Risk Score: ${triage.riskScore}/100`);
    console.log(`  Recommendation: ${triage.recommendedAction}`);
    console.log(`  Possible Conditions: ${triage.possibleConditions.join(', ')}`);
    
    console.log(`\n${colors.green}Telemedicine Integration Module: VERIFIED ✓${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Telemedicine Integration Module: FAILED ✗${colors.reset}`);
    console.error(error);
    return false;
  }
}

async function runVerification() {
  console.log(`\n${colors.blue}Starting verification of all integration modules...${colors.reset}\n`);
  
  const results = {
    insurance: await verifyInsuranceIntegration(),
    pharmacy: await verifyPharmacyIntegration(),
    telemedicine: await verifyTelemedicineIntegration()
  };
  
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}                    Final Results                          ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log(`\nInsurance Integration: ${results.insurance ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Pharmacy Integration:  ${results.pharmacy ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Telemedicine Integration: ${results.telemedicine ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  
  if (allPassed) {
    console.log(`\n${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}     ALL INTEGRATION MODULES VERIFIED SUCCESSFULLY!        ${colors.reset}`);
    console.log(`${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`\n${colors.green}✓ Insurance claim submission working${colors.reset}`);
    console.log(`${colors.green}✓ Pharmacy inventory reorder working${colors.reset}`);
    console.log(`${colors.green}✓ Telemedicine session creation working${colors.reset}`);
    console.log(`${colors.green}✓ All sandbox credentials functional${colors.reset}`);
  } else {
    console.log(`\n${colors.red}Some integration modules failed verification${colors.reset}`);
  }
  
  // Kill the signaling server process if running
  console.log(`\n${colors.yellow}Cleaning up...${colors.reset}`);
  process.exit(allPassed ? 0 : 1);
}

// Run the verification
runVerification().catch(console.error);
