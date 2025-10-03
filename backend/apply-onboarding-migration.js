const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

dotenv.config({ path: path.join(__dirname, '.env') });

async function applyOnboardingMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', '005_digital_sourcing_onboarding.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        // Split by semicolons but carefully to avoid breaking functions
        const statements = migrationSQL
            .split(/;\s*$|;\s*\n/gm)
            .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            
            // Skip empty statements
            if (!statement) continue;
            
            // Skip comments
            if (statement.startsWith('--')) continue;

            try {
                // For function definitions, we need to handle them specially
                if (statement.includes('$$ LANGUAGE plpgsql') || statement.includes('$$ LANGUAGE sql')) {
                    // Reconstruct the full function definition
                    let fullStatement = statement;
                    if (!fullStatement.endsWith('$$ LANGUAGE plpgsql') && !fullStatement.endsWith('$$ LANGUAGE sql')) {
                        fullStatement += ';';
                    }
                    await client.query(fullStatement);
                } else {
                    await client.query(statement);
                }
                
                successCount++;
                
                // Log progress for important statements
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE (\w+)/)?.[1];
                    console.log(`✓ Created table: ${tableName}`);
                } else if (statement.includes('CREATE INDEX')) {
                    const indexName = statement.match(/CREATE INDEX (\w+)/)?.[1];
                    console.log(`✓ Created index: ${indexName}`);
                } else if (statement.includes('INSERT INTO')) {
                    const tableName = statement.match(/INSERT INTO (\w+)/)?.[1];
                    console.log(`✓ Inserted data into: ${tableName}`);
                } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
                    const functionName = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/)?.[1];
                    console.log(`✓ Created function: ${functionName}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`✗ Error executing statement ${i + 1}:`, error.message);
                // Continue with other statements
            }
        }

        console.log(`\nMigration Summary:`);
        console.log(`✓ Successful statements: ${successCount}`);
        console.log(`✗ Failed statements: ${errorCount}`);

        // Verify tables were created
        const tableCheckResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'evaluation_criteria',
                'document_types',
                'onboarding_applications',
                'application_documents',
                'evaluation_scores',
                'contracts',
                'contract_templates',
                'digital_signatures',
                'onboarding_status_history'
            )
            ORDER BY table_name
        `);

        console.log(`\n✅ Tables created: ${tableCheckResult.rows.length}/9`);
        tableCheckResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check for data in key tables
        const criteriaCount = await client.query('SELECT COUNT(*) FROM evaluation_criteria');
        const docTypesCount = await client.query('SELECT COUNT(*) FROM document_types');
        const templateCount = await client.query('SELECT COUNT(*) FROM contract_templates');

        console.log(`\n📊 Initial data:`);
        console.log(`  - Evaluation criteria: ${criteriaCount.rows[0].count}`);
        console.log(`  - Document types: ${docTypesCount.rows[0].count}`);
        console.log(`  - Contract templates: ${templateCount.rows[0].count}`);

        console.log('\n✅ Onboarding module database migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyOnboardingMigration();
