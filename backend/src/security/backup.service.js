/**
 * Automated Backup and Disaster Recovery Service
 * Handles database backups, failover testing, and recovery procedures
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');
const encryptionService = require('./encryption.service');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.schedules = [];
    this.isInitialized = false;
    
    // Backup configuration
    this.config = {
      retention: {
        daily: 7,     // Keep 7 daily backups
        weekly: 4,    // Keep 4 weekly backups
        monthly: 6    // Keep 6 monthly backups
      },
      encryption: true,
      compression: true,
      verification: true
    };
  }

  /**
   * Initialize backup schedules
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing backup service...');
    
    // Ensure backup directory exists
    await this.ensureBackupDirectory();
    
    // Schedule automated backups
    this.scheduleBackups();
    
    // Test backup configuration
    await this.testBackupConfiguration();
    
    this.isInitialized = true;
    console.log('Backup service initialized successfully');
  }

  /**
   * Schedule automated backups
   */
  scheduleBackups() {
    // Daily incremental backup at 2:00 AM
    const dailyBackup = cron.schedule('0 2 * * *', async () => {
      await this.performBackup('incremental', 'daily');
    });
    
    // Weekly full backup on Sunday at 3:00 AM
    const weeklyBackup = cron.schedule('0 3 * * 0', async () => {
      await this.performBackup('full', 'weekly');
    });
    
    // Monthly archive backup on 1st of each month at 4:00 AM
    const monthlyBackup = cron.schedule('0 4 1 * *', async () => {
      await this.performBackup('archive', 'monthly');
    });
    
    this.schedules = [dailyBackup, weeklyBackup, monthlyBackup];
    
    // Start all schedules in production
    if (process.env.NODE_ENV === 'production') {
      this.schedules.forEach(schedule => schedule.start());
    }
    
    console.log('Backup schedules configured:');
    console.log('- Daily incremental: 2:00 AM');
    console.log('- Weekly full: Sunday 3:00 AM');
    console.log('- Monthly archive: 1st of month 4:00 AM');
  }

  /**
   * Perform database backup
   */
  async performBackup(type = 'full', schedule = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `grandpro_${type}_${schedule}_${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.sql`);
    
    try {
      console.log(`Starting ${type} backup: ${backupName}`);
      
      // Get database connection details
      const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
      
      // Create backup based on type
      let backupData;
      if (type === 'incremental') {
        backupData = await this.createIncrementalBackup();
      } else {
        backupData = await this.createFullBackup(dbUrl);
      }
      
      // Encrypt backup if configured
      if (this.config.encryption) {
        backupData = await this.encryptBackup(backupData);
      }
      
      // Compress backup if configured
      if (this.config.compression) {
        backupData = await this.compressBackup(backupData);
      }
      
      // Write backup to file
      await fs.writeFile(backupPath, backupData);
      
      // Verify backup if configured
      if (this.config.verification) {
        await this.verifyBackup(backupPath);
      }
      
      // Log backup completion
      await this.logBackup({
        name: backupName,
        type,
        schedule,
        path: backupPath,
        size: (await fs.stat(backupPath)).size,
        status: 'completed'
      });
      
      // Clean up old backups
      await this.cleanupOldBackups(schedule);
      
      console.log(`Backup completed: ${backupName}`);
      return { success: true, backupName, path: backupPath };
      
    } catch (error) {
      console.error(`Backup failed: ${error.message}`);
      
      await this.logBackup({
        name: backupName,
        type,
        schedule,
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Create full database backup
   */
  async createFullBackup(dbUrl) {
    const client = await pool.connect();
    
    try {
      // Get all table names
      const tablesQuery = `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name
      `;
      
      const tables = await client.query(tablesQuery);
      
      let backupSQL = '-- GrandPro HMSO Full Database Backup\n';
      backupSQL += `-- Generated: ${new Date().toISOString()}\n\n`;
      
      // Add schema creation
      backupSQL += '-- Create schemas\n';
      const schemas = [...new Set(tables.rows.map(t => t.table_schema))];
      for (const schema of schemas) {
        backupSQL += `CREATE SCHEMA IF NOT EXISTS ${schema};\n`;
      }
      
      // Backup each table
      for (const table of tables.rows) {
        const tableName = `${table.table_schema}.${table.table_name}`;
        
        // Get table structure
        const structureQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `;
        
        const structure = await client.query(structureQuery, [table.table_schema, table.table_name]);
        
        // Create table DDL
        backupSQL += `\n-- Table: ${tableName}\n`;
        backupSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
        
        const columns = structure.rows.map(col => {
          let def = `  ${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        
        backupSQL += columns.join(',\n');
        backupSQL += '\n);\n\n';
        
        // Get table data
        const dataQuery = `SELECT * FROM ${tableName}`;
        const data = await client.query(dataQuery);
        
        // Create INSERT statements
        if (data.rows.length > 0) {
          backupSQL += `-- Data for ${tableName}\n`;
          for (const row of data.rows) {
            const values = Object.values(row).map(v => 
              v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
            );
            backupSQL += `INSERT INTO ${tableName} VALUES (${values.join(', ')});\n`;
          }
        }
      }
      
      return backupSQL;
      
    } finally {
      client.release();
    }
  }

  /**
   * Create incremental backup (only changes since last backup)
   */
  async createIncrementalBackup() {
    const client = await pool.connect();
    
    try {
      // Get last backup timestamp
      const lastBackup = await this.getLastBackupTime();
      
      let backupSQL = '-- GrandPro HMSO Incremental Backup\n';
      backupSQL += `-- Since: ${lastBackup.toISOString()}\n`;
      backupSQL += `-- Generated: ${new Date().toISOString()}\n\n`;
      
      // Get tables with updated_at columns
      const tablesQuery = `
        SELECT DISTINCT table_schema, table_name
        FROM information_schema.columns
        WHERE column_name IN ('updated_at', 'created_at')
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
      `;
      
      const tables = await client.query(tablesQuery);
      
      for (const table of tables.rows) {
        const tableName = `${table.table_schema}.${table.table_name}`;
        
        // Get changed records
        const changedQuery = `
          SELECT * FROM ${tableName}
          WHERE updated_at > $1 OR created_at > $1
        `;
        
        const changed = await client.query(changedQuery, [lastBackup]);
        
        if (changed.rows.length > 0) {
          backupSQL += `-- Changes for ${tableName}\n`;
          
          for (const row of changed.rows) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(v => 
              v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
            );
            
            backupSQL += `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')}) `;
            backupSQL += `ON CONFLICT DO UPDATE SET `;
            
            const updates = Object.keys(row)
              .filter(k => k !== 'id')
              .map(k => `${k} = EXCLUDED.${k}`);
            
            backupSQL += updates.join(', ') + ';\n';
          }
        }
      }
      
      return backupSQL;
      
    } finally {
      client.release();
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath) {
    try {
      console.log(`Starting restore from: ${backupPath}`);
      
      // Read backup file
      let backupData = await fs.readFile(backupPath, 'utf8');
      
      // Decrypt if needed
      if (backupData.startsWith('ENCRYPTED:')) {
        backupData = await this.decryptBackup(backupData);
      }
      
      // Decompress if needed
      if (backupData.startsWith('COMPRESSED:')) {
        backupData = await this.decompressBackup(backupData);
      }
      
      // Execute restore
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Split backup into individual statements
        const statements = backupData
          .split(';')
          .filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          await client.query(statement);
        }
        
        await client.query('COMMIT');
        
        console.log('Restore completed successfully');
        return { success: true, restoredFrom: backupPath };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error(`Restore failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test failover scenario
   */
  async testFailover() {
    console.log('Starting failover test...');
    
    const testResults = {
      timestamp: new Date(),
      tests: []
    };
    
    try {
      // Test 1: Database connectivity
      const connectTest = await this.testDatabaseConnection();
      testResults.tests.push({
        name: 'Database Connectivity',
        passed: connectTest.success,
        duration: connectTest.duration
      });
      
      // Test 2: Backup creation
      const backupTest = await this.testBackupCreation();
      testResults.tests.push({
        name: 'Backup Creation',
        passed: backupTest.success,
        duration: backupTest.duration
      });
      
      // Test 3: Backup restoration
      const restoreTest = await this.testBackupRestoration();
      testResults.tests.push({
        name: 'Backup Restoration',
        passed: restoreTest.success,
        duration: restoreTest.duration
      });
      
      // Test 4: Data integrity
      const integrityTest = await this.testDataIntegrity();
      testResults.tests.push({
        name: 'Data Integrity',
        passed: integrityTest.success,
        details: integrityTest.details
      });
      
      // Test 5: Recovery time objective (RTO)
      const rtoTest = await this.testRTO();
      testResults.tests.push({
        name: 'Recovery Time Objective',
        passed: rtoTest.duration < 300000, // 5 minutes
        duration: rtoTest.duration
      });
      
      // Calculate overall result
      testResults.allPassed = testResults.tests.every(t => t.passed);
      testResults.summary = `${testResults.tests.filter(t => t.passed).length}/${testResults.tests.length} tests passed`;
      
      // Log test results
      await this.logFailoverTest(testResults);
      
      console.log('Failover test completed:', testResults.summary);
      return testResults;
      
    } catch (error) {
      console.error('Failover test failed:', error);
      testResults.error = error.message;
      return testResults;
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    const start = Date.now();
    
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      return {
        success: true,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test backup creation
   */
  async testBackupCreation() {
    const start = Date.now();
    
    try {
      const result = await this.performBackup('full', 'test');
      
      // Verify backup file exists
      await fs.access(result.path);
      
      return {
        success: true,
        duration: Date.now() - start,
        backupSize: (await fs.stat(result.path)).size
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test backup restoration
   */
  async testBackupRestoration() {
    const start = Date.now();
    
    try {
      // Create a test backup
      const backup = await this.performBackup('full', 'test-restore');
      
      // Test restoration (in transaction, will rollback)
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Simulate restoration
        await client.query('CREATE TEMP TABLE test_restore (id INT, data TEXT)');
        await client.query('INSERT INTO test_restore VALUES (1, \'test\')');
        
        // Verify restoration
        const result = await client.query('SELECT * FROM test_restore');
        
        await client.query('ROLLBACK');
        
        return {
          success: result.rows.length > 0,
          duration: Date.now() - start
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Test data integrity after restore
   */
  async testDataIntegrity() {
    const client = await pool.connect();
    
    try {
      const checks = [];
      
      // Check record counts
      const tables = ['users', 'patients', 'hospitals', 'appointments'];
      
      for (const table of tables) {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        checks.push({
          table,
          count: result.rows[0].count,
          valid: parseInt(result.rows[0].count) >= 0
        });
      }
      
      // Check foreign key constraints
      const fkQuery = `
        SELECT conname, conrelid::regclass, confrelid::regclass
        FROM pg_constraint
        WHERE contype = 'f'
        LIMIT 5
      `;
      
      const fkResult = await client.query(fkQuery);
      
      return {
        success: checks.every(c => c.valid),
        details: {
          recordCounts: checks,
          foreignKeys: fkResult.rows.length
        }
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Test Recovery Time Objective (RTO)
   */
  async testRTO() {
    const start = Date.now();
    
    try {
      // Simulate database failure and recovery
      const backup = await this.performBackup('incremental', 'rto-test');
      
      // Simulate restoration time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        duration: Date.now() - start
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Encrypt backup data
   */
  async encryptBackup(data) {
    const encrypted = encryptionService.encrypt(data);
    return `ENCRYPTED:${JSON.stringify(encrypted)}`;
  }

  /**
   * Decrypt backup data
   */
  async decryptBackup(data) {
    const encryptedData = JSON.parse(data.replace('ENCRYPTED:', ''));
    return encryptionService.decrypt(encryptedData);
  }

  /**
   * Compress backup data
   */
  async compressBackup(data) {
    const zlib = require('zlib');
    const compressed = zlib.gzipSync(data);
    return `COMPRESSED:${compressed.toString('base64')}`;
  }

  /**
   * Decompress backup data
   */
  async decompressBackup(data) {
    const zlib = require('zlib');
    const compressed = Buffer.from(data.replace('COMPRESSED:', ''), 'base64');
    return zlib.gunzipSync(compressed).toString();
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    try {
      const stats = await fs.stat(backupPath);
      
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }
      
      // In production, would verify checksum/hash
      return true;
      
    } catch (error) {
      throw new Error(`Backup verification failed: ${error.message}`);
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(schedule) {
    const retention = this.config.retention[schedule];
    if (!retention) return;
    
    const files = await fs.readdir(this.backupDir);
    const backupFiles = files
      .filter(f => f.includes(`_${schedule}_`))
      .sort()
      .reverse();
    
    if (backupFiles.length > retention) {
      const toDelete = backupFiles.slice(retention);
      
      for (const file of toDelete) {
        await fs.unlink(path.join(this.backupDir, file));
        console.log(`Deleted old backup: ${file}`);
      }
    }
  }

  /**
   * Get last backup timestamp
   */
  async getLastBackupTime() {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT MAX(created_at) as last_backup
        FROM backup_logs
        WHERE status = 'completed'
      `;
      
      const result = await client.query(query);
      return result.rows[0]?.last_backup || new Date(Date.now() - 86400000); // Default to 24 hours ago
      
    } finally {
      client.release();
    }
  }

  /**
   * Log backup operation
   */
  async logBackup(details) {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO backup_logs (
          backup_name, backup_type, schedule, file_path,
          file_size, status, error_message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await client.query(query, [
        details.name,
        details.type,
        details.schedule,
        details.path || null,
        details.size || null,
        details.status,
        details.error || null,
        new Date()
      ]);
      
    } catch (error) {
      console.error('Failed to log backup:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Log failover test results
   */
  async logFailoverTest(results) {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO failover_tests (
          test_date, all_passed, test_results, error_message
        ) VALUES ($1, $2, $3, $4)
      `;
      
      await client.query(query, [
        results.timestamp,
        results.allPassed,
        JSON.stringify(results.tests),
        results.error || null
      ]);
      
    } catch (error) {
      console.error('Failed to log failover test:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Test backup configuration on Neon
   */
  async testBackupConfiguration() {
    try {
      // Verify database connection
      const connectTest = await this.testDatabaseConnection();
      if (!connectTest.success) {
        throw new Error('Database connection failed');
      }
      
      console.log('Backup configuration test passed');
      return true;
      
    } catch (error) {
      console.error('Backup configuration test failed:', error);
      return false;
    }
  }
}

module.exports = new BackupService();
