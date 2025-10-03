const fs = require('fs');
const path = require('path');

console.log('🔍 FRONTEND VERIFICATION REPORT');
console.log('='.repeat(50));

const checks = {
  viteConfig: false,
  routing: false,
  sharedComponents: false,
  envVariables: false,
  apiConfig: false,
  theme: false,
  build: false
};

// 1. Check Vite configuration
console.log('\n1. VITE CONFIGURATION');
console.log('-'.repeat(30));
if (fs.existsSync('vite.config.js')) {
  console.log('✅ vite.config.js exists');
  checks.viteConfig = true;
} else {
  console.log('❌ vite.config.js not found');
}

// 2. Check routing setup
console.log('\n2. ROUTING SETUP');
console.log('-'.repeat(30));
const routerFiles = [
  'src/router/routes.jsx',
  'src/App.jsx',
  'src/components/ProtectedRoute.jsx',
  'src/main.jsx'
];

let routingOk = true;
routerFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} not found`);
    routingOk = false;
  }
});
checks.routing = routingOk;

// Check if BrowserRouter is used
const mainContent = fs.readFileSync('src/main.jsx', 'utf8');
if (mainContent.includes('BrowserRouter')) {
  console.log('✅ BrowserRouter configured');
} else {
  console.log('⚠️  BrowserRouter not found in main.jsx');
}

// 3. Check shared component library
console.log('\n3. SHARED COMPONENT LIBRARY');
console.log('-'.repeat(30));
const sharedComponents = [
  'src/components/shared/index.js',
  'src/components/shared/Button.jsx',
  'src/components/shared/Card.jsx',
  'src/components/shared/LoadingState.jsx',
  'src/components/shared/EmptyState.jsx',
  'src/components/shared/ErrorBoundary.jsx',
  'src/components/shared/NigerianCurrencyDisplay.jsx',
  'src/components/shared/NigerianStateSelect.jsx'
];

let componentsOk = true;
let componentCount = 0;
sharedComponents.forEach(file => {
  if (fs.existsSync(file)) {
    componentCount++;
  } else {
    componentsOk = false;
  }
});
console.log(`✅ ${componentCount}/${sharedComponents.length} shared components created`);
checks.sharedComponents = componentCount > 0;

// 4. Check environment variables
console.log('\n4. ENVIRONMENT VARIABLES');
console.log('-'.repeat(30));
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'VITE_API_URL',
    'VITE_APP_NAME',
    'VITE_TIMEZONE',
    'VITE_CURRENCY',
    'VITE_COUNTRY'
  ];
  
  let envOk = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} configured`);
    } else {
      console.log(`❌ ${varName} missing`);
      envOk = false;
    }
  });
  checks.envVariables = envOk;
} else {
  console.log('❌ .env file not found');
}

// 5. Check API configuration
console.log('\n5. API CONFIGURATION');
console.log('-'.repeat(30));
if (fs.existsSync('src/services/api.config.js')) {
  console.log('✅ api.config.js exists');
  const apiConfig = fs.readFileSync('src/services/api.config.js', 'utf8');
  if (apiConfig.includes('import.meta.env.VITE_API_URL')) {
    console.log('✅ Uses environment variables for API URL');
    checks.apiConfig = true;
  } else {
    console.log('⚠️  Not using environment variables for API URL');
  }
} else {
  console.log('❌ api.config.js not found');
}

// 6. Check theme configuration
console.log('\n6. THEME CONFIGURATION');
console.log('-'.repeat(30));
if (fs.existsSync('src/theme/index.js')) {
  console.log('✅ Theme configuration exists');
  const themeContent = fs.readFileSync('src/theme/index.js', 'utf8');
  if (themeContent.includes('Nigerian') || themeContent.includes('NGN')) {
    console.log('✅ Nigerian localization in theme');
    checks.theme = true;
  }
} else {
  console.log('❌ Theme configuration not found');
}

// 7. Check build output
console.log('\n7. BUILD OUTPUT');
console.log('-'.repeat(30));
if (fs.existsSync('dist/index.html')) {
  console.log('✅ Build output exists (dist/index.html)');
  const distFiles = fs.readdirSync('dist/assets');
  console.log(`✅ ${distFiles.length} asset files generated`);
  checks.build = true;
} else {
  console.log('⚠️  No build output found (run npm run build)');
}

// 8. Check dependencies
console.log('\n8. DEPENDENCIES');
console.log('-'.repeat(30));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const keyDeps = [
  'react',
  'react-router-dom',
  'vite',
  '@mui/material',
  'axios',
  'react-toastify'
];

keyDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep}: not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log(`Vite Config:         ${checks.viteConfig ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Routing:             ${checks.routing ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Shared Components:   ${checks.sharedComponents ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Environment Vars:    ${checks.envVariables ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`API Config:          ${checks.apiConfig ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Theme:               ${checks.theme ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Build:               ${checks.build ? '✅ PASSED' : '❌ FAILED'}`);

const allPassed = Object.values(checks).every(v => v);
console.log('\n' + (allPassed ? '✅ ALL VERIFICATIONS PASSED!' : '⚠️  SOME VERIFICATIONS NEED ATTENTION'));

// Additional info
console.log('\n📊 PROJECT STATS');
console.log('-'.repeat(30));
const srcFiles = fs.readdirSync('src', { withFileTypes: true });
const pageCount = fs.existsSync('src/pages') ? fs.readdirSync('src/pages').length : 0;
const componentCount2 = fs.existsSync('src/components') ? fs.readdirSync('src/components').length : 0;
console.log(`Pages: ${pageCount}`);
console.log(`Components: ${componentCount2}`);
console.log(`Services: ${fs.existsSync('src/services') ? fs.readdirSync('src/services').length : 0}`);

process.exit(allPassed ? 0 : 1);
