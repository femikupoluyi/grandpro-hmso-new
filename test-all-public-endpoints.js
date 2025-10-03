#!/usr/bin/env node

/**
 * Comprehensive test for all GrandPro HMSO public endpoints
 * Tests both local and public URLs to ensure complete functionality
 */

const https = require('https');
const http = require('http');

const PUBLIC_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';
const LOCAL_URL = 'http://localhost:9000';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// All endpoints organized by module
const endpoints = {
    'Core Health & Status': [
        { method: 'GET', path: '/health', description: 'System health check' }
    ],
    
    'Digital Sourcing & Partner Onboarding': [
        { method: 'GET', path: '/api/hospital/applications', description: 'List hospital applications' },
        { method: 'GET', path: '/api/hospital/contracts', description: 'List contracts' },
        { method: 'GET', path: '/api/hospital/onboarding/status', description: 'Onboarding status' }
    ],
    
    'CRM & Relationship Management': [
        { method: 'GET', path: '/api/crm/owners', description: 'Owner CRM data' },
        { method: 'GET', path: '/api/crm/patients', description: 'Patient CRM data' },
        { method: 'GET', path: '/api/crm/communications/campaigns', description: 'Communication campaigns' },
        { method: 'GET', path: '/api/crm/patients/appointments', description: 'Patient appointments' },
        { method: 'GET', path: '/api/crm/patients/loyalty', description: 'Loyalty programs' }
    ],
    
    'Hospital Management (Core Operations)': [
        { method: 'GET', path: '/api/hospital-management/emr/patients', description: 'Electronic medical records' },
        { method: 'GET', path: '/api/hospital-management/billing/invoices', description: 'Billing and revenue' },
        { method: 'GET', path: '/api/hospital-management/inventory', description: 'Inventory management' },
        { method: 'GET', path: '/api/hospital-management/hr/staff', description: 'HR and rostering' },
        { method: 'GET', path: '/api/hospital-management/analytics/dashboard', description: 'Real-time analytics' }
    ],
    
    'Centralized Operations & Development': [
        { method: 'GET', path: '/api/operations/command-center/metrics', description: 'Command center metrics' },
        { method: 'GET', path: '/api/operations/alerts', description: 'System alerts' },
        { method: 'GET', path: '/api/operations/projects', description: 'Project management' },
        { method: 'GET', path: '/api/operations/kpis', description: 'KPI tracking' }
    ]
};

// Test function for a single endpoint
async function testEndpoint(url, endpoint) {
    return new Promise((resolve) => {
        const fullUrl = `${url}${endpoint.path}`;
        const protocol = url.startsWith('https') ? https : http;
        
        const startTime = Date.now();
        
        const req = protocol.get(fullUrl, (res) => {
            const responseTime = Date.now() - startTime;
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode >= 200 && res.statusCode < 400;
                
                // Try to parse response
                let responseData = null;
                try {
                    responseData = JSON.parse(data);
                } catch (e) {
                    responseData = data.substring(0, 100);
                }
                
                resolve({
                    endpoint: endpoint.path,
                    method: endpoint.method,
                    description: endpoint.description,
                    statusCode: res.statusCode,
                    success,
                    responseTime,
                    responseData
                });
            });
        });
        
        req.on('error', (err) => {
            resolve({
                endpoint: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                statusCode: 0,
                success: false,
                error: err.message,
                responseTime: Date.now() - startTime
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                endpoint: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                statusCode: 0,
                success: false,
                error: 'Timeout',
                responseTime: 10000
            });
        });
    });
}

// Main test function
async function runTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}       GrandPro HMSO - Comprehensive Endpoint Testing Suite         ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.yellow}Testing Public URL: ${PUBLIC_URL}${colors.reset}\n`);
    
    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;
    const moduleResults = {};
    
    // Test each module
    for (const [moduleName, moduleEndpoints] of Object.entries(endpoints)) {
        console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.blue}Module: ${moduleName}${colors.reset}`);
        console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        
        const moduleStats = {
            total: 0,
            successful: 0,
            failed: 0,
            endpoints: []
        };
        
        for (const endpoint of moduleEndpoints) {
            totalTests++;
            moduleStats.total++;
            
            process.stdout.write(`Testing ${endpoint.method} ${endpoint.path}... `);
            
            const result = await testEndpoint(PUBLIC_URL, endpoint);
            moduleStats.endpoints.push(result);
            
            if (result.success) {
                successfulTests++;
                moduleStats.successful++;
                console.log(`${colors.green}✓ SUCCESS${colors.reset} (${result.statusCode}) - ${result.responseTime}ms`);
                if (result.description) {
                    console.log(`  └─ ${colors.cyan}${result.description}${colors.reset}`);
                }
            } else {
                failedTests++;
                moduleStats.failed++;
                console.log(`${colors.red}✗ FAILED${colors.reset} (${result.statusCode || 'ERROR'}) - ${result.error || 'Unknown error'}`);
                if (result.description) {
                    console.log(`  └─ ${colors.cyan}${result.description}${colors.reset}`);
                }
            }
        }
        
        moduleResults[moduleName] = moduleStats;
        
        // Module summary
        console.log(`\n${colors.magenta}Module Summary: ${moduleStats.successful}/${moduleStats.total} tests passed${colors.reset}`);
    }
    
    // Overall summary
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                        TEST RESULTS SUMMARY                        ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    // Module breakdown
    console.log(`${colors.yellow}Module Breakdown:${colors.reset}`);
    for (const [moduleName, stats] of Object.entries(moduleResults)) {
        const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
        const statusColor = stats.successful === stats.total ? colors.green : 
                           stats.successful > 0 ? colors.yellow : colors.red;
        console.log(`  ${moduleName}: ${statusColor}${stats.successful}/${stats.total} (${successRate}%)${colors.reset}`);
    }
    
    // Overall statistics
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
    console.log(`\n${colors.yellow}Overall Statistics:${colors.reset}`);
    console.log(`  Total Endpoints Tested: ${totalTests}`);
    console.log(`  ${colors.green}Successful: ${successfulTests}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`  Success Rate: ${successRate >= 80 ? colors.green : successRate >= 50 ? colors.yellow : colors.red}${successRate}%${colors.reset}`);
    
    // Public URL status
    console.log(`\n${colors.yellow}Public Access:${colors.reset}`);
    console.log(`  URL: ${colors.cyan}${PUBLIC_URL}${colors.reset}`);
    console.log(`  Status: ${successfulTests > 0 ? `${colors.green}✓ ACCESSIBLE${colors.reset}` : `${colors.red}✗ NOT ACCESSIBLE${colors.reset}`}`);
    
    // Platform readiness
    const isReady = successRate >= 80;
    console.log(`\n${colors.yellow}Platform Status:${colors.reset}`);
    console.log(`  ${isReady ? `${colors.green}✓ PRODUCTION READY${colors.reset}` : `${colors.red}✗ NEEDS ATTENTION${colors.reset}`}`);
    
    // Recommendations
    if (failedTests > 0) {
        console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
        console.log(`  - Review failed endpoints and ensure backend services are running`);
        console.log(`  - Check database connections and migrations`);
        console.log(`  - Verify authentication and authorization middleware`);
        console.log(`  - Check nginx proxy configuration for routing issues`);
    }
    
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    // Return test results for further processing
    return {
        totalTests,
        successfulTests,
        failedTests,
        successRate: parseFloat(successRate),
        moduleResults
    };
}

// Execute tests
if (require.main === module) {
    runTests()
        .then(results => {
            process.exit(results.failedTests > 0 ? 1 : 0);
        })
        .catch(err => {
            console.error(`${colors.red}Test execution failed: ${err.message}${colors.reset}`);
            process.exit(1);
        });
}

module.exports = { runTests, testEndpoint };
