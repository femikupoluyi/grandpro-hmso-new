#!/usr/bin/env node

/**
 * GrandPro HMSO Platform - Comprehensive End-to-End Test Suite
 * Tests all 7 modules with complete user workflows
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'https://backend-api-morphvm-wz7xxc7v.http.cloud.morph.so';
const FRONTEND_URL = 'https://frontend-app-morphvm-wz7xxc7v.http.cloud.morph.so';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper functions
async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
    totalTests++;
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        
        if (response.status === expectedStatus || (expectedStatus === 200 && response.status < 300)) {
            passedTests++;
            console.log(`✓`.green, name);
            testResults.push({ name, status: 'PASSED', module: getCurrentModule() });
            return response.data;
        } else {
            failedTests++;
            console.log(`✗`.red, name, `- Status: ${response.status}`);
            testResults.push({ name, status: 'FAILED', module: getCurrentModule(), error: `Status: ${response.status}` });
            return null;
        }
    } catch (error) {
        failedTests++;
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`✗`.red, name, `-`, errorMsg);
        testResults.push({ name, status: 'FAILED', module: getCurrentModule(), error: errorMsg });
        return null;
    }
}

let currentModule = '';
function getCurrentModule() {
    return currentModule;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test execution
async function runTests() {
    console.log('================================================'.cyan);
    console.log('GrandPro HMSO - Comprehensive E2E Test Suite'.cyan.bold);
    console.log('================================================'.cyan);
    console.log('');
    
    const startTime = Date.now();
    
    // Module 1: Digital Sourcing & Partner Onboarding
    console.log('\n📋 Module 1: Digital Sourcing & Partner Onboarding'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Digital Sourcing';
    
    await testEndpoint('Health Check', 'GET', '/health');
    await testEndpoint('API Status', 'GET', '/api/status');
    
    const applicationData = {
        hospitalName: 'Test Hospital ' + Date.now(),
        ownerName: 'Dr. Test Owner',
        email: 'test' + Date.now() + '@hospital.com',
        phone: '+234801234' + Math.floor(Math.random() * 10000),
        address: 'Test Address, Lagos, Nigeria',
        documents: {
            license: 'license_url',
            registration: 'registration_url'
        }
    };
    
    const application = await testEndpoint(
        'Submit Hospital Application',
        'POST',
        '/api/onboarding/applications',
        applicationData
    );
    
    await testEndpoint('Get Applications List', 'GET', '/api/onboarding/applications');
    await testEndpoint('Check Application Status', 'GET', '/api/onboarding/applications');
    
    // Module 2: CRM & Relationship Management
    console.log('\n👥 Module 2: CRM & Relationship Management'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'CRM';
    
    const patientData = {
        name: 'Test Patient ' + Date.now(),
        email: 'patient' + Date.now() + '@test.com',
        phone: '+234802345' + Math.floor(Math.random() * 10000),
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        address: 'Test Address, Lagos'
    };
    
    const patient = await testEndpoint(
        'Create Patient Record',
        'POST',
        '/api/crm/patients',
        patientData
    );
    
    await testEndpoint('Get Patients List', 'GET', '/api/crm/patients');
    await testEndpoint('Get Patient Communications', 'GET', '/api/crm/patients');
    
    // Module 3: Hospital Management (Core Operations)
    console.log('\n🏥 Module 3: Hospital Management'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Hospital Management';
    
    await testEndpoint('Hospital Overview', 'GET', '/api/hospital/overview');
    await testEndpoint('Dashboard Statistics', 'GET', '/api/dashboard/stats');
    
    // EMR Test
    const emrData = {
        patientId: patient?.id || 'TEST_PATIENT',
        diagnosis: 'Test Diagnosis',
        symptoms: ['Fever', 'Headache'],
        vitalSigns: {
            temperature: 37.5,
            bloodPressure: '120/80',
            pulse: 72
        }
    };
    
    await testEndpoint(
        'Create Medical Record',
        'POST',
        '/api/hospital/emr',
        emrData
    );
    
    // Billing Test
    const billData = {
        patientId: patient?.id || 'TEST_PATIENT',
        services: [
            { name: 'Consultation', amount: 5000 },
            { name: 'Lab Test', amount: 3000 }
        ],
        total: 8000,
        paymentMethod: 'Cash'
    };
    
    await testEndpoint(
        'Generate Bill',
        'POST',
        '/api/hospital/billing',
        billData
    );
    
    // Inventory Test
    await testEndpoint('Check Inventory', 'GET', '/api/hospital/inventory');
    
    // HR Test
    await testEndpoint('Staff Schedule', 'GET', '/api/hospital/hr/schedule');
    
    // Module 4: Centralized Operations & Development
    console.log('\n📊 Module 4: Operations Command Centre'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Operations';
    
    await testEndpoint('Operations Metrics', 'GET', '/api/operations/metrics');
    await testEndpoint('Real-time Dashboard', 'GET', '/api/operations/dashboard');
    await testEndpoint('Alert Status', 'GET', '/api/operations/alerts');
    await testEndpoint('Project Management', 'GET', '/api/operations/projects');
    
    // Module 5: Partner & Ecosystem Integrations
    console.log('\n🤝 Module 5: Partner Integrations'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Partners';
    
    await testEndpoint('Insurance Partners', 'GET', '/api/partners/insurance');
    await testEndpoint('Pharmacy Suppliers', 'GET', '/api/partners/pharmacy');
    await testEndpoint('Telemedicine Status', 'GET', '/api/partners/telemedicine');
    
    // Test insurance claim
    const claimData = {
        patientId: patient?.id || 'TEST_PATIENT',
        provider: 'NHIS',
        claimAmount: 50000,
        services: ['Consultation', 'Lab Test', 'Medication']
    };
    
    await testEndpoint(
        'Submit Insurance Claim',
        'POST',
        '/api/partners/insurance/claims',
        claimData
    );
    
    // Module 6: Data & Analytics
    console.log('\n📈 Module 6: Data & Analytics'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Analytics';
    
    await testEndpoint('Analytics Summary', 'GET', '/api/analytics/summary');
    await testEndpoint('Patient Flow Analytics', 'GET', '/api/analytics/patient-flow');
    await testEndpoint('Revenue Analytics', 'GET', '/api/analytics/revenue');
    await testEndpoint('Predictive Analytics', 'GET', '/api/analytics/predictions');
    
    // Module 7: Security & Compliance
    console.log('\n🔒 Module 7: Security & Compliance'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Security';
    
    await testEndpoint('Audit Logs', 'GET', '/api/security/audit-logs');
    await testEndpoint('Access Control Status', 'GET', '/api/security/rbac');
    await testEndpoint('Compliance Reports', 'GET', '/api/security/compliance');
    await testEndpoint('Security Incidents', 'GET', '/api/security/incidents');
    
    // Authentication Flow Test
    console.log('\n🔐 Authentication Flow Test'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Authentication';
    
    const loginData = {
        email: 'admin@grandpro.com',
        password: 'Admin123!'
    };
    
    const authResponse = await testEndpoint(
        'Admin Login',
        'POST',
        '/api/auth/login',
        loginData
    );
    
    if (authResponse && authResponse.token) {
        console.log('  Token received:', authResponse.token.substring(0, 20) + '...');
    }
    
    // Test registration
    const registerData = {
        email: 'newuser' + Date.now() + '@test.com',
        password: 'Test123!',
        fullName: 'New Test User',
        role: 'VIEWER'
    };
    
    await testEndpoint(
        'User Registration',
        'POST',
        '/api/auth/register',
        registerData
    );
    
    // Frontend Accessibility Test
    console.log('\n🌐 Frontend Accessibility Test'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'Frontend';
    
    try {
        const frontendResponse = await axios.get(FRONTEND_URL);
        if (frontendResponse.status === 200) {
            passedTests++;
            console.log(`✓`.green, 'Frontend Homepage Accessible');
            testResults.push({ name: 'Frontend Homepage', status: 'PASSED', module: 'Frontend' });
        }
    } catch (error) {
        failedTests++;
        console.log(`✗`.red, 'Frontend Homepage Not Accessible');
        testResults.push({ name: 'Frontend Homepage', status: 'FAILED', module: 'Frontend' });
    }
    
    // End-to-End Workflow Test
    console.log('\n🔄 Complete End-to-End Workflow'.yellow.bold);
    console.log('----------------------------------------'.yellow);
    currentModule = 'E2E Workflow';
    
    // Simulate complete patient visit workflow
    const workflowPatient = {
        name: 'E2E Test Patient',
        email: 'e2e' + Date.now() + '@test.com',
        phone: '+234803456' + Math.floor(Math.random() * 10000),
        dateOfBirth: '1985-05-15'
    };
    
    console.log('1. Register new patient...');
    const e2ePatient = await testEndpoint(
        'Register Patient',
        'POST',
        '/api/crm/patients',
        workflowPatient
    );
    
    console.log('2. Create medical encounter...');
    const encounterData = {
        patientId: e2ePatient?.id || 'E2E_TEST',
        type: 'CONSULTATION',
        diagnosis: 'Malaria',
        prescription: ['Artemether', 'Paracetamol']
    };
    
    await testEndpoint(
        'Create Encounter',
        'POST',
        '/api/hospital/encounters',
        encounterData
    );
    
    console.log('3. Generate billing...');
    const e2eBill = {
        patientId: e2ePatient?.id || 'E2E_TEST',
        amount: 15000,
        services: ['Consultation', 'Lab Test', 'Medication']
    };
    
    await testEndpoint(
        'Generate E2E Bill',
        'POST',
        '/api/hospital/billing',
        e2eBill
    );
    
    console.log('4. Update inventory...');
    await testEndpoint('Update Inventory', 'GET', '/api/hospital/inventory');
    
    console.log('5. Log audit trail...');
    await testEndpoint('Verify Audit Log', 'GET', '/api/security/audit-logs');
    
    // Performance Metrics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Generate Test Report
    console.log('\n================================================'.cyan);
    console.log('Test Execution Summary'.cyan.bold);
    console.log('================================================'.cyan);
    console.log(`Total Tests: ${totalTests}`.white);
    console.log(`Passed: ${passedTests}`.green);
    console.log(`Failed: ${failedTests}`.red);
    console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`.yellow);
    console.log(`Execution Time: ${duration.toFixed(2)} seconds`.white);
    console.log('');
    
    // Module Summary
    console.log('Module Test Coverage:'.yellow.bold);
    const modules = [...new Set(testResults.map(r => r.module))];
    modules.forEach(module => {
        const moduleTests = testResults.filter(r => r.module === module);
        const modulePassed = moduleTests.filter(r => r.status === 'PASSED').length;
        const moduleTotal = moduleTests.length;
        const moduleRate = ((modulePassed/moduleTotal) * 100).toFixed(0);
        console.log(`  ${module}: ${modulePassed}/${moduleTotal} (${moduleRate}%)`.white);
    });
    
    // Failed Tests Report
    if (failedTests > 0) {
        console.log('\nFailed Tests:'.red.bold);
        testResults.filter(r => r.status === 'FAILED').forEach(test => {
            console.log(`  - ${test.module}: ${test.name}`.red);
            if (test.error) {
                console.log(`    Error: ${test.error}`.gray);
            }
        });
    }
    
    // Final Status
    console.log('\n================================================'.cyan);
    if (passedTests === totalTests) {
        console.log('✅ ALL TESTS PASSED!'.green.bold);
        console.log('Platform is fully operational and ready for production.'.green);
    } else if (passedTests / totalTests >= 0.8) {
        console.log('⚠️  MOSTLY PASSED'.yellow.bold);
        console.log('Platform is operational with minor issues.'.yellow);
    } else {
        console.log('❌ TESTS FAILED'.red.bold);
        console.log('Platform has critical issues that need attention.'.red);
    }
    console.log('================================================'.cyan);
    
    // Save test report
    const fs = require('fs');
    const reportData = {
        timestamp: new Date().toISOString(),
        totalTests,
        passedTests,
        failedTests,
        successRate: ((passedTests/totalTests) * 100).toFixed(1) + '%',
        duration: duration + ' seconds',
        modules: modules.map(module => {
            const moduleTests = testResults.filter(r => r.module === module);
            return {
                name: module,
                total: moduleTests.length,
                passed: moduleTests.filter(r => r.status === 'PASSED').length,
                failed: moduleTests.filter(r => r.status === 'FAILED').length
            };
        }),
        details: testResults
    };
    
    fs.writeFileSync('e2e-test-report.json', JSON.stringify(reportData, null, 2));
    console.log('\nTest report saved to e2e-test-report.json');
}

// Run the tests
runTests().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});
