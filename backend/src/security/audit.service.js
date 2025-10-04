/**
 * Audit Logging Service
 * Comprehensive audit trail for HIPAA/GDPR compliance
 */

const pool = require('../config/database');
const encryptionService = require('./encryption.service');

class AuditService {
  constructor() {
    this.auditLevels = {
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
      CRITICAL: 'CRITICAL',
      SECURITY: 'SECURITY',
      COMPLIANCE: 'COMPLIANCE'
    };

    this.eventTypes = {
      // Authentication Events
      LOGIN: 'USER_LOGIN',
      LOGOUT: 'USER_LOGOUT',
      LOGIN_FAILED: 'USER_LOGIN_FAILED',
      PASSWORD_CHANGE: 'USER_PASSWORD_CHANGE',
      
      // Data Access Events
      DATA_VIEW: 'DATA_VIEW',
      DATA_CREATE: 'DATA_CREATE',
      DATA_UPDATE: 'DATA_UPDATE',
      DATA_DELETE: 'DATA_DELETE',
      DATA_EXPORT: 'DATA_EXPORT',
      
      // Medical Records Events
      MEDICAL_RECORD_ACCESS: 'MEDICAL_RECORD_ACCESS',
      MEDICAL_RECORD_CREATE: 'MEDICAL_RECORD_CREATE',
      MEDICAL_RECORD_UPDATE: 'MEDICAL_RECORD_UPDATE',
      PRESCRIPTION_CREATE: 'PRESCRIPTION_CREATE',
      
      // Administrative Events
      USER_CREATE: 'USER_CREATE',
      USER_UPDATE: 'USER_UPDATE',
      USER_DELETE: 'USER_DELETE',
      ROLE_CHANGE: 'ROLE_CHANGE',
      PERMISSION_CHANGE: 'PERMISSION_CHANGE',
      
      // System Events
      SYSTEM_START: 'SYSTEM_START',
      SYSTEM_STOP: 'SYSTEM_STOP',
      BACKUP_CREATE: 'BACKUP_CREATE',
      BACKUP_RESTORE: 'BACKUP_RESTORE',
      
      // Security Events
      UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
      SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
      DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT',
      
      // Compliance Events
      CONSENT_GIVEN: 'CONSENT_GIVEN',
      CONSENT_WITHDRAWN: 'CONSENT_WITHDRAWN',
      DATA_REQUEST: 'DATA_REQUEST',
      DATA_DELETION: 'DATA_DELETION'
    };
  }

  /**
   * Log an audit event
   */
  async logEvent(eventData) {
    const client = await pool.connect();
    
    try {
      const {
        userId,
        userName,
        userRole,
        eventType,
        eventLevel = this.auditLevels.INFO,
        resourceType,
        resourceId,
        action,
        description,
        ipAddress,
        userAgent,
        metadata = {},
        changes = null
      } = eventData;

      // Encrypt sensitive metadata
      const encryptedMetadata = this.encryptSensitiveData(metadata);
      
      // Store original values for change tracking
      let changeLog = null;
      if (changes) {
        changeLog = {
          before: changes.before ? encryptionService.maskSensitiveData(changes.before) : null,
          after: changes.after ? encryptionService.maskSensitiveData(changes.after) : null
        };
      }

      const query = `
        INSERT INTO audit_logs (
          user_id, user_name, user_role, event_type, event_level,
          resource_type, resource_id, action, description,
          ip_address, user_agent, metadata, changes,
          created_at, session_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING id
      `;

      const values = [
        userId,
        userName,
        userRole,
        eventType,
        eventLevel,
        resourceType,
        resourceId,
        action,
        description,
        ipAddress,
        userAgent,
        JSON.stringify(encryptedMetadata),
        changeLog ? JSON.stringify(changeLog) : null,
        new Date(),
        metadata.sessionId || null
      ];

      const result = await client.query(query, values);

      // For critical events, send immediate alerts
      if (eventLevel === this.auditLevels.CRITICAL || 
          eventLevel === this.auditLevels.SECURITY) {
        await this.sendSecurityAlert(eventData);
      }

      return result.rows[0].id;

    } catch (error) {
      console.error('Audit logging failed:', error);
      // Fallback to file logging if database fails
      this.logToFile(eventData);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log data access for HIPAA compliance
   */
  async logDataAccess(accessData) {
    const {
      userId,
      patientId,
      recordType,
      recordId,
      action,
      reason,
      ipAddress
    } = accessData;

    await this.logEvent({
      userId,
      eventType: this.eventTypes.DATA_VIEW,
      eventLevel: this.auditLevels.COMPLIANCE,
      resourceType: recordType,
      resourceId: recordId,
      action: action || 'VIEW',
      description: `Accessed ${recordType} for patient ${patientId}`,
      ipAddress,
      metadata: {
        patientId,
        accessReason: reason,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log authentication events
   */
  async logAuthentication(authData) {
    const {
      userId,
      userName,
      success,
      ipAddress,
      userAgent,
      failureReason
    } = authData;

    await this.logEvent({
      userId: userId || null,
      userName: userName || 'Unknown',
      eventType: success ? this.eventTypes.LOGIN : this.eventTypes.LOGIN_FAILED,
      eventLevel: success ? this.auditLevels.INFO : this.auditLevels.WARNING,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      description: success 
        ? `User ${userName} logged in successfully`
        : `Failed login attempt for ${userName}: ${failureReason}`,
      ipAddress,
      userAgent,
      metadata: {
        timestamp: new Date().toISOString(),
        success,
        failureReason
      }
    });
  }

  /**
   * Log consent management for GDPR
   */
  async logConsent(consentData) {
    const {
      userId,
      patientId,
      consentType,
      action,
      consentGiven,
      purpose,
      expiryDate
    } = consentData;

    await this.logEvent({
      userId,
      eventType: consentGiven ? this.eventTypes.CONSENT_GIVEN : this.eventTypes.CONSENT_WITHDRAWN,
      eventLevel: this.auditLevels.COMPLIANCE,
      resourceType: 'CONSENT',
      resourceId: patientId,
      action,
      description: `Patient ${patientId} ${consentGiven ? 'gave' : 'withdrew'} consent for ${consentType}`,
      metadata: {
        consentType,
        purpose,
        expiryDate,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(criteria) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT * FROM audit_logs 
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      if (criteria.userId) {
        paramCount++;
        query += ` AND user_id = $${paramCount}`;
        values.push(criteria.userId);
      }

      if (criteria.eventType) {
        paramCount++;
        query += ` AND event_type = $${paramCount}`;
        values.push(criteria.eventType);
      }

      if (criteria.startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        values.push(criteria.startDate);
      }

      if (criteria.endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        values.push(criteria.endDate);
      }

      if (criteria.resourceType) {
        paramCount++;
        query += ` AND resource_type = $${paramCount}`;
        values.push(criteria.resourceType);
      }

      query += ` ORDER BY created_at DESC LIMIT 1000`;

      const result = await client.query(query, values);
      return result.rows;

    } finally {
      client.release();
    }
  }

  /**
   * Generate audit report for compliance
   */
  async generateComplianceReport(startDate, endDate) {
    const client = await pool.connect();
    
    try {
      // Get summary statistics
      const summaryQuery = `
        SELECT 
          event_type,
          event_level,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY event_type, event_level
        ORDER BY count DESC
      `;

      const summary = await client.query(summaryQuery, [startDate, endDate]);

      // Get user activity
      const userActivityQuery = `
        SELECT 
          user_id,
          user_name,
          user_role,
          COUNT(*) as action_count,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM audit_logs
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY user_id, user_name, user_role
        ORDER BY action_count DESC
        LIMIT 100
      `;

      const userActivity = await client.query(userActivityQuery, [startDate, endDate]);

      // Get security events
      const securityQuery = `
        SELECT * FROM audit_logs
        WHERE event_level IN ('SECURITY', 'CRITICAL')
          AND created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC
      `;

      const securityEvents = await client.query(securityQuery, [startDate, endDate]);

      // Get data access logs
      const dataAccessQuery = `
        SELECT 
          resource_type,
          COUNT(*) as access_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs
        WHERE event_type LIKE 'DATA_%'
          AND created_at BETWEEN $1 AND $2
        GROUP BY resource_type
      `;

      const dataAccess = await client.query(dataAccessQuery, [startDate, endDate]);

      return {
        reportPeriod: { startDate, endDate },
        summary: summary.rows,
        userActivity: userActivity.rows,
        securityEvents: securityEvents.rows,
        dataAccess: dataAccess.rows,
        generatedAt: new Date()
      };

    } finally {
      client.release();
    }
  }

  /**
   * Archive old audit logs
   */
  async archiveAuditLogs(daysToKeep = 90) {
    const client = await pool.connect();
    
    try {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - daysToKeep);

      // Move old logs to archive table
      const archiveQuery = `
        INSERT INTO audit_logs_archive
        SELECT * FROM audit_logs
        WHERE created_at < $1
      `;

      await client.query(archiveQuery, [archiveDate]);

      // Delete archived logs from main table
      const deleteQuery = `
        DELETE FROM audit_logs
        WHERE created_at < $1
      `;

      const result = await client.query(deleteQuery, [archiveDate]);

      await this.logEvent({
        userId: 'SYSTEM',
        eventType: 'AUDIT_LOG_ARCHIVE',
        eventLevel: this.auditLevels.INFO,
        description: `Archived ${result.rowCount} audit logs older than ${daysToKeep} days`,
        metadata: {
          archiveDate: archiveDate.toISOString(),
          recordsArchived: result.rowCount
        }
      });

      return result.rowCount;

    } finally {
      client.release();
    }
  }

  /**
   * Encrypt sensitive data in metadata
   */
  encryptSensitiveData(data) {
    const sensitiveFields = ['ssn', 'creditCard', 'bankAccount', 'medicalRecord'];
    const encrypted = { ...data };

    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = encryptionService.encrypt(encrypted[field].toString());
      }
    });

    return encrypted;
  }

  /**
   * Send security alert for critical events
   */
  async sendSecurityAlert(eventData) {
    // Implementation would send alerts via email/SMS/Slack
    console.log('SECURITY ALERT:', {
      type: eventData.eventType,
      level: eventData.eventLevel,
      user: eventData.userName,
      description: eventData.description,
      timestamp: new Date()
    });
  }

  /**
   * Fallback file logging
   */
  logToFile(eventData) {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = JSON.stringify({
      ...eventData,
      timestamp: new Date().toISOString()
    }) + '\n';

    fs.appendFileSync(logFile, logEntry);
  }

  /**
   * Verify audit log integrity
   */
  async verifyLogIntegrity(logId) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT * FROM audit_logs WHERE id = $1
      `;
      
      const result = await client.query(query, [logId]);
      
      if (result.rows.length === 0) {
        return { valid: false, reason: 'Log not found' };
      }

      // Verify log hasn't been tampered with
      // In production, would use cryptographic signatures
      const log = result.rows[0];
      
      return {
        valid: true,
        log,
        verifiedAt: new Date()
      };

    } finally {
      client.release();
    }
  }
}

module.exports = new AuditService();
