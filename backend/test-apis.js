#!/usr/bin/env node
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001';
let authToken = '';
let userId = 0;
let hospitalId = 0;
let applicationId = 0;

// Utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const apiCall = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
};

// Test Functions
async function testAuth() {
  console.log('\n=== Testing Authentication ===');
  
  // Register a new user
  const registerData = {
    email: `test${Date.now()}@grandpro.com.ng`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin'
  };
  
  const registerResult = await apiCall('POST', '/api/auth/register', registerData);
  if (registerResult.success) {
    console.log('✅ Registration successful');
    userId = registerResult.data.user.id;
  } else {
    console.log('❌ Registration failed:', registerResult.error);
  }
  
  // Login
  const loginData = {
    email: registerData.email,
    password: registerData.password
  };
  
  const loginResult = await apiCall('POST', '/api/auth/login', loginData);
  if (loginResult.success) {
    console.log('✅ Login successful');
    authToken = loginResult.data.token;
  } else {
    console.log('❌ Login failed:', loginResult.error);
  }
  
  return loginResult.success;
}

async function testHospitalOnboarding() {
  console.log('\n=== Testing Hospital Onboarding ===');
  
  // Create hospital
  const hospitalData = {
    name: 'Lagos State General Hospital',
    address: '123 Victoria Island, Lagos',
    city: 'Lagos',
    state: 'Lagos',
    phoneNumber: '+2348033456789',
    email: 'info@lagosgeneral.ng',
    type: 'general',
    bedCapacity: 150,
    servicesOffered: ['emergency', 'surgery', 'maternity'],
    hasEmergency: true,
    hasPharmacy: true,
    hasLab: true
  };
  
  const hospitalResult = await apiCall('POST', '/api/hospitals', hospitalData);
  if (hospitalResult.success) {
    console.log('✅ Hospital created successfully');
    hospitalId = hospitalResult.data.hospital?.id || hospitalResult.data.id;
  } else {
    console.log('❌ Hospital creation failed:', hospitalResult.error);
  }
  
  // Get onboarding status
  const statusResult = await apiCall('GET', '/api/onboarding/status');
  if (statusResult.success) {
    console.log('✅ Onboarding status retrieved');
  } else {
    console.log('❌ Onboarding status failed:', statusResult.error);
  }
  
  return hospitalResult.success;
}

async function testContracts() {
  console.log('\n=== Testing Contracts ===');
  
  // Generate contract
  const contractData = {
    hospitalId: hospitalId || 1,
    ownerName: 'Dr. Adebayo Johnson',
    ownerEmail: 'adebayo@lagosgeneral.ng',
    hospitalName: 'Lagos State General Hospital',
    contractTerms: 'Standard terms and conditions',
    commissionRate: 15,
    contractDuration: 12
  };
  
  const contractResult = await apiCall('POST', '/api/contracts/generate', contractData);
  if (contractResult.success) {
    console.log('✅ Contract generated successfully');
  } else {
    console.log('❌ Contract generation failed:', contractResult.error);
  }
  
  return contractResult.success;
}

async function testCRM() {
  console.log('\n=== Testing CRM ===');
  
  // Create patient
  const patientData = {
    firstName: 'Kemi',
    lastName: 'Adeyemi',
    email: 'kemi@example.com',
    phoneNumber: '+2348012345678',
    dateOfBirth: '1990-05-15',
    gender: 'female',
    address: '456 Ikoyi, Lagos'
  };
  
  const patientResult = await apiCall('POST', '/api/crm/patients', patientData);
  if (patientResult.success) {
    console.log('✅ Patient created successfully');
  } else {
    console.log('❌ Patient creation failed:', patientResult.error);
  }
  
  // Schedule appointment
  const appointmentData = {
    patientId: patientResult.data?.id || 1,
    hospitalId: hospitalId || 1,
    doctorId: 1,
    appointmentDate: new Date(Date.now() + 86400000).toISOString(),
    appointmentType: 'consultation',
    reason: 'General checkup'
  };
  
  const appointmentResult = await apiCall('POST', '/api/crm/patients/appointments', appointmentData);
  if (appointmentResult.success) {
    console.log('✅ Appointment scheduled successfully');
  } else {
    console.log('❌ Appointment scheduling failed:', appointmentResult.error);
  }
  
  return patientResult.success;
}

async function testHospitalManagement() {
  console.log('\n=== Testing Hospital Management ===');
  
  // Create medical record
  const emrData = {
    patientId: 1,
    hospitalId: hospitalId || 1,
    doctorId: 1,
    visitType: 'outpatient',
    chiefComplaint: 'Headache and fever',
    presentIllness: 'Patient has been experiencing headaches for 3 days',
    vitalSigns: {
      bloodPressure: '120/80',
      pulse: 72,
      temperature: 37.5,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 70,
      height: 170
    },
    diagnosis: [{
      code: 'J11.1',
      description: 'Influenza with other respiratory manifestations'
    }],
    prescriptions: [{
      medication: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Three times daily',
      duration: '5 days'
    }]
  };
  
  const emrResult = await apiCall('POST', '/api/emr/records', emrData);
  if (emrResult.success) {
    console.log('✅ Medical record created successfully');
  } else {
    console.log('❌ Medical record creation failed:', emrResult.error);
  }
  
  // Create invoice
  const invoiceData = {
    patientId: 1,
    hospitalId: hospitalId || 1,
    items: [
      { description: 'Consultation', quantity: 1, unitPrice: 5000 },
      { description: 'Lab Test', quantity: 1, unitPrice: 3000 },
      { description: 'Medication', quantity: 1, unitPrice: 2000 }
    ],
    paymentMethod: 'cash',
    discountType: 'percentage',
    discountValue: 10
  };
  
  const invoiceResult = await apiCall('POST', '/api/billing/invoices', invoiceData);
  if (invoiceResult.success) {
    console.log('✅ Invoice created successfully');
  } else {
    console.log('❌ Invoice creation failed:', invoiceResult.error);
  }
  
  // Update inventory
  const inventoryData = {
    hospitalId: hospitalId || 1,
    itemId: 1,
    itemName: 'Paracetamol 500mg',
    category: 'medication',
    quantity: 100,
    unit: 'tablets',
    transactionType: 'receipt',
    batchNumber: 'BATCH001',
    expiryDate: '2026-12-31',
    unitCost: 10,
    supplier: 'Lagos Pharma Ltd'
  };
  
  const inventoryResult = await apiCall('POST', '/api/inventory/update', inventoryData);
  if (inventoryResult.success) {
    console.log('✅ Inventory updated successfully');
  } else {
    console.log('❌ Inventory update failed:', inventoryResult.error);
  }
  
  return emrResult.success;
}

async function testOperations() {
  console.log('\n=== Testing Operations ===');
  
  // Get hospital dashboard
  const dashboardResult = await apiCall('GET', `/api/operations/dashboard/${hospitalId || 1}`);
  if (dashboardResult.success) {
    console.log('✅ Dashboard data retrieved successfully');
  } else {
    console.log('❌ Dashboard retrieval failed:', dashboardResult.error);
  }
  
  // Get alerts
  const alertsResult = await apiCall('GET', `/api/operations/alerts/${hospitalId || 1}`);
  if (alertsResult.success) {
    console.log('✅ Alerts retrieved successfully');
  } else {
    console.log('❌ Alerts retrieval failed:', alertsResult.error);
  }
  
  return dashboardResult.success;
}

async function testCommunications() {
  console.log('\n=== Testing Communications ===');
  
  // Test email (will likely fail without proper config)
  const emailData = {
    to: 'patient@example.com',
    subject: 'Appointment Reminder',
    body: 'Your appointment is scheduled for tomorrow at 10 AM'
  };
  
  const emailResult = await apiCall('POST', '/api/crm/communications/email', emailData);
  if (emailResult.success) {
    console.log('✅ Email sent successfully');
  } else {
    console.log('⚠️  Email sending failed (expected without config):', emailResult.error);
  }
  
  // Test SMS (will likely fail without Twilio config)
  const smsData = {
    to: '+2348012345678',
    message: 'Your appointment is confirmed for tomorrow at 10 AM'
  };
  
  const smsResult = await apiCall('POST', '/api/crm/communications/sms', smsData);
  if (smsResult.success) {
    console.log('✅ SMS sent successfully');
  } else {
    console.log('⚠️  SMS sending failed (expected without config):', smsResult.error);
  }
  
  return true; // Don't fail on communication tests as they need external config
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting GrandPro HMSO API Tests');
  console.log('================================');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test Authentication
  if (await testAuth()) {
    passedTests++;
  }
  totalTests++;
  
  // Test Hospital Onboarding
  if (await testHospitalOnboarding()) {
    passedTests++;
  }
  totalTests++;
  
  // Test Contracts
  if (await testContracts()) {
    passedTests++;
  }
  totalTests++;
  
  // Test CRM
  if (await testCRM()) {
    passedTests++;
  }
  totalTests++;
  
  // Test Hospital Management
  if (await testHospitalManagement()) {
    passedTests++;
  }
  totalTests++;
  
  // Test Operations
  if (await testOperations()) {
    passedTests++;
  }
  totalTests++;
  
  // Test Communications
  if (await testCommunications()) {
    passedTests++;
  }
  totalTests++;
  
  // Summary
  console.log('\n================================');
  console.log('📊 Test Summary');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} tests failed`);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
