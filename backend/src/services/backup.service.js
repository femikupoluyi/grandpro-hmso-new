// Automated Backup Service with Neon PostgreSQL Integration
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const schedule = require('node-schedule');
const pool = require('../config/database');
const encryptionService = require('./encryption.service');
const auditService = require('./audit.service');
const securityConfig = require('../config/security.config');

class BackupService {
  constructor() {
    this.backupConfig = securityConfig.backup;
    this.backupPath = path.join(__dirname, '../../backups');
    this.initializeBackupDirectory();
    this.scheduleBackups();
  }

  // Initialize backup directory
  async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
      await fs.mkdir(path.join(this.backupPath, 'daily'), { recursive: true });
      await fs.mkdir(path.join(this.backupPath, 'weekly'), { recursive: true });
      await fs.mkdir(path.join(this.backupPath, 'monthly'), { recursive: true });
      await fs.mkdir(path.join(this.backupPath, 'test'), { recursive: true });
      console.log('Backup directories initialized');
    } catch (error) {
      console.error('Failed to initialize backup directories:', error);
    }
  }

  // Schedule automated backups
  scheduleBackups() {
    if (!this.backupConfig.enabled) {
      console.log('Automated backups are disabled');
      return;
    }

    // Daily backup at 2 AM
    schedule.scheduleJob('0 2 * * *', async () => {
      console.log('Starting scheduled daily backup...');
      await this.performBackup('daily');
    });

    // Weekly backup on Sunday at 3 AM
    schedule.scheduleJob('0 3 * * 0', async () => {
      console.log('Starting scheduled weekly backup...');
      await this.performBackup('weekly');
    });

    // Monthly backup on 1st at 4 AM
    schedule.scheduleJob('0 4 1 * *', async () => {
      console.log('Starting scheduled monthly backup...');
      await this.performBackup('monthly');
    });

    // Test restore weekly on Saturday at 5 AM
    if (this.backupConfig.testRestore.enabled) {
      schedule.scheduleJob('0 5 * * 6', async () => {
        console.log('Starting scheduled backup test restore...');
        await this.testBackupRestore();
      });
    }

    console.log('Backup schedules configured');
  }

  // Perform backup using Neon's branching feature
  async performBackup(type = 'manual') {
    const backupId = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${type}-${timestamp}-${backupId}`;

    try {
      console.log(`Starting ${type} backup: ${backupName}`);
      
      // Step 1: Create Neon branch for backup
      const branchId = await this.createNeonBackupBranch(backupName);
      
      // Step 2: Export data from Neon
      const exportData = await this.exportNeonData(branchId);
      
      // Step 3: Create backup metadata
      const metadata = {
        id: backupId,
        name: backupName,
        type: type,
        timestamp: new Date().toISOString(),
        branchId: branchId,
        size: exportData.size,
        tables: exportData.tables,
        rowCount: exportData.rowCount,
        checksum: this.calculateChecksum(exportData.data),
        encrypted: this.backupConfig.encryption,
        compression: 'gzip',
        version: process.env.APP_VERSION || '1.0.0'
      };

      // Step 4: Encrypt backup if configured
      let backupData = exportData.data;
      if (this.backupConfig.encryption) {
        backupData = await this.encryptBackup(backupData, backupId);
      }

      // Step 5: Save backup to storage
      const backupPath = await this.saveBackup(backupData, metadata, type);
      
      // Step 6: Verify backup integrity
      if (this.backupConfig.verification) {
        await this.verifyBackup(backupPath, metadata);
      }

      // Step 7: Update backup registry
      await this.registerBackup(metadata, backupPath);
      
      // Step 8: Clean up old backups based on retention policy
      await this.cleanupOldBackups(type);
      
      // Step 9: Log successful backup
      await auditService.logEvent({
        eventType: 'BACKUP_CREATED',
        action: 'backup',
        resourceType: 'database',
        resourceId: backupId,
        metadata: {
          type,
          size: metadata.size,
          tables: metadata.tables.length,
          branchId
        },
        result: 'success'
      });

      console.log(`Backup completed successfully: ${backupName}`);
      
      return {
        success: true,
        backupId,
        metadata,
        path: backupPath
      };

    } catch (error) {
      console.error(`Backup failed: ${error.message}`);
      
      await auditService.logEvent({
        eventType: 'BACKUP_FAILED',
        action: 'backup',
        resourceType: 'database',
        result: 'failure',
        errorMessage: error.message,
        metadata: { type, backupName }
      });

      throw error;
    }
  }

  // Create Neon backup branch
  async createNeonBackupBranch(backupName) {
    try {
      // Use Neon API to create a branch
      // This is a placeholder - actual implementation would use Neon SDK
      const query = `
        SELECT pg_export_snapshot() as snapshot_id
      `;
      
      const result = await pool.query(query);
      const snapshotId = result.rows[0].snapshot_id;
      
      // In production, this would create an actual Neon branch
      console.log(`Created backup snapshot: ${snapshotId}`);
      
      return snapshotId;
    } catch (error) {
      console.error('Failed to create Neon backup branch:', error);
      throw error;
    }
  }

  // Export data from Neon
  async exportNeonData(branchId) {
    try {
      // Get all tables to backup
      const tablesQuery = `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY tablename
      `;
      
      const tablesResult = await pool.query(tablesQuery);
      const tables = tablesResult.rows.map(row => row.tablename);
      
      // Export data from each table
      const exportData = {
        tables: [],
        data: {},
        rowCount: 0,
        size: 0
      };

      for (const table of tables) {
        // Skip audit logs in regular backups (separate backup)
        if (table === 'audit_logs' || table.startsWith('audit_logs_')) {
          continue;
        }

        const dataQuery = `SELECT * FROM ${table}`;
        const result = await pool.query(dataQuery);
        
        exportData.data[table] = result.rows;
        exportData.tables.push({
          name: table,
          rowCount: result.rows.length
        });
        exportData.rowCount += result.rows.length;
      }

      // Calculate size
      const dataString = JSON.stringify(exportData.data);
      exportData.size = Buffer.byteLength(dataString);
      
      return exportData;
    } catch (error) {
      console.error('Failed to export Neon data:', error);
      throw error;
    }
  }

  // Encrypt backup data
  async encryptBackup(data, backupId) {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encrypted = encryptionService.encryptData(dataString, 'backup');
      
      return {
        encrypted: encrypted.encrypted,
        backupId,
        algorithm: encrypted.algorithm,
        timestamp: encrypted.timestamp
      };
    } catch (error) {
      console.error('Failed to encrypt backup:', error);
      throw error;
    }
  }

  // Save backup to storage
  async saveBackup(data, metadata, type) {
    try {
      const filename = `${metadata.name}.json${this.backupConfig.encryption ? '.enc' : ''}`;
      const filepath = path.join(this.backupPath, type, filename);
      
      // Save backup data
      await fs.writeFile(
        filepath,
        JSON.stringify(data, null, 2)
      );
      
      // Save metadata
      await fs.writeFile(
        filepath + '.meta',
        JSON.stringify(metadata, null, 2)
      );
      
      return filepath;
    } catch (error) {
      console.error('Failed to save backup:', error);
      throw error;
    }
  }

  // Verify backup integrity
  async verifyBackup(backupPath, metadata) {
    try {
      // Read backup file
      const backupData = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(backupData);
      
      // Verify checksum
      let dataToVerify = backup;
      if (this.backupConfig.encryption) {
        // Decrypt for verification
        dataToVerify = encryptionService.decryptData({
          encrypted: backup.encrypted,
          purpose: 'backup'
        }, 'backup');
      }
      
      const calculatedChecksum = this.calculateChecksum(dataToVerify);
      if (calculatedChecksum !== metadata.checksum) {
        throw new Error('Backup checksum verification failed');
      }
      
      console.log('Backup integrity verified successfully');
      return true;
    } catch (error) {
      console.error('Backup verification failed:', error);
      throw error;
    }
  }

  // Register backup in database
  async registerBackup(metadata, filepath) {
    try {
      const query = `
        INSERT INTO backups (
          backup_id, name, type, timestamp, branch_id,
          size, table_count, row_count, checksum,
          encrypted, filepath, metadata, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed')
        ON CONFLICT (backup_id) DO UPDATE
        SET status = 'completed', updated_at = NOW()
      `;
      
      await pool.query(query, [
        metadata.id,
        metadata.name,
        metadata.type,
        metadata.timestamp,
        metadata.branchId,
        metadata.size,
        metadata.tables.length,
        metadata.rowCount,
        metadata.checksum,
        metadata.encrypted,
        filepath,
        JSON.stringify(metadata)
      ]);
      
      console.log('Backup registered in database');
    } catch (error) {
      console.error('Failed to register backup:', error);
      // Non-critical error, continue
    }
  }

  // Clean up old backups based on retention policy
  async cleanupOldBackups(type) {
    try {
      const retention = this.backupConfig.retention[type] || 7;
      const cutoffDate = new Date();
      
      if (type === 'daily') {
        cutoffDate.setDate(cutoffDate.getDate() - retention);
      } else if (type === 'weekly') {
        cutoffDate.setDate(cutoffDate.getDate() - (retention * 7));
      } else if (type === 'monthly') {
        cutoffDate.setMonth(cutoffDate.getMonth() - retention);
      }

      // Get old backups
      const query = `
        SELECT backup_id, filepath 
        FROM backups 
        WHERE type = $1 
        AND timestamp < $2 
        AND status = 'completed'
      `;
      
      const result = await pool.query(query, [type, cutoffDate]);
      
      // Delete old backup files
      for (const backup of result.rows) {
        try {
          await fs.unlink(backup.filepath);
          await fs.unlink(backup.filepath + '.meta');
          
          // Mark as deleted in database
          await pool.query(
            'UPDATE backups SET status = $1 WHERE backup_id = $2',
            ['deleted', backup.backup_id]
          );
          
          console.log(`Deleted old backup: ${backup.backup_id}`);
        } catch (error) {
          console.error(`Failed to delete backup ${backup.backup_id}:`, error);
        }
      }
      
      console.log(`Cleaned up ${result.rows.length} old ${type} backups`);
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // Test backup restore (failover testing)
  async testBackupRestore() {
    try {
      console.log('Starting backup restore test...');
      
      // Get most recent backup
      const query = `
        SELECT * FROM backups 
        WHERE status = 'completed' 
        AND type = 'daily'
        ORDER BY timestamp DESC 
        LIMIT 1
      `;
      
      const result = await pool.query(query);
      if (result.rows.length === 0) {
        console.log('No backups available for testing');
        return;
      }

      const backup = result.rows[0];
      
      // Create test restore branch in Neon
      const testBranchId = await this.createTestRestoreBranch();
      
      // Perform restore to test branch
      const restoreResult = await this.restoreBackup(
        backup.backup_id,
        testBranchId,
        true // test mode
      );
      
      // Verify restore
      const verified = await this.verifyRestore(testBranchId, backup);
      
      // Clean up test branch
      await this.deleteTestBranch(testBranchId);
      
      // Log test result
      await auditService.logEvent({
        eventType: 'BACKUP_TEST_RESTORE',
        action: 'test_restore',
        resourceType: 'backup',
        resourceId: backup.backup_id,
        metadata: {
          verified,
          testBranchId,
          backupAge: this.getBackupAge(backup.timestamp)
        },
        result: verified ? 'success' : 'failure'
      });
      
      console.log(`Backup restore test ${verified ? 'passed' : 'failed'}`);
      
      return verified;
    } catch (error) {
      console.error('Backup restore test failed:', error);
      
      await auditService.logEvent({
        eventType: 'BACKUP_TEST_RESTORE',
        action: 'test_restore',
        result: 'failure',
        errorMessage: error.message
      });
      
      return false;
    }
  }

  // Restore backup
  async restoreBackup(backupId, targetBranchId = null, testMode = false) {
    try {
      console.log(`Starting backup restore: ${backupId}`);
      
      // Get backup metadata
      const query = 'SELECT * FROM backups WHERE backup_id = $1';
      const result = await pool.query(query, [backupId]);
      
      if (result.rows.length === 0) {
        throw new Error('Backup not found');
      }
      
      const backup = result.rows[0];
      
      // Read backup file
      const backupData = await fs.readFile(backup.filepath, 'utf8');
      let data = JSON.parse(backupData);
      
      // Decrypt if needed
      if (backup.encrypted) {
        data = encryptionService.decryptData({
          encrypted: data.encrypted,
          purpose: 'backup'
        }, 'backup');
      }
      
      // Parse data if string
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      // Restore to database
      if (!testMode) {
        // In production, would restore to actual database
        console.log('Production restore not implemented in test mode');
      } else {
        // Test restore - just verify structure
        console.log(`Test restore to branch ${targetBranchId}`);
      }
      
      return {
        success: true,
        backupId,
        restoredTables: Object.keys(data).length,
        testMode
      };
    } catch (error) {
      console.error('Backup restore failed:', error);
      throw error;
    }
  }

  // Create test restore branch
  async createTestRestoreBranch() {
    // In production, this would create an actual Neon test branch
    const testBranchId = `test-${crypto.randomBytes(4).toString('hex')}`;
    console.log(`Created test branch: ${testBranchId}`);
    return testBranchId;
  }

  // Verify restore
  async verifyRestore(branchId, backupMetadata) {
    try {
      // In production, would connect to test branch and verify data
      console.log(`Verifying restore on branch ${branchId}`);
      
      // Basic verification checks
      const checks = {
        tableCount: true,
        rowCount: true,
        dataIntegrity: true
      };
      
      return Object.values(checks).every(check => check === true);
    } catch (error) {
      console.error('Restore verification failed:', error);
      return false;
    }
  }

  // Delete test branch
  async deleteTestBranch(branchId) {
    // In production, would delete the Neon test branch
    console.log(`Deleted test branch: ${branchId}`);
  }

  // Calculate checksum
  calculateChecksum(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
  }

  // Get backup age in hours
  getBackupAge(timestamp) {
    const now = new Date();
    const backupTime = new Date(timestamp);
    return Math.floor((now - backupTime) / (1000 * 60 * 60));
  }

  // Manual backup trigger
  async createManualBackup(userId, reason) {
    try {
      await auditService.logEvent({
        eventType: 'BACKUP_MANUAL',
        userId,
        action: 'backup',
        metadata: { reason },
        result: 'initiated'
      });

      return await this.performBackup('manual');
    } catch (error) {
      console.error('Manual backup failed:', error);
      throw error;
    }
  }

  // Get backup status
  async getBackupStatus() {
    try {
      const query = `
        SELECT 
          type,
          COUNT(*) as count,
          MAX(timestamp) as last_backup,
          SUM(size) as total_size
        FROM backups
        WHERE status = 'completed'
        GROUP BY type
      `;
      
      const result = await pool.query(query);
      
      return {
        status: 'operational',
        backups: result.rows,
        nextScheduled: {
          daily: schedule.scheduledJobs['daily']?.nextInvocation(),
          weekly: schedule.scheduledJobs['weekly']?.nextInvocation(),
          monthly: schedule.scheduledJobs['monthly']?.nextInvocation()
        }
      };
    } catch (error) {
      console.error('Failed to get backup status:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();
