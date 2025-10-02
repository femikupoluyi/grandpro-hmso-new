/**
 * Security and Compliance Routes
 * Endpoints for security management, audit logs, and compliance tracking
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const backupService = require('../services/backup.service');
const { rbac, auditLog, encrypt, decrypt } = require('../middleware/security.middleware');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Initialize backup service
(async () => {
  try {
    await backupService.initialize();
  } catch (error) {
    console.error('Failed to initialize backup service:', error);
  }
})();

// =====================================================
// AUDIT LOG ROUTES
// =====================================================

// Get audit logs
router.get('/audit-logs', rbac(['ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate, userId, action, limit = 100 } = req.query;
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT * FROM audit_logs
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (startDate) {
        params.push(startDate);
        query += ` AND timestamp >= $${++paramCount}`;
      }
      
      if (endDate) {
        params.push(endDate);
        query += ` AND timestamp <= $${++paramCount}`;
      }
      
      if (userId) {
        params.push(userId);
        query += ` AND user_id = $${++paramCount}`;
      }
      
      if (action) {
        params.push(`%${action}%`);
        query += ` AND action ILIKE $${++paramCount}`;
      }
      
      query += ` ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`;
      
      const result = await client.query(query, params);
      
      res.json({
        success: true,
        logs: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get security events
router.get('/security-events', rbac(['ADMIN']), async (req, res) => {
  try {
    const { severity, resolved, limit = 50 } = req.query;
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT * FROM security_events
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (severity) {
        params.push(severity);
        query += ` AND severity = $${++paramCount}`;
      }
      
      if (resolved !== undefined) {
        params.push(resolved === 'true');
        query += ` AND resolved = $${++paramCount}`;
      }
      
      query += ` ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`;
      
      const result = await client.query(query, params);
      
      res.json({
        success: true,
        events: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve security event
router.put('/security-events/:eventId/resolve', rbac(['ADMIN']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE security_events
        SET 
          resolved = true,
          resolved_by = $1,
          resolved_at = NOW(),
          details = details || jsonb_build_object('resolution_notes', $2)
        WHERE event_id = $3
        RETURNING *
      `, [req.user.id, notes || '', eventId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Security event not found'
        });
      }
      
      res.json({
        success: true,
        event: result.rows[0],
        message: 'Security event resolved'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// ACCESS CONTROL ROUTES
// =====================================================

// Get role permissions
router.get('/permissions/:role', rbac(['ADMIN']), async (req, res) => {
  try {
    const { role } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM role_permissions
        WHERE role = $1
      `, [role]);
      
      res.json({
        success: true,
        permissions: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update role permissions
router.put('/permissions/:role', rbac(['ADMIN']), async (req, res) => {
  try {
    const { role } = req.params;
    const { resource, actions, conditions } = req.body;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO role_permissions (role, resource, actions, conditions)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (role, resource) 
        DO UPDATE SET 
          actions = $3,
          conditions = $4,
          updated_at = NOW()
        RETURNING *
      `, [role, resource, actions, conditions || {}]);
      
      res.json({
        success: true,
        permission: result.rows[0],
        message: 'Permissions updated'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// DATA PRIVACY ROUTES (GDPR)
// =====================================================

// Get patient consents
router.get('/consents/:patientId', rbac(['ADMIN', 'DOCTOR']), async (req, res) => {
  try {
    const { patientId } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM patient_consents
        WHERE patient_id = $1
        ORDER BY created_at DESC
      `, [patientId]);
      
      res.json({
        success: true,
        consents: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update patient consent
router.post('/consents', async (req, res) => {
  try {
    const { patientId, consentType, granted, purpose, dataCategories } = req.body;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO patient_consents (
          patient_id, consent_type, granted, 
          granted_date, purpose, data_categories
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        patientId,
        consentType,
        granted,
        granted ? new Date() : null,
        purpose,
        dataCategories || []
      ]);
      
      res.json({
        success: true,
        consent: result.rows[0],
        message: 'Consent recorded'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Data portability - export patient data (GDPR)
router.get('/export-data/:patientId', rbac(['ADMIN', 'PATIENT']), async (req, res) => {
  try {
    const { patientId } = req.params;
    const client = await pool.connect();
    
    try {
      // Collect all patient data
      const patientData = {};
      
      // Get patient info
      const patientResult = await client.query(
        'SELECT * FROM patients WHERE id = $1',
        [patientId]
      );
      patientData.personalInfo = patientResult.rows[0];
      
      // Get medical records
      const medicalResult = await client.query(
        'SELECT * FROM emr_records WHERE patient_id = $1',
        [patientId]
      );
      patientData.medicalRecords = medicalResult.rows;
      
      // Get appointments
      const appointmentResult = await client.query(
        'SELECT * FROM appointments WHERE patient_id = $1',
        [patientId]
      );
      patientData.appointments = appointmentResult.rows;
      
      // Log data export
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource, method,
          path, is_sensitive, timestamp
        ) VALUES ($1, 'data_export', $2, 'GET', '/export-data', true, NOW())
      `, [req.user.id, patientId]);
      
      res.json({
        success: true,
        data: patientData,
        exportDate: new Date(),
        message: 'Data exported successfully'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Right to be forgotten - anonymize patient data (GDPR)
router.post('/anonymize/:patientId', rbac(['ADMIN']), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { reason } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Anonymize patient data
      await client.query(`
        UPDATE patients
        SET 
          name = 'ANONYMIZED',
          email = CONCAT('anon_', id, '@example.com'),
          phone = '0000000000',
          address = 'REDACTED',
          is_anonymized = true
        WHERE id = $1
      `, [patientId]);
      
      // Log anonymization
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource, method,
          path, is_sensitive, timestamp
        ) VALUES ($1, 'data_anonymization', $2, 'POST', '/anonymize', true, NOW())
      `, [req.user.id, patientId]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Patient data anonymized',
        patientId,
        reason
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// BACKUP & RECOVERY ROUTES
// =====================================================

// Get backup status
router.get('/backups/status', rbac(['ADMIN']), async (req, res) => {
  try {
    const status = await backupService.getBackupStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger manual backup
router.post('/backups/create', rbac(['ADMIN']), async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    
    const result = await backupService.performBackup(type, req.user.id);
    
    res.json({
      success: true,
      ...result,
      message: `${type} backup created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restore from backup
router.post('/backups/restore/:backupId', rbac(['ADMIN']), async (req, res) => {
  try {
    const { backupId } = req.params;
    const { targetTimestamp } = req.body;
    
    const result = await backupService.restoreFromBackup(backupId, targetTimestamp);
    
    res.json({
      success: true,
      ...result,
      message: 'Restore initiated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test failover
router.post('/backups/test-failover', rbac(['ADMIN']), async (req, res) => {
  try {
    const result = await backupService.testFailover();
    
    res.json({
      success: true,
      ...result,
      message: 'Failover test completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// COMPLIANCE TRACKING ROUTES
// =====================================================

// Get HIPAA compliance status
router.get('/compliance/hipaa', rbac(['ADMIN']), async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          category,
          COUNT(*) as total_requirements,
          COUNT(CASE WHEN is_compliant THEN 1 END) as compliant_requirements,
          ROUND(COUNT(CASE WHEN is_compliant THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as compliance_percentage
        FROM hipaa_compliance
        GROUP BY category
      `);
      
      const overall = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_compliant THEN 1 END) as compliant,
          ROUND(COUNT(CASE WHEN is_compliant THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as percentage
        FROM hipaa_compliance
      `);
      
      res.json({
        success: true,
        categories: result.rows,
        overall: overall.rows[0],
        lastAssessment: new Date()
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get GDPR compliance status
router.get('/compliance/gdpr', rbac(['ADMIN']), async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          implementation_status,
          COUNT(*) as count,
          ARRAY_AGG(article) as articles
        FROM gdpr_compliance
        GROUP BY implementation_status
      `);
      
      res.json({
        success: true,
        status: result.rows,
        lastAssessment: new Date()
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update compliance status
router.put('/compliance/:type/:requirementId', rbac(['ADMIN']), async (req, res) => {
  try {
    const { type, requirementId } = req.params;
    const { isCompliant, evidence, notes } = req.body;
    const client = await pool.connect();
    
    try {
      const table = type === 'hipaa' ? 'hipaa_compliance' : 'gdpr_compliance';
      
      const result = await client.query(`
        UPDATE ${table}
        SET 
          is_compliant = $1,
          evidence = $2,
          notes = $3,
          last_reviewed = NOW(),
          reviewed_by = $4
        WHERE requirement_id = $5
        RETURNING *
      `, [isCompliant, evidence, notes, req.user.id, requirementId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Requirement not found'
        });
      }
      
      res.json({
        success: true,
        requirement: result.rows[0],
        message: 'Compliance status updated'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// ENCRYPTION MANAGEMENT ROUTES
// =====================================================

// Encrypt sensitive data
router.post('/encrypt', rbac(['ADMIN']), async (req, res) => {
  try {
    const { data, referenceType, referenceId, fieldName } = req.body;
    
    const encrypted = encrypt(JSON.stringify(data));
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO encrypted_data (
          reference_type, reference_id, field_name,
          encrypted_value, encryption_key_id
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING data_id
      `, [referenceType, referenceId, fieldName, encrypted, 'default']);
      
      res.json({
        success: true,
        dataId: result.rows[0].data_id,
        message: 'Data encrypted successfully'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Decrypt sensitive data
router.post('/decrypt/:dataId', rbac(['ADMIN']), async (req, res) => {
  try {
    const { dataId } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM encrypted_data
        WHERE data_id = $1
      `, [dataId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Encrypted data not found'
        });
      }
      
      const decrypted = decrypt(result.rows[0].encrypted_value);
      
      // Log decryption access
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource, is_sensitive
        ) VALUES ($1, 'data_decryption', $2, true)
      `, [req.user.id, dataId]);
      
      res.json({
        success: true,
        data: JSON.parse(decrypted),
        metadata: {
          referenceType: result.rows[0].reference_type,
          referenceId: result.rows[0].reference_id,
          fieldName: result.rows[0].field_name
        }
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
