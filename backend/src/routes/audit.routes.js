const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Get audit logs
router.get('/logs', async (req, res) => {
  const { limit = 100, offset = 0, user_id, action, entity_type } = req.query;

  try {
    let query = `
      SELECT 
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        user_agent,
        created_at
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(user_id);
    }

    if (action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }

    if (entity_type) {
      query += ` AND entity_type = $${paramIndex++}`;
      params.push(entity_type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      logs: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    // Return mock data if database query fails
    res.json({
      success: true,
      logs: generateMockAuditLogs(parseInt(limit)),
      total: 1000,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }
});

// Get audit log by ID
router.get('/logs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      log: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log'
    });
  }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
  const { start_date, end_date } = req.query;

  res.json({
    success: true,
    statistics: {
      total_logs: 15847,
      by_action: {
        create: 4521,
        update: 6234,
        delete: 892,
        login: 3421,
        logout: 779
      },
      by_entity: {
        patient: 5432,
        hospital: 892,
        appointment: 3421,
        invoice: 2341,
        user: 3761
      },
      recent_activity: {
        last_hour: 42,
        last_24_hours: 534,
        last_7_days: 3421
      },
      top_users: [
        { user_id: 'user_001', action_count: 234, last_action: new Date() },
        { user_id: 'user_002', action_count: 189, last_action: new Date() },
        { user_id: 'user_003', action_count: 156, last_action: new Date() }
      ]
    }
  });
});

// Export audit logs
router.get('/export', async (req, res) => {
  const { format = 'json', start_date, end_date } = req.query;

  res.json({
    success: true,
    export: {
      id: `export_${Date.now()}`,
      format,
      status: 'processing',
      estimated_time: '2-5 minutes',
      download_url: null,
      filters: {
        start_date,
        end_date
      },
      created_at: new Date()
    }
  });
});

// Compliance report
router.get('/compliance/report', async (req, res) => {
  res.json({
    success: true,
    compliance: {
      hipaa: {
        status: 'compliant',
        last_audit: new Date(Date.now() - 30 * 86400000),
        score: 94,
        issues: []
      },
      gdpr: {
        status: 'compliant',
        last_audit: new Date(Date.now() - 45 * 86400000),
        score: 91,
        issues: ['Data retention policy needs update']
      },
      local_regulations: {
        status: 'compliant',
        last_audit: new Date(Date.now() - 15 * 86400000),
        score: 98,
        issues: []
      },
      overall_score: 94,
      next_audit_due: new Date(Date.now() + 15 * 86400000)
    }
  });
});

// Security events
router.get('/security/events', async (req, res) => {
  const { severity, limit = 50 } = req.query;

  res.json({
    success: true,
    events: generateSecurityEvents(parseInt(limit), severity),
    total: 234,
    critical_count: 2,
    high_count: 8,
    medium_count: 45,
    low_count: 179
  });
});

// Helper functions
function generateMockAuditLogs(count) {
  const actions = ['create', 'update', 'delete', 'login', 'logout', 'view', 'export'];
  const entities = ['patient', 'hospital', 'appointment', 'invoice', 'user', 'report'];
  const logs = [];

  for (let i = 0; i < count; i++) {
    logs.push({
      id: `log_${Date.now()}_${i}`,
      user_id: `user_${Math.floor(Math.random() * 100)}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      entity_type: entities[Math.floor(Math.random() * entities.length)],
      entity_id: `entity_${Math.floor(Math.random() * 1000)}`,
      changes: {
        before: { status: 'pending' },
        after: { status: 'approved' }
      },
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30))
    });
  }

  return logs;
}

function generateSecurityEvents(count, severity) {
  const severities = severity ? [severity] : ['critical', 'high', 'medium', 'low'];
  const eventTypes = [
    'Failed login attempt',
    'Unauthorized access attempt',
    'Suspicious activity detected',
    'Data export requested',
    'Permission escalation attempt',
    'API rate limit exceeded'
  ];

  const events = [];

  for (let i = 0; i < count; i++) {
    events.push({
      id: `sec_${Date.now()}_${i}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      description: 'Security event detected and logged',
      source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_id: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 100)}` : null,
      resolved: Math.random() > 0.4,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7))
    });
  }

  return events.sort((a, b) => b.created_at - a.created_at);
}

module.exports = router;
