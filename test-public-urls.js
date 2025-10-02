#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';
const BACKEND_URL = BASE_URL;  // Backend is at /api and /health
const FRONTEND_URL = BASE_URL;  // Frontend is at root /

// Color coding for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}\n${colors.blue}${msg}${colors.reset}\n${colors.blue}${'='.repeat(60)}${colors.reset}`)
};

// Test endpoints
const testEndpoints = [
  // Backend Health & Basic Endpoints
  { name: 'Backend Health', url: `${BACKEND_URL}/health`, method: 'GET' },
  { name: 'Backend Root', url: `${BACKEND_URL}/`, method: 'GET' },
  
  // Authentication
  { name: 'Auth Login', url: `${BACKEND_URL}/api/auth/login`, method: 'POST', 
    data: { email: 'admin@grandpro.ng', password: 'admin123' } },
  
  // Hospital Management
  { name: 'Hospitals List', url: `${BACKEND_URL}/api/hospitals`, method: 'GET' },
  
  // Applications
  { name: 'Applications List', url: `${BACKEND_URL}/api/applications`, method: 'GET' },
  
  // Dashboard
  { name: 'Dashboard Stats', url: `${BACKEND_URL}/api/dashboard`, method: 'GET' },
  
  // CRM Endpoints
  { name: 'CRM Owners', url: `${BACKEND_URL}/api/crm/owners`, method: 'GET' },
  { name: 'CRM Patients', url: `${BACKEND_URL}/api/crm/patients`, method: 'GET' },
  
  // Operations Command Centre
  { name: 'Operations Dashboard', url: `${BACKEND_URL}/api/operations/dashboard`, method: 'GET' },
  
  // Partner Integration
  { name: 'Insurance Providers', url: `${BACKEND_URL}/api/insurance/providers`, method: 'GET' },
  
  // Data Analytics
  { name: 'Analytics Dashboard', url: `${BACKEND_URL}/api/data-analytics/dashboard`, method: 'GET' },
  
  // Audit
  { name: 'Audit Logs', url: `${BACKEND_URL}/api/audit/logs`, method: 'GET' },
  
  // Frontend
  { name: 'Frontend Homepage', url: `${FRONTEND_URL}/`, method: 'GET', html: true }
];

// Test function
async function testEndpoint(endpoint) {
  try {
    const config = {
      method: endpoint.method,
      url: endpoint.url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': endpoint.html ? 'text/html' : 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status code
    };
    
    if (endpoint.data) {
      config.data = endpoint.data;
    }
    
    const response = await axios(config);
    
    // Check response
    if (response.status >= 200 && response.status < 300) {
      log.success(`${endpoint.name}: ${response.status} OK`);
      
      // Show sample data for successful responses
      if (!endpoint.html && response.data) {
        const preview = JSON.stringify(response.data).substring(0, 100);
        console.log(`   Response: ${preview}${preview.length >= 100 ? '...' : ''}`);
      }
      return { success: true, status: response.status };
    } else if (response.status === 401 || response.status === 403) {
      log.info(`${endpoint.name}: ${response.status} (Authentication required)`);
      return { success: true, status: response.status, auth: true };
    } else if (response.status === 404) {
      log.error(`${endpoint.name}: ${response.status} Not Found`);
      return { success: false, status: response.status };
    } else {
      log.error(`${endpoint.name}: ${response.status} ${response.statusText}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    log.error(`${endpoint.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  log.header('GrandPro HMSO Public URL Testing');
  
  console.log(`\nBackend URL: ${colors.yellow}${BACKEND_URL}${colors.reset}`);
  console.log(`Frontend URL: ${colors.yellow}${FRONTEND_URL}${colors.reset}\n`);
  
  let results = {
    total: testEndpoints.length,
    successful: 0,
    failed: 0,
    authRequired: 0
  };
  
  // Test each endpoint
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      results.successful++;
      if (result.auth) results.authRequired++;
    } else {
      results.failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  log.header('Test Summary');
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Successful: ${results.successful}${colors.reset}`);
  console.log(`${colors.yellow}Auth Required: ${results.authRequired}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  const successRate = ((results.successful / results.total) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate >= 70 ? colors.green : colors.red}${successRate}%${colors.reset}`);
  
  // URLs for testing
  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
  console.log(`${colors.cyan}Public URLs for Testing:${colors.reset}`);
  console.log(`${colors.yellow}Frontend:${colors.reset} ${FRONTEND_URL}`);
  console.log(`${colors.yellow}Backend API:${colors.reset} ${BACKEND_URL}`);
  console.log(`${colors.yellow}Health Check:${colors.reset} ${BACKEND_URL}/health`);
  console.log(`${colors.yellow}API Documentation:${colors.reset} ${BACKEND_URL}/`);
}

// Run tests
runTests().catch(console.error);
