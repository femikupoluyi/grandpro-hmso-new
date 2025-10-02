const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/hospital';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test EMR APIs
async function testEMR() {
  log('\n🏥 Testing EMR APIs:', 'cyan');
  
  try {
    // Test patient registration
    const patientData = {
      firstName: 'Adebayo',
      lastName: 'Ogundimu',
      dateOfBirth: '1985-06-15',
      gender: 'MALE',
      bloodGroup: 'O+',
      genotype: 'AA',
      phoneNumber: '+2348012345678',
      email: 'adebayo.ogundimu@example.com',
      address: '123 Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      nextOfKinName: 'Funke Ogundimu',
      nextOfKinPhone: '+2348087654321',
      insuranceProvider: 'AXA Mansard',
      nhisNumber: 'NHIS2025123456',
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: ['Hypertension']
    };

    const patientResult = await axios.post(`${API_BASE_URL}/emr/patients`, patientData);
    log('  ✓ Patient registered successfully', 'green');
    log(`    Registration Number: ${patientResult.data.registrationNumber}`, 'blue');
    
    // Test creating encounter
    const encounterData = {
      patientId: 1,
      doctorId: 1,
      departmentId: 1,
      encounterType: 'OUTPATIENT',
      chiefComplaint: 'Headache and fever',
      symptoms: ['Headache', 'Fever', 'Body aches'],
      bloodPressure: '120/80',
      temperature: 38.5,
      pulse: 88,
      respiratoryRate: 18,
      weight: 75,
      height: 175,
      diagnosis: 'Suspected malaria',
      treatmentPlan: 'Antimalarial medication and rest',
      notes: 'Patient advised to return if symptoms persist'
    };

    const encounterResult = await axios.post(`${API_BASE_URL}/emr/encounters`, encounterData);
    log('  ✓ Encounter created successfully', 'green');
    
    // Test adding prescription
    const prescriptionData = {
      patientId: 1,
      encounterId: encounterResult.data.encounter.id,
      doctorId: 1,
      medicationId: 1,
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: 7,
      quantity: 14,
      instructions: 'Take with food',
      dispensed: true,
      dispensedBy: 'Pharmacy Staff',
      dispensingNotes: 'Patient counseled on medication use'
    };

    const prescriptionResult = await axios.post(`${API_BASE_URL}/emr/prescriptions`, prescriptionData);
    log('  ✓ Prescription added successfully', 'green');
    
    // Test lab order
    const labOrderData = {
      patientId: 1,
      encounterId: encounterResult.data.encounter.id,
      doctorId: 1,
      testId: 1,
      priority: 'URGENT',
      clinicalInfo: 'Suspected malaria'
    };

    const labOrderResult = await axios.post(`${API_BASE_URL}/emr/lab-orders`, labOrderData);
    log('  ✓ Lab test ordered successfully', 'green');
    
    return true;
  } catch (error) {
    log(`  ✗ EMR test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test Billing APIs
async function testBilling() {
  log('\n💰 Testing Billing APIs:', 'cyan');
  
  try {
    // Test bill generation
    const billData = {
      patientId: 1,
      encounterId: 1,
      totalAmount: 25000, // ₦25,000
      paymentMethod: 'NHIS',
      nhisNumber: 'NHIS2025123456',
      items: [
        {
          itemType: 'CONSULTATION',
          itemCode: 'CONS001',
          description: 'General Consultation',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000
        },
        {
          itemType: 'MEDICATION',
          itemCode: 'MED001',
          description: 'Antimalarial drugs',
          quantity: 1,
          unitPrice: 3000,
          totalPrice: 3000
        },
        {
          itemType: 'LAB_TEST',
          itemCode: 'LAB001',
          description: 'Malaria test',
          quantity: 1,
          unitPrice: 2000,
          totalPrice: 2000
        },
        {
          itemType: 'PROCEDURE',
          itemCode: 'PROC001',
          description: 'IV administration',
          quantity: 1,
          unitPrice: 15000,
          totalPrice: 15000
        }
      ],
      createdBy: 'Billing Staff'
    };

    const billResult = await axios.post(`${API_BASE_URL}/billing/bills`, billData);
    log('  ✓ Bill generated successfully', 'green');
    log(`    Bill Number: ${billResult.data.bill.billNumber}`, 'blue');
    log(`    Total: ₦${billResult.data.bill.total_amount}`, 'blue');
    log(`    Insurance Coverage: ₦${billResult.data.bill.insuranceCoverage}`, 'blue');
    log(`    Patient Amount: ₦${billResult.data.bill.patientAmount}`, 'blue');
    
    // Test payment processing
    const paymentData = {
      billId: billResult.data.bill.id,
      paymentMethod: 'CASH',
      amountPaid: 7500, // Patient pays 30% (NHIS covers 70%)
      receivedBy: 'Cashier',
      notes: 'Partial payment received'
    };

    const paymentResult = await axios.post(`${API_BASE_URL}/billing/payments`, paymentData);
    log('  ✓ Payment processed successfully', 'green');
    log(`    Reference: ${paymentResult.data.referenceNumber}`, 'blue');
    
    // Test revenue report
    const revenueReport = await axios.get(`${API_BASE_URL}/billing/revenue-report`);
    log('  ✓ Revenue report retrieved', 'green');
    log(`    Collection Rate: ${revenueReport.data.collectionRate}%`, 'blue');
    
    return true;
  } catch (error) {
    log(`  ✗ Billing test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test Inventory APIs
async function testInventory() {
  log('\n📦 Testing Inventory APIs:', 'cyan');
  
  try {
    // Test adding inventory item
    const itemData = {
      itemName: 'Paracetamol 500mg',
      category: 'MEDICATION',
      itemType: 'Tablet',
      unitOfMeasure: 'Tablet',
      quantityInStock: 5000,
      reorderLevel: 1000,
      reorderQuantity: 3000,
      unitCost: 2,
      sellingPrice: 5,
      supplierId: 1,
      expiryDate: '2026-12-31',
      batchNumber: 'BATCH2025001',
      location: 'Pharmacy Store A',
      createdBy: 'Pharmacy Admin'
    };

    const itemResult = await axios.post(`${API_BASE_URL}/inventory/items`, itemData);
    log('  ✓ Inventory item added successfully', 'green');
    log(`    Item Code: ${itemResult.data.item.item_code}`, 'blue');
    
    // Test stock update
    const stockUpdate = {
      itemId: itemResult.data.item.id,
      movementType: 'DISPENSED',
      quantity: 100,
      reason: 'Patient prescription',
      performedBy: 'Pharmacist',
      notes: 'Dispensed to multiple patients'
    };

    const stockResult = await axios.post(`${API_BASE_URL}/inventory/stock-movements`, stockUpdate);
    log('  ✓ Stock updated successfully', 'green');
    log(`    New Quantity: ${stockResult.data.newQuantity}`, 'blue');
    
    // Test low stock items
    const lowStock = await axios.get(`${API_BASE_URL}/inventory/low-stock`);
    log('  ✓ Low stock items retrieved', 'green');
    log(`    Out of Stock: ${lowStock.data.summary.outOfStock}`, 'blue');
    log(`    Critical: ${lowStock.data.summary.critical}`, 'blue');
    
    // Test expiring items
    const expiring = await axios.get(`${API_BASE_URL}/inventory/expiring?daysAhead=365`);
    log('  ✓ Expiring items retrieved', 'green');
    log(`    Expired: ${expiring.data.summary.expired}`, 'blue');
    log(`    Critical: ${expiring.data.summary.critical}`, 'blue');
    
    // Test inventory value report
    const valueReport = await axios.get(`${API_BASE_URL}/inventory/value-report`);
    log('  ✓ Inventory value report generated', 'green');
    log(`    Total Value: ₦${valueReport.data.summary.totalValue}`, 'blue');
    log(`    Profit Margin: ${valueReport.data.profitMargin}%`, 'blue');
    
    return true;
  } catch (error) {
    log(`  ✗ Inventory test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test HR APIs
async function testHR() {
  log('\n👥 Testing HR & Rostering APIs:', 'cyan');
  
  try {
    // Test adding staff
    const staffData = {
      firstName: 'Fatima',
      lastName: 'Abdullahi',
      email: 'fatima.abdullahi@hospital.com',
      phoneNumber: '+2348098765432',
      role: 'DOCTOR',
      departmentId: 1,
      specialization: 'General Medicine',
      qualification: 'MBBS, MPH',
      employmentType: 'FULL_TIME',
      salaryGrade: 'SG-14',
      baseSalary: 500000, // ₦500,000 monthly
      allowances: {
        housing: 100000,
        transport: 50000,
        medical: 30000
      },
      bankName: 'First Bank',
      accountNumber: '3012345678',
      nextOfKinName: 'Ibrahim Abdullahi',
      nextOfKinPhone: '+2348012345679',
      address: '45 Maitama District',
      city: 'Abuja',
      state: 'FCT'
    };

    const staffResult = await axios.post(`${API_BASE_URL}/hr/staff`, staffData);
    log('  ✓ Staff member added successfully', 'green');
    log(`    Staff ID: ${staffResult.data.staffId}`, 'blue');
    
    // Test roster creation
    const rosterData = {
      schedules: [
        {
          staffId: staffResult.data.staff.id,
          departmentId: 1,
          shiftType: 'MORNING',
          date: '2025-10-03',
          startTime: '08:00',
          endTime: '16:00'
        },
        {
          staffId: staffResult.data.staff.id,
          departmentId: 1,
          shiftType: 'MORNING',
          date: '2025-10-04',
          startTime: '08:00',
          endTime: '16:00'
        }
      ],
      createdBy: 'HR Admin'
    };

    const rosterResult = await axios.post(`${API_BASE_URL}/hr/roster`, rosterData);
    log('  ✓ Roster created successfully', 'green');
    log(`    Scheduled: ${rosterResult.data.totalScheduled} shifts`, 'blue');
    
    // Test attendance recording
    const attendanceData = {
      staffId: staffResult.data.staff.id,
      type: 'CHECK_IN',
      shiftType: 'MORNING',
      location: 'Main Hospital'
    };

    const attendanceResult = await axios.post(`${API_BASE_URL}/hr/attendance`, attendanceData);
    log('  ✓ Attendance recorded successfully', 'green');
    
    // Test leave application
    const leaveData = {
      staffId: staffResult.data.staff.id,
      leaveType: 'ANNUAL',
      startDate: '2025-12-20',
      endDate: '2025-12-31',
      reason: 'Annual vacation',
      reliefStaffId: null
    };

    const leaveResult = await axios.post(`${API_BASE_URL}/hr/leave-applications`, leaveData);
    log('  ✓ Leave application submitted', 'green');
    log(`    Days Requested: ${leaveResult.data.daysRequested}`, 'blue');
    
    // Test payroll calculation
    const payrollResult = await axios.get(`${API_BASE_URL}/hr/payroll?month=10&year=2025`);
    log('  ✓ Payroll calculated successfully', 'green');
    log(`    Total Staff: ${payrollResult.data.summary.totalStaff}`, 'blue');
    log(`    Total Net Pay: ₦${payrollResult.data.summary.totalNetPay}`, 'blue');
    
    return true;
  } catch (error) {
    log(`  ✗ HR test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test Analytics APIs
async function testAnalytics() {
  log('\n📊 Testing Real-time Analytics APIs:', 'cyan');
  
  try {
    // Test occupancy analytics
    const occupancy = await axios.get(`${API_BASE_URL}/analytics/occupancy`);
    log('  ✓ Occupancy analytics retrieved', 'green');
    log(`    Total Beds: ${occupancy.data.occupancy.summary.totalBeds}`, 'blue');
    log(`    Occupancy Rate: ${occupancy.data.occupancy.summary.occupancyRate}%`, 'blue');
    
    // Test patient flow
    const patientFlow = await axios.get(`${API_BASE_URL}/analytics/patient-flow`);
    log('  ✓ Patient flow analytics retrieved', 'green');
    log(`    Total Today: ${patientFlow.data.patientFlow.summary.totalToday}`, 'blue');
    log(`    Currently Waiting: ${patientFlow.data.patientFlow.summary.currentlyWaiting}`, 'blue');
    log(`    Avg Wait Time: ${patientFlow.data.patientFlow.summary.avgWaitTime} minutes`, 'blue');
    
    // Test department performance
    const deptPerformance = await axios.get(`${API_BASE_URL}/analytics/department-performance`);
    log('  ✓ Department performance retrieved', 'green');
    log(`    Departments Analyzed: ${deptPerformance.data.departments.length}`, 'blue');
    
    // Test resource utilization
    const utilization = await axios.get(`${API_BASE_URL}/analytics/resource-utilization`);
    log('  ✓ Resource utilization retrieved', 'green');
    
    // Test financial metrics
    const financial = await axios.get(`${API_BASE_URL}/analytics/financial?period=30days`);
    log('  ✓ Financial metrics retrieved', 'green');
    log(`    Monthly Revenue: ₦${financial.data.financial.total_net_revenue || 0}`, 'blue');
    
    // Test predictive analytics
    const predictions = await axios.get(`${API_BASE_URL}/analytics/predictions`);
    log('  ✓ Predictive analytics generated', 'green');
    log(`    Expected Tomorrow: ${predictions.data.predictions.patientVolume.tomorrow} patients`, 'blue');
    
    // Test executive dashboard
    const dashboard = await axios.get(`${API_BASE_URL}/analytics/executive-dashboard`);
    log('  ✓ Executive dashboard generated', 'green');
    
    return true;
  } catch (error) {
    log(`  ✗ Analytics test failed: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(70), 'magenta');
  log('   Hospital Management Backend Testing Suite', 'magenta');
  log('='.repeat(70), 'magenta');
  
  log('\n📋 Testing Configuration:', 'cyan');
  log(`  API Base URL: ${API_BASE_URL}`, 'blue');
  log(`  Environment: Development`, 'blue');
  log(`  Currency: Nigerian Naira (₦)`, 'blue');
  
  const results = {
    emr: await testEMR(),
    billing: await testBilling(),
    inventory: await testInventory(),
    hr: await testHR(),
    analytics: await testAnalytics()
  };
  
  // Summary
  log('\n' + '='.repeat(70), 'magenta');
  log('                    Test Results', 'magenta');
  log('='.repeat(70), 'magenta');
  
  const allPassed = Object.values(results).every(result => result);
  
  log('\n📊 Module Test Results:', 'cyan');
  log(`  EMR APIs: ${results.emr ? '✅ PASSED' : '❌ FAILED'}`, results.emr ? 'green' : 'red');
  log(`  Billing APIs: ${results.billing ? '✅ PASSED' : '❌ FAILED'}`, results.billing ? 'green' : 'red');
  log(`  Inventory APIs: ${results.inventory ? '✅ PASSED' : '❌ FAILED'}`, results.inventory ? 'green' : 'red');
  log(`  HR & Rostering APIs: ${results.hr ? '✅ PASSED' : '❌ FAILED'}`, results.hr ? 'green' : 'red');
  log(`  Analytics APIs: ${results.analytics ? '✅ PASSED' : '❌ FAILED'}`, results.analytics ? 'green' : 'red');
  
  if (allPassed) {
    log('\n✅ ALL TESTS PASSED', 'green');
    log('\n🎯 Key Features Implemented:', 'cyan');
    log('  • Electronic Medical Records with patient registration', 'blue');
    log('  • Comprehensive billing with NHIS/HMO integration', 'blue');
    log('  • Inventory management with reorder alerts', 'blue');
    log('  • HR management with rostering and payroll', 'blue');
    log('  • Real-time analytics and predictive insights', 'blue');
    log('  • Nigerian localization throughout', 'blue');
  } else {
    log('\n❌ SOME TESTS FAILED', 'red');
    log('Please check the error messages above for details.', 'red');
  }
  
  log('\n' + '='.repeat(70) + '\n', 'magenta');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
