const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyBackend() {
    console.log('🔍 BACKEND VERIFICATION REPORT');
    console.log('=' . repeat(50));
    
    const results = {
        build: false,
        database: false,
        migrations: false,
        api: false,
        tables: 0
    };

    // 1. Verify Build (Dependencies)
    console.log('\n1. BUILD VERIFICATION');
    console.log('-'.repeat(30));
    try {
        const packageJson = require('./package.json');
        const deps = Object.keys(packageJson.dependencies || {});
        console.log(`✅ Package.json found`);
        console.log(`✅ ${deps.length} dependencies defined`);
        
        // Check if key dependencies are installed
        const keyDeps = ['express', 'pg', 'dotenv', 'cors', 'jsonwebtoken'];
        let allInstalled = true;
        for (const dep of keyDeps) {
            try {
                require.resolve(dep);
                console.log(`  ✓ ${dep} installed`);
            } catch {
                console.log(`  ✗ ${dep} missing`);
                allInstalled = false;
            }
        }
        results.build = allInstalled;
        console.log(allInstalled ? '✅ Build verification: PASSED' : '❌ Build verification: FAILED');
    } catch (error) {
        console.log('❌ Build verification: FAILED -', error.message);
    }

    // 2. Database Connection
    console.log('\n2. DATABASE CONNECTION');
    console.log('-'.repeat(30));
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        // Test query
        const result = await client.query('SELECT NOW()');
        console.log(`✅ Database time: ${result.rows[0].now}`);
        
        // Count tables
        const tables = await client.query(`
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        results.tables = parseInt(tables.rows[0].count);
        console.log(`✅ Database has ${results.tables} tables`);
        
        // List key tables
        const keyTables = ['users', 'hospitals', 'patients', 'audit_logs'];
        console.log('Key tables:');
        for (const table of keyTables) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [table]);
            console.log(`  ${exists.rows[0].exists ? '✓' : '✗'} ${table}`);
        }
        
        results.database = true;
        console.log('✅ Database connection: PASSED');
    } catch (error) {
        console.log('❌ Database connection: FAILED -', error.message);
    } finally {
        await client.end();
    }

    // 3. Migration Capability
    console.log('\n3. MIGRATION CAPABILITY');
    console.log('-'.repeat(30));
    try {
        const client2 = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client2.connect();
        
        // Test creating a table
        await client2.query(`
            CREATE TABLE IF NOT EXISTS migration_test_${Date.now()} (
                id SERIAL PRIMARY KEY,
                test_field VARCHAR(255)
            )
        `);
        console.log('✅ Can create tables');
        
        // Test transaction
        await client2.query('BEGIN');
        await client2.query('ROLLBACK');
        console.log('✅ Transaction support verified');
        
        // Check for migration history
        const migHistory = await client2.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'migration_history'
            )
        `);
        console.log(`✅ Migration tracking: ${migHistory.rows[0].exists ? 'Configured' : 'Not configured'}`);
        
        results.migrations = true;
        console.log('✅ Migration capability: PASSED');
        await client2.end();
    } catch (error) {
        console.log('❌ Migration capability: FAILED -', error.message);
    }

    // 4. API Server Check
    console.log('\n4. API SERVER CHECK');
    console.log('-'.repeat(30));
    try {
        await new Promise((resolve, reject) => {
            http.get('http://localhost:5001/health', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        console.log('✅ API server responding');
                        console.log(`✅ Status: ${json.status}`);
                        console.log(`✅ Environment: ${json.environment}`);
                        results.api = true;
                        resolve();
                    } catch {
                        console.log('⚠️  API response not JSON');
                        resolve();
                    }
                });
            }).on('error', (err) => {
                console.log('❌ API server not responding:', err.message);
                resolve();
            });
        });
    } catch (error) {
        console.log('❌ API check failed:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Build System:        ${results.build ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Database Connection: ${results.database ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Migration Support:   ${results.migrations ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API Server:          ${results.api ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Tables:        ${results.tables}`);
    
    const allPassed = results.build && results.database && results.migrations && results.api;
    console.log('\n' + (allPassed ? '✅ ALL VERIFICATIONS PASSED!' : '⚠️  SOME VERIFICATIONS FAILED'));
    
    return allPassed;
}

// Run verification
verifyBackend().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
});
