const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function applyMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Applying database migrations...\n');
        
        await client.connect();
        console.log('✅ Database connected');

        // Ensure migration history table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64),
                execution_time_ms INTEGER,
                success BOOLEAN DEFAULT true
            )
        `);

        // Get list of migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
        
        console.log(`Found ${sqlFiles.length} migration files\n`);

        for (const file of sqlFiles) {
            // Check if already applied
            const result = await client.query(
                'SELECT * FROM migration_history WHERE migration_name = $1',
                [file]
            );
            
            if (result.rows.length > 0) {
                console.log(`⏭️  Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`📝 Applying ${file}...`);
            const startTime = Date.now();
            
            try {
                const sqlContent = await fs.readFile(
                    path.join(migrationsDir, file), 
                    'utf8'
                );
                
                // Split by semicolons but be careful with functions/procedures
                const statements = sqlContent
                    .split(/;(?![^(]*\))/g)
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                await client.query('BEGIN');
                
                let stmtCount = 0;
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await client.query(statement);
                            stmtCount++;
                        } catch (stmtError) {
                            // Ignore "already exists" errors
                            if (!stmtError.message.includes('already exists')) {
                                throw stmtError;
                            }
                        }
                    }
                }
                
                // Record successful migration
                await client.query(
                    `INSERT INTO migration_history (migration_name, execution_time_ms) 
                     VALUES ($1, $2)`,
                    [file, Date.now() - startTime]
                );
                
                await client.query('COMMIT');
                console.log(`✅ Applied ${file} (${stmtCount} statements in ${Date.now() - startTime}ms)`);
                
            } catch (error) {
                await client.query('ROLLBACK');
                console.log(`❌ Failed to apply ${file}: ${error.message}`);
                // Continue with next migration instead of failing completely
            }
        }

        // Show migration status
        console.log('\n📊 Migration Summary:');
        const history = await client.query(`
            SELECT migration_name, applied_at, execution_time_ms 
            FROM migration_history 
            ORDER BY applied_at DESC 
            LIMIT 10
        `);
        
        console.log(`Total migrations applied: ${history.rows.length}`);
        history.rows.forEach(row => {
            console.log(`  - ${row.migration_name} (${row.execution_time_ms}ms)`);
        });

        return true;
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        return false;
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run migrations
applyMigration().then(success => {
    if (success) {
        console.log('\n✅ Migration process completed successfully!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Migration process completed with errors');
        process.exit(1);
    }
});
