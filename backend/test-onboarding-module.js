const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5001/api';

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

async function testOnboardingModule() {
    console.log(`${colors.bold}${colors.blue}========================================`);
    console.log(`  Digital Sourcing & Onboarding Module Test`);
    console.log(`========================================${colors.reset}\n`);

    let applicationId = null;
    let contractId = null;
    let passedTests = 0;
    let failedTests = 0;

    // Test 1: Hospital Owner Registration
    console.log(`${colors.bold}Test 1: Hospital Owner Registration${colors.reset}`);
    try {
        const registrationData = {
            hospital_name: 'Lagos Premier Hospital',
            hospital_type: 'Private',
            bed_capacity: 75,
            owner_first_name: 'Adebayo',
            owner_last_name: 'Ogunwale',
            owner_email: 'adebayo.ogunwale@lagospremier.ng',
            owner_phone: '+2348012345678',
            owner_nin: '12345678901',
            hospital_address: '123 Victoria Island',
            hospital_city: 'Lagos',
            hospital_state: 'Lagos',
            hospital_lga: 'Eti-Osa',
            cac_registration_number: 'RC-123456',
            tax_identification_number: 'TIN-987654',
            nhis_number: 'NHIS-456789',
            years_in_operation: 5,
            number_of_staff: 45,
            specialties: ['General Medicine', 'Surgery', 'Pediatrics'],
            has_emergency_unit: true,
            has_laboratory: true,
            has_pharmacy: true,
            has_radiology: true
        };

        const response = await axios.post(`${API_BASE_URL}/onboarding/register`, registrationData);
        
        if (response.data.success) {
            applicationId = response.data.data.id;
            console.log(`${colors.green}✓ Registration successful${colors.reset}`);
            console.log(`  Application ID: ${applicationId}`);
            console.log(`  Application Number: ${response.data.data.application_number}`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗ Registration failed${colors.reset}`);
            failedTests++;
        }
    } catch (error) {
        console.log(`${colors.red}✗ Registration error: ${error.response?.data?.message || error.message}${colors.reset}`);
        failedTests++;
    }

    // Test 2: Get Document Types
    console.log(`\n${colors.bold}Test 2: Get Document Types${colors.reset}`);
    try {
        const response = await axios.get(`${API_BASE_URL}/onboarding/document-types`);
        
        if (response.data.success && response.data.data.length > 0) {
            console.log(`${colors.green}✓ Retrieved ${response.data.data.length} document types${colors.reset}`);
            console.log(`  Required documents: ${response.data.data.filter(d => d.is_required).length}`);
            console.log(`  Optional documents: ${response.data.data.filter(d => !d.is_required).length}`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗ Failed to retrieve document types${colors.reset}`);
            failedTests++;
        }
    } catch (error) {
        console.log(`${colors.red}✗ Document types error: ${error.message}${colors.reset}`);
        failedTests++;
    }

    // Test 3: Document Upload (simulated)
    console.log(`\n${colors.bold}Test 3: Document Upload${colors.reset}`);
    if (applicationId) {
        try {
            // Create a test file
            const testFilePath = path.join(__dirname, 'test-document.pdf');
            fs.writeFileSync(testFilePath, 'This is a test document for hospital onboarding.');
            
            const form = new FormData();
            form.append('document', fs.createReadStream(testFilePath));
            form.append('document_type_id', '1');
            form.append('document_name', 'CAC Certificate');

            const response = await axios.post(
                `${API_BASE_URL}/onboarding/applications/${applicationId}/documents`,
                form,
                {
                    headers: form.getHeaders()
                }
            );
            
            if (response.data.success) {
                console.log(`${colors.green}✓ Document uploaded successfully${colors.reset}`);
                console.log(`  Document ID: ${response.data.data.id}`);
                console.log(`  File size: ${response.data.data.file_size} bytes`);
                passedTests++;
            } else {
                console.log(`${colors.red}✗ Document upload failed${colors.reset}`);
                failedTests++;
            }
            
            // Clean up test file
            fs.unlinkSync(testFilePath);
        } catch (error) {
            console.log(`${colors.red}✗ Document upload error: ${error.response?.data?.message || error.message}${colors.reset}`);
            failedTests++;
        }
    } else {
        console.log(`${colors.yellow}⚠ Skipped: No application ID${colors.reset}`);
    }

    // Test 4: Automated Evaluation Scoring
    console.log(`\n${colors.bold}Test 4: Automated Evaluation Scoring${colors.reset}`);
    if (applicationId) {
        try {
            const response = await axios.post(`${API_BASE_URL}/onboarding/applications/${applicationId}/evaluate`);
            
            if (response.data.success) {
                console.log(`${colors.green}✓ Evaluation completed${colors.reset}`);
                console.log(`  Total Score: ${response.data.data.totalScore}%`);
                console.log(`  Risk Rating: ${response.data.data.riskRating}`);
                console.log(`  Criteria Evaluated: ${response.data.data.scores.length}`);
                passedTests++;
            } else {
                console.log(`${colors.red}✗ Evaluation failed${colors.reset}`);
                failedTests++;
            }
        } catch (error) {
            console.log(`${colors.red}✗ Evaluation error: ${error.response?.data?.message || error.message}${colors.reset}`);
            failedTests++;
        }
    } else {
        console.log(`${colors.yellow}⚠ Skipped: No application ID${colors.reset}`);
    }

    // Test 5: Contract Generation
    console.log(`\n${colors.bold}Test 5: Contract Generation${colors.reset}`);
    if (applicationId) {
        try {
            const response = await axios.post(`${API_BASE_URL}/onboarding/applications/${applicationId}/generate-contract`, {
                template_id: 1
            });
            
            if (response.data.success) {
                contractId = response.data.data.id;
                console.log(`${colors.green}✓ Contract generated${colors.reset}`);
                console.log(`  Contract ID: ${contractId}`);
                console.log(`  Contract Number: ${response.data.data.contract_number}`);
                console.log(`  Duration: ${response.data.data.end_date ? 'Set' : 'Not set'}`);
                passedTests++;
            } else {
                console.log(`${colors.red}✗ Contract generation failed${colors.reset}`);
                failedTests++;
            }
        } catch (error) {
            console.log(`${colors.red}✗ Contract generation error: ${error.response?.data?.message || error.message}${colors.reset}`);
            failedTests++;
        }
    } else {
        console.log(`${colors.yellow}⚠ Skipped: No application ID${colors.reset}`);
    }

    // Test 6: Digital Signature
    console.log(`\n${colors.bold}Test 6: Digital Signature${colors.reset}`);
    if (contractId) {
        try {
            const signatureData = {
                signatory_name: 'Adebayo Ogunwale',
                signatory_email: 'adebayo.ogunwale@lagospremier.ng',
                signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                signatory_role: 'owner'
            };

            const response = await axios.post(
                `${API_BASE_URL}/onboarding/contracts/${contractId}/sign`,
                signatureData
            );
            
            if (response.data.success) {
                console.log(`${colors.green}✓ Contract signed successfully${colors.reset}`);
                console.log(`  Signature ID: ${response.data.data.id}`);
                console.log(`  Signature Hash: ${response.data.data.signature_hash?.substring(0, 16)}...`);
                passedTests++;
            } else {
                console.log(`${colors.red}✗ Signature failed${colors.reset}`);
                failedTests++;
            }
        } catch (error) {
            console.log(`${colors.red}✗ Signature error: ${error.response?.data?.message || error.message}${colors.reset}`);
            failedTests++;
        }
    } else {
        console.log(`${colors.yellow}⚠ Skipped: No contract ID${colors.reset}`);
    }

    // Test 7: Get Onboarding Status
    console.log(`\n${colors.bold}Test 7: Get Onboarding Status${colors.reset}`);
    if (applicationId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/onboarding/applications/${applicationId}/status`);
            
            if (response.data.success) {
                console.log(`${colors.green}✓ Status retrieved${colors.reset}`);
                console.log(`  Current Status: ${response.data.data.status}`);
                console.log(`  Total Score: ${response.data.data.total_score}`);
                console.log(`  Document Count: ${response.data.data.document_count}`);
                console.log(`  Evaluation Count: ${response.data.data.evaluation_count}`);
                passedTests++;
            } else {
                console.log(`${colors.red}✗ Status retrieval failed${colors.reset}`);
                failedTests++;
            }
        } catch (error) {
            console.log(`${colors.red}✗ Status error: ${error.response?.data?.message || error.message}${colors.reset}`);
            failedTests++;
        }
    } else {
        console.log(`${colors.yellow}⚠ Skipped: No application ID${colors.reset}`);
    }

    // Test 8: List Applications
    console.log(`\n${colors.bold}Test 8: List Applications${colors.reset}`);
    try {
        const response = await axios.get(`${API_BASE_URL}/onboarding/applications`);
        
        if (response.data.success) {
            console.log(`${colors.green}✓ Applications listed${colors.reset}`);
            console.log(`  Total Applications: ${response.data.pagination.total}`);
            console.log(`  Current Page: ${response.data.pagination.page}/${response.data.pagination.pages}`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗ Failed to list applications${colors.reset}`);
            failedTests++;
        }
    } catch (error) {
        console.log(`${colors.red}✗ List applications error: ${error.message}${colors.reset}`);
        failedTests++;
    }

    // Summary
    console.log(`\n${colors.bold}${colors.blue}========================================`);
    console.log(`  Test Summary`);
    console.log(`========================================${colors.reset}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`Total: ${passedTests + failedTests}`);
    console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

    if (passedTests === 8) {
        console.log(`\n${colors.green}${colors.bold}✅ All tests passed! Onboarding module is fully functional.${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}⚠ Some tests failed. Please check the implementation.${colors.reset}`);
    }
}

// Run tests
testOnboardingModule().catch(console.error);
