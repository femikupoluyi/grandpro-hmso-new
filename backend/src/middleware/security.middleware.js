/**
 * Security Middleware
 * Implements comprehensive security measures for HIPAA/GDPR compliance
 */

const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt sensitive data
 */
function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}

/**
 * Audit logging middleware
 */
async function auditLog(req, res, next) {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.responseBody = data;
    originalSend.call(this, data);
  };
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const client = await pool.connect();
    
    try {
      // Determine if this is a sensitive operation
      const sensitiveRoutes = [
        '/api/emr',
        '/api/billing',
        '/api/insurance',
        '/api/patients',
        '/api/auth'
      ];
      
      const isSensitive = sensitiveRoutes.some(route => 
        req.originalUrl.startsWith(route)
      );
      
      // Log audit entry
      await client.query(`
        INSERT INTO audit_logs (
          user_id, user_email, user_role, action, resource_type, resource_id,
          ip_address, user_agent, request_method, request_path,
          response_status, details, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [
        req.user?.id || null,
        req.user?.email || 'anonymous',
        req.user?.role || 'guest',
        `${req.method} ${req.path}`,
        req.params.resource || 'general',
        req.params.id || null,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'],
        req.method,
        req.originalUrl,
        res.statusCode,
        JSON.stringify({
          body: isSensitive ? '[REDACTED]' : req.body,
          duration_ms: duration,
          is_sensitive: isSensitive
        })
      ]);
      
      // Log security events
      if (res.statusCode === 401 || res.statusCode === 403) {
        await client.query(`
          INSERT INTO security_events (
            event_type, user_id, ip_address, path,
            details, severity, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          res.statusCode === 401 ? 'unauthorized_access' : 'forbidden_access',
          req.user?.id || 'anonymous',
          req.ip,
          req.originalUrl,
          JSON.stringify({ method: req.method, statusCode: res.statusCode }),
          'medium'
        ]);
      }
      
    } catch (error) {
      console.error('Audit logging failed:', error);
    } finally {
      client.release();
    }
  });
  
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware
 */
function rbac(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      // Check if user has required role
      if (allowedRoles.length > 0) {
        const hasRole = allowedRoles.some(role => 
          req.user.role === role || req.user.roles?.includes(role)
        );
        
        if (!hasRole) {
          // Log unauthorized access attempt
          const client = await pool.connect();
          try {
            await client.query(`
              INSERT INTO security_events (
                event_type, user_id, ip_address, path,
                details, severity, timestamp
              ) VALUES ('insufficient_privileges', $1, $2, $3, $4, 'high', NOW())
            `, [
              req.user.id,
              req.ip,
              req.originalUrl,
              JSON.stringify({ 
                requiredRoles: allowedRoles, 
                userRole: req.user.role 
              })
            ]);
          } catch (error) {
            console.error('Failed to log security event:', error);
          } finally {
            client.release();
          }
          
          return res.status(403).json({
            success: false,
            error: 'Insufficient privileges'
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('RBAC error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
}

/**
 * Data masking for sensitive information
 */
function maskSensitiveData(data, fields = []) {
  if (!data) return data;
  
  const defaultSensitiveFields = [
    'ssn', 'socialSecurityNumber',
    'creditCard', 'cardNumber',
    'bankAccount', 'accountNumber',
    'password', 'pin',
    'dateOfBirth', 'dob',
    'medicalRecordNumber', 'mrn'
  ];
  
  const sensitiveFields = [...defaultSensitiveFields, ...fields];
  
  const mask = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => mask(item));
    }
    
    if (obj && typeof obj === 'object') {
      const masked = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          // Mask the value
          if (typeof value === 'string' && value.length > 4) {
            masked[key] = '****' + value.slice(-4);
          } else {
            masked[key] = '****';
          }
        } else if (typeof value === 'object') {
          masked[key] = mask(value);
        } else {
          masked[key] = value;
        }
      }
      
      return masked;
    }
    
    return obj;
  };
  
  return mask(data);
}

/**
 * Rate limiting configuration
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res) => {
      // Log rate limit violation
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO security_events (
            event_type, user_id, ip_address, path,
            details, severity, timestamp
          ) VALUES ('rate_limit_exceeded', $1, $2, $3, $4, 'medium', NOW())
        `, [
          req.user?.id || 'anonymous',
          req.ip,
          req.originalUrl,
          JSON.stringify({ windowMs, max })
        ]);
      } catch (error) {
        console.error('Failed to log rate limit event:', error);
      } finally {
        client.release();
      }
      
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }
  });
};

/**
 * API rate limiters for different endpoints
 */
const rateLimiters = {
  general: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  auth: createRateLimiter(15 * 60 * 1000, 5),      // 5 auth attempts per 15 minutes
  sensitive: createRateLimiter(15 * 60 * 1000, 20), // 20 requests per 15 minutes
  export: createRateLimiter(60 * 60 * 1000, 10)    // 10 exports per hour
};

/**
 * Security headers middleware using Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Input validation and sanitization
 */
function sanitizeInput(req, res, next) {
  // Sanitize common injection patterns
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove SQL injection patterns
      obj = obj.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi, '');
      // Remove script tags
      obj = obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Remove HTML tags
      obj = obj.replace(/<[^>]*>/g, '');
    } else if (Array.isArray(obj)) {
      obj = obj.map(item => sanitize(item));
    } else if (obj && typeof obj === 'object') {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
}

/**
 * Session timeout middleware
 */
function sessionTimeout(timeoutMinutes = 30) {
  return (req, res, next) => {
    if (req.session) {
      const now = Date.now();
      const timeout = timeoutMinutes * 60 * 1000;
      
      if (req.session.lastActivity && (now - req.session.lastActivity) > timeout) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        
        return res.status(401).json({
          success: false,
          error: 'Session expired',
          code: 'SESSION_TIMEOUT'
        });
      }
      
      req.session.lastActivity = now;
    }
    
    next();
  };
}

/**
 * Data retention and anonymization
 */
async function enforceDataRetention() {
  const client = await pool.connect();
  
  try {
    // Anonymize old patient data (older than retention period)
    const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '2555'); // 7 years default
    
    await client.query(`
      UPDATE patients
      SET 
        name = 'ANONYMIZED',
        email = CONCAT('anon_', id, '@example.com'),
        phone = '0000000000',
        address = 'REDACTED'
      WHERE 
        created_at < NOW() - INTERVAL '${retentionDays} days'
        AND is_anonymized = false
    `);
    
    // Delete old audit logs
    const auditRetentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '365');
    
    await client.query(`
      DELETE FROM audit_logs
      WHERE timestamp < NOW() - INTERVAL '${auditRetentionDays} days'
    `);
    
    console.log('Data retention policy enforced');
    
  } catch (error) {
    console.error('Data retention enforcement failed:', error);
  } finally {
    client.release();
  }
}

// Schedule data retention enforcement daily
setInterval(enforceDataRetention, 24 * 60 * 60 * 1000);

module.exports = {
  encrypt,
  decrypt,
  auditLog,
  rbac,
  maskSensitiveData,
  rateLimiters,
  securityHeaders,
  sanitizeInput,
  sessionTimeout,
  enforceDataRetention
};
