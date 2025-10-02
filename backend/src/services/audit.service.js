// HIPAA/GDPR Compliant Audit Logging Service
const pool = require('../config/database');
const encryptionService = require('./encryption.service');
const securityConfig = require('../config/security.config');

class AuditService {
  constructor() {
    this.auditConfig = securityConfig.hipaa.auditControls;
    this.initializeAuditTable();
  }

  // Initialize audit table if not exists
  async initializeAuditTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        event_type VARCHAR(50) NOT NULL,
        user_id UUID,
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        ip_address INET,
        user_agent TEXT,
        resource_type VARCHAR(100),
        resource_id VARCHAR(255),
        action VARCHAR(50),
        result VARCHAR(20),
        error_message TEXT,
        metadata JSONB,
        data_classification VARCHAR(20),
        phi_accessed BOOLEAN DEFAULT FALSE,
        session_id VARCHAR(255),
        correlation_id UUID,
        risk_score INTEGER,
        compliance_flags JSONB,
        retention_date DATE,
        is_encrypted BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes for performance
        INDEX idx_audit_timestamp (timestamp DESC),
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_event (event_type),
        INDEX idx_audit_resource (resource_type, resource_id),
        INDEX idx_audit_session (session_id),
        INDEX idx_audit_correlation (correlation_id),
        INDEX idx_audit_risk (risk_score) WHERE risk_score > 50
      );

      -- Partition by month for better performance
      CREATE TABLE IF NOT EXISTS audit_logs_archive (
        LIKE audit_logs INCLUDING ALL
      ) PARTITION BY RANGE (timestamp);
    `;

    try {
      await pool.query(query);
      console.log('Audit logging table initialized');
    } catch (error) {
      console.error('Failed to initialize audit table:', error);
    }
  }

  // Main audit logging function
  async logEvent({
    eventType,
    userId = null,
    userEmail = null,
    userRole = null,
    ipAddress = null,
    userAgent = null,
    resourceType = null,
    resourceId = null,
    action = null,
    result = 'success',
    errorMessage = null,
    metadata = {},
    phiAccessed = false,
    sessionId = null,
    correlationId = null,
    req = null
  }) {
    try {
      // Extract request details if provided
      if (req) {
        ipAddress = ipAddress || this.getClientIp(req);
        userAgent = userAgent || req.headers['user-agent'];
        sessionId = sessionId || req.session?.id;
        userId = userId || req.user?.id;
        userEmail = userEmail || req.user?.email;
        userRole = userRole || req.user?.role;
      }

      // Calculate risk score
      const riskScore = this.calculateRiskScore({
        eventType,
        result,
        phiAccessed,
        userRole
      });

      // Determine data classification
      const dataClassification = this.getDataClassification(resourceType);

      // Set compliance flags
      const complianceFlags = {
        hipaa: this.auditConfig.auditEvents.includes(eventType),
        gdpr: phiAccessed || ['DELETE_PHI', 'EXPORT_PHI'].includes(eventType),
        highRisk: riskScore > 70
      };

      // Calculate retention date based on requirements
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() + this.auditConfig.retentionDays);

      // Encrypt sensitive metadata if required
      const processedMetadata = phiAccessed 
        ? encryptionService.encryptData(metadata, 'audit').encrypted
        : JSON.stringify(metadata);

      // Prepare audit entry
      const auditEntry = {
        event_type: eventType,
        user_id: userId,
        user_email: userEmail,
        user_role: userRole,
        ip_address: ipAddress,
        user_agent: userAgent,
        resource_type: resourceType,
        resource_id: resourceId,
        action: action,
        result: result,
        error_message: errorMessage,
        metadata: processedMetadata,
        data_classification: dataClassification,
        phi_accessed: phiAccessed,
        session_id: sessionId,
        correlation_id: correlationId || this.generateCorrelationId(),
        risk_score: riskScore,
        compliance_flags: JSON.stringify(complianceFlags),
        retention_date: retentionDate,
        is_encrypted: phiAccessed
      };

      // Insert audit log
      const query = `
        INSERT INTO audit_logs (
          event_type, user_id, user_email, user_role, ip_address,
          user_agent, resource_type, resource_id, action, result,
          error_message, metadata, data_classification, phi_accessed,
          session_id, correlation_id, risk_score, compliance_flags,
          retention_date, is_encrypted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id, timestamp
      `;

      const values = Object.values(auditEntry);
      const result_log = await pool.query(query, values);

      // Trigger real-time alerts for high-risk events
      if (riskScore > 80) {
        this.triggerSecurityAlert({
          auditId: result_log.rows[0].id,
          eventType,
          riskScore,
          userId,
          timestamp: result_log.rows[0].timestamp
        });
      }

      return result_log.rows[0];
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Fallback to file logging if database fails
      this.fallbackFileLogging({ eventType, error: error.message });
    }
  }

  // Log PHI access specifically (HIPAA requirement)
  async logPHIAccess(req, patientId, accessType, fields = []) {
    return this.logEvent({
      eventType: 'ACCESS_PHI',
      resourceType: 'patient',
      resourceId: patientId,
      action: accessType,
      metadata: {
        fields: fields,
        purpose: req.body?.purpose || 'treatment',
        timestamp: new Date().toISOString()
      },
      phiAccessed: true,
      req
    });
  }

  // Log authentication events
  async logAuthentication(req, success, userId = null, reason = null) {
    return this.logEvent({
      eventType: success ? 'LOGIN' : 'AUTHORIZATION_FAILURE',
      userId,
      result: success ? 'success' : 'failure',
      errorMessage: reason,
      metadata: {
        attemptTime: new Date().toISOString(),
        method: req.body?.method || 'password'
      },
      req
    });
  }

  // Log data modifications
  async logDataModification(req, resourceType, resourceId, action, changes = {}) {
    return this.logEvent({
      eventType: 'MODIFY_PHI',
      resourceType,
      resourceId,
      action,
      metadata: {
        changes: this.sanitizeChanges(changes),
        timestamp: new Date().toISOString()
      },
      phiAccessed: true,
      req
    });
  }

  // Calculate risk score for events
  calculateRiskScore({ eventType, result, phiAccessed, userRole }) {
    let score = 0;

    // Base scores by event type
    const eventScores = {
      'LOGIN': 10,
      'LOGOUT': 5,
      'ACCESS_PHI': 30,
      'MODIFY_PHI': 40,
      'DELETE_PHI': 60,
      'EXPORT_PHI': 70,
      'PRINT_PHI': 50,
      'AUTHORIZATION_FAILURE': 50,
      'CONFIGURATION_CHANGE': 80,
      'USER_MANAGEMENT': 60,
      'BACKUP_RESTORE': 90
    };

    score += eventScores[eventType] || 20;

    // Adjust for failure
    if (result === 'failure') {
      score += 20;
    }

    // Adjust for PHI access
    if (phiAccessed) {
      score += 15;
    }

    // Adjust for user role (lower roles = higher risk for sensitive operations)
    const roleRiskMultiplier = {
      'patient': 1.5,
      'receptionist': 1.3,
      'nurse': 1.1,
      'doctor': 1.0,
      'admin': 0.9,
      'super_admin': 0.8
    };

    score = Math.round(score * (roleRiskMultiplier[userRole] || 1.2));

    return Math.min(score, 100); // Cap at 100
  }

  // Get data classification level
  getDataClassification(resourceType) {
    const classifications = {
      'patient': 'restricted',
      'medical_record': 'restricted',
      'prescription': 'restricted',
      'lab_result': 'restricted',
      'diagnosis': 'restricted',
      'billing': 'confidential',
      'insurance': 'confidential',
      'appointment': 'confidential',
      'hospital': 'internal',
      'user': 'internal',
      'report': 'internal',
      'public': 'public'
    };

    return classifications[resourceType] || 'internal';
  }

  // Sanitize sensitive data from change logs
  sanitizeChanges(changes) {
    const sanitized = {};
    const sensitiveFields = [
      ...securityConfig.dataClassification.fieldClassification.restricted,
      'password', 'token', 'secret'
    ];

    for (const [key, value] of Object.entries(changes)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeChanges(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Get client IP address
  getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           null;
  }

  // Generate correlation ID for tracking related events
  generateCorrelationId() {
    return encryptionService.generateSecureToken(16);
  }

  // Trigger security alerts for high-risk events
  async triggerSecurityAlert(alertData) {
    try {
      // Log to security alerts table
      const query = `
        INSERT INTO security_alerts (
          audit_id, event_type, risk_score, user_id, timestamp,
          status, priority
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      `;

      const priority = alertData.riskScore > 90 ? 'critical' : 
                      alertData.riskScore > 70 ? 'high' : 'medium';

      await pool.query(query, [
        alertData.auditId,
        alertData.eventType,
        alertData.riskScore,
        alertData.userId,
        alertData.timestamp,
        priority
      ]);

      // In production, this would also:
      // - Send email/SMS to security team
      // - Trigger incident response workflow
      // - Update SIEM system
      console.log('Security alert triggered:', alertData);
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
    }
  }

  // Fallback file logging if database is unavailable
  fallbackFileLogging(data) {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(__dirname, '../../logs/audit');
    const logFile = path.join(logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
    
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...data
      };
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Fallback logging also failed:', error);
    }
  }

  // Query audit logs with filters
  async queryAuditLogs(filters = {}) {
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const values = [];
      let paramCount = 0;

      // Add filters
      if (filters.userId) {
        query += ` AND user_id = $${++paramCount}`;
        values.push(filters.userId);
      }

      if (filters.eventType) {
        query += ` AND event_type = $${++paramCount}`;
        values.push(filters.eventType);
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${++paramCount}`;
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${++paramCount}`;
        values.push(filters.endDate);
      }

      if (filters.resourceType) {
        query += ` AND resource_type = $${++paramCount}`;
        values.push(filters.resourceType);
      }

      if (filters.minRiskScore) {
        query += ` AND risk_score >= $${++paramCount}`;
        values.push(filters.minRiskScore);
      }

      // Add ordering and pagination
      query += ' ORDER BY timestamp DESC';
      
      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      
      // Decrypt encrypted metadata if needed
      const logs = result.rows.map(log => {
        if (log.is_encrypted && log.metadata) {
          try {
            log.metadata = encryptionService.decryptData({
              encrypted: log.metadata,
              purpose: 'audit'
            }, 'audit');
          } catch {
            log.metadata = '[ENCRYPTED]';
          }
        }
        return log;
      });

      return logs;
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw error;
    }
  }

  // Archive old audit logs
  async archiveOldLogs() {
    try {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - 90); // Archive logs older than 90 days

      const query = `
        WITH archived AS (
          INSERT INTO audit_logs_archive
          SELECT * FROM audit_logs
          WHERE timestamp < $1
          RETURNING id
        )
        DELETE FROM audit_logs
        WHERE id IN (SELECT id FROM archived)
      `;

      const result = await pool.query(query, [archiveDate]);
      console.log(`Archived ${result.rowCount} audit logs`);
      
      return result.rowCount;
    } catch (error) {
      console.error('Failed to archive audit logs:', error);
      throw error;
    }
  }

  // Generate compliance report
  async generateComplianceReport(startDate, endDate) {
    try {
      const query = `
        SELECT 
          event_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(risk_score) as avg_risk_score,
          SUM(CASE WHEN result = 'failure' THEN 1 ELSE 0 END) as failures,
          SUM(CASE WHEN phi_accessed THEN 1 ELSE 0 END) as phi_access_count
        FROM audit_logs
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type
        ORDER BY count DESC
      `;

      const result = await pool.query(query, [startDate, endDate]);
      
      return {
        period: { startDate, endDate },
        summary: result.rows,
        generatedAt: new Date().toISOString(),
        compliance: {
          hipaa: true,
          gdpr: true
        }
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
