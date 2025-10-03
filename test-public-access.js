#!/usr/bin/env node

const axios = require('axios');

// Public URLs
const FRONTEND_URL = 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so';
const BACKEND_URL_5001 = 'https://backend-morphvm-wz7xxc7v.http.cloud.morph.so';
const COMBINED_URL_9000 = 'https://grandpro-combined-morphvm-wz7xxc7v.http.cloud.morph.so';

async function testUrl(name, url) {
  try {
    const response = await axios.get(url, {
      validateStatus: () => true,
      timeout: 5000
    });
    const status = response.status < 400 ? '✅' : response.status < 500 ? '⚠️' : '❌';
    console.log(`${status} ${name}: ${url} (${response.status})`);
    return response.status < 400;
  } catch (error) {
    console.log(`❌ ${name}: ${url} (${error.message})`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Testing Public URL Access\n' + '='.repeat(60));
  
  let working = 0;
  let total = 0;

  // Test main frontend URL
  console.log('\n📱 Frontend URLs:');
  if (await testUrl('Frontend Home', FRONTEND_URL)) working++;
  total++;
  
  if (await testUrl('Frontend Login', `${FRONTEND_URL}/login`)) working++;
  total++;
  
  if (await testUrl('Frontend Dashboard', `${FRONTEND_URL}/dashboard`)) working++;
  total++;
  
  // Test health endpoints
  console.log('\n💚 Health Endpoints:');
  if (await testUrl('Health (via frontend)', `${FRONTEND_URL}/health`)) working++;
  total++;
  
  if (await testUrl('Health (via backend 5001)', `${BACKEND_URL_5001}/health`)) working++;
  total++;
  
  if (await testUrl('Health (via combined 9000)', `${COMBINED_URL_9000}/health`)) working++;
  total++;
  
  // Test API endpoints via different URLs
  console.log('\n🔌 API Endpoints:');
  if (await testUrl('API Health (frontend)', `${FRONTEND_URL}/api/health`)) working++;
  total++;
  
  if (await testUrl('API Auth (frontend)', `${FRONTEND_URL}/api/auth/test`)) working++;
  total++;
  
  if (await testUrl('API Onboarding (frontend)', `${FRONTEND_URL}/api/onboarding/test`)) working++;
  total++;
  
  // Test backend direct
  if (await testUrl('Backend Direct', `${BACKEND_URL_5001}/api/health`)) working++;
  total++;
  
  // Test combined URL
  if (await testUrl('Combined API', `${COMBINED_URL_9000}/api/health`)) working++;
  total++;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  const percentage = ((working / total) * 100).toFixed(1);
  const status = working === total ? '✅' : working > total * 0.5 ? '⚠️' : '❌';
  console.log(`${status} Summary: ${working}/${total} URLs working (${percentage}%)`);
  console.log('='.repeat(60) + '\n');
  
  // Now test local services to compare
  console.log('📍 Local Service Check:');
  
  try {
    const localBackend = await axios.get('http://localhost:5001/health');
    console.log(`✅ Backend running on localhost:5001`);
  } catch (e) {
    console.log(`❌ Backend not accessible on localhost:5001`);
  }
  
  try {
    const localFrontend = await axios.get('http://localhost:3001');
    console.log(`✅ Frontend running on localhost:3001`);
  } catch (e) {
    console.log(`❌ Frontend not accessible on localhost:3001`);
  }
  
  try {
    const localNginx = await axios.get('http://localhost:9000/health');
    console.log(`✅ Nginx proxy running on localhost:9000`);
  } catch (e) {
    console.log(`❌ Nginx proxy not accessible on localhost:9000`);
  }
  
  // Show correct URLs
  console.log('\n📌 Correct Public URLs to use:');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend Health: ${FRONTEND_URL}/health`);
  console.log(`Backend API: ${FRONTEND_URL}/api/*`);
  
  return working === total;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
