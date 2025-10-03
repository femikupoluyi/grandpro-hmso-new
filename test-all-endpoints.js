#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Test endpoints
const endpoints = [
    // Public endpoints
    { method: 'GET', path: '/', description: 'Frontend Homepage', expectStatus: 200, expectContent: 'html' },
    { method: 'GET', path: '/health', description: 'Backend Health Check', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/hospitals', description: 'List Hospitals', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/crm/owners', description: 'List Owners', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/crm/patients', description: 'List Patients', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/onboarding/applications', description: 'List Applications', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/operations/metrics', description: 'Operations Metrics', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/analytics/dashboard', description: 'Analytics Dashboard', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/inventory', description: 'Inventory List', expectStatus: 200, expectContent: 'json' },
    { method: 'GET', path: '/api/billing/invoices', description: 'Billing Invoices', expectStatus: 200, expectContent: 'json' },
    
    // Auth endpoints (should return proper errors)
    { method: 'POST', path: '/api/auth/login', description: 'Login Endpoint', expectStatus: 400, expectContent: 'json', body: {} },
    { method: 'POST', path: '/api/auth/register', description: 'Register Endpoint', expectStatus: 400, expectContent: 'json', body: {} },
    
    // Frontend routes
    { method: 'GET', path: '/login', description: 'Login Page', expectStatus: 200, expectContent: 'html' },
    { method: 'GET', path: '/dashboard', description: 'Dashboard Page', expectStatus: 200, expectContent: 'html' },
    { method: 'GET', path: '/onboarding', description: 'Onboarding Page', expectStatus: 200, expectContent: 'html' },
    { method: 'GET', path: '/crm', description: 'CRM Page', expectStatus: 200, expectContent: 'html' },
    { method: 'GET', path: '/operations', description: 'Operations Page', expectStatus: 200, expectContent: 'html' },
];

// Test function
async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(BASE_URL + endpoint.path);
        const options = {
            method: endpoint.method,
            headers: {
                'User-Agent': 'GrandPro-Test-Client',
                'Accept': endpoint.expectContent === 'json' ? 'application/json' : '*/*'
            }
        };

        if (endpoint.body) {
            options.headers['Content-Type'] = 'application/json';
        }

        const protocol = url.protocol === 'https:' ? https : http;
        
        const req = protocol.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const success = res.statusCode === endpoint.expectStatus;
                const contentType = res.headers['content-type'] || '';
                const isExpectedContent = 
                    (endpoint.expectContent === 'json' && contentType.includes('application/json')) ||
                    (endpoint.expectContent === 'html' && contentType.includes('text/html')) ||
                    endpoint.expectContent === 'any';
                
                resolve({
                    endpoint: endpoint.path,
                    method: endpoint.method,
                    description: endpoint.description,
                    status: res.statusCode,
                    expectedStatus: endpoint.expectStatus,
                    contentType: contentType.split(';')[0],
                    success: success && isExpectedContent,
                    responseSize: data.length,
                    data: data.substring(0, 200) // First 200 chars
                });
            });
        });
        
        req.on('error', (error) => {
            resolve({
                endpoint: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                success: false,
                error: error.message
            });
        });

        if (endpoint.body) {
            req.write(JSON.stringify(endpoint.body));
        }
        
        req.end();
    });
}

// Main test runner
async function runTests() {
    console.log(`${colors.bold}${colors.blue}=====================================`);
    console.log(`  GrandPro HMSO Public URL Testing`);
    console.log(`  Target: ${BASE_URL}`);
    console.log(`  Time: ${new Date().toISOString()}`);
    console.log(`=====================================${colors.reset}\n`);

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        if (result.success) {
            console.log(`${colors.green}✓${colors.reset} ${result.method.padEnd(6)} ${result.endpoint.padEnd(35)} [${result.status}] ${colors.green}${result.description}${colors.reset}`);
            console.log(`  Content-Type: ${result.contentType}, Size: ${result.responseSize} bytes`);
            passed++;
        } else if (result.error) {
            console.log(`${colors.red}✗${colors.reset} ${result.method.padEnd(6)} ${result.endpoint.padEnd(35)} ${colors.red}ERROR: ${result.error}${colors.reset}`);
            failed++;
        } else {
            console.log(`${colors.yellow}⚠${colors.reset} ${result.method.padEnd(6)} ${result.endpoint.padEnd(35)} [${result.status}/${result.expectedStatus}] ${colors.yellow}${result.description}${colors.reset}`);
            console.log(`  Content-Type: ${result.contentType}`);
            if (result.data) {
                console.log(`  Response: ${result.data.substring(0, 100)}...`);
            }
            failed++;
        }
        console.log();
    }

    // Summary
    console.log(`${colors.bold}${colors.blue}=====================================`);
    console.log(`  Test Results Summary`);
    console.log(`=====================================${colors.reset}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Total: ${endpoints.length}`);
    console.log(`Success Rate: ${((passed / endpoints.length) * 100).toFixed(1)}%`);
    
    // Functional URLs
    console.log(`\n${colors.bold}${colors.blue}Functional Public URLs:${colors.reset}`);
    console.log(`${colors.green}Frontend:${colors.reset} ${BASE_URL}/`);
    console.log(`${colors.green}API Health:${colors.reset} ${BASE_URL}/health`);
    console.log(`${colors.green}API Base:${colors.reset} ${BASE_URL}/api/`);
    
    const functionalEndpoints = results.filter(r => r.success && r.method === 'GET');
    if (functionalEndpoints.length > 0) {
        console.log(`\n${colors.bold}Working GET Endpoints:${colors.reset}`);
        functionalEndpoints.forEach(ep => {
            console.log(`  - ${BASE_URL}${ep.endpoint} (${ep.description})`);
        });
    }

    return { passed, failed, total: endpoints.length };
}

// Run tests
runTests().then((summary) => {
    console.log(`\n${colors.bold}Test execution completed.${colors.reset}`);
    process.exit(summary.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error(`${colors.red}Test execution failed: ${error.message}${colors.reset}`);
    process.exit(1);
});
