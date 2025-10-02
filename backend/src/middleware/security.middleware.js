// Comprehensive Security Middleware for HIPAA/GDPR Compliance
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const pool = require('../config/database');
const securityConfig = require('../config/security.config');
const encryptionService = require('../services/encryption.service');
const auditService = require('../services/audit.service');

class SecurityMiddleware {
  constructor() {
    this.failedLoginAttempts = new Map();
    this.sessionTokens = new Map();
  }

  // Apply all security headers
  applySecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          scriptSrcAttr: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      originAgentCluster: true,
      referrerPolicy: { policy: "no-referrer" },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      xContentTypeOptions: true,
      xDnsPrefetchControl: true,
      xDownloadOptions: true,
      xFrameOptions: { action: 'SAMEORIGIN' },
      xPermittedCrossDomainPolicies: false,
      xXssProtection: false
    });
  }

  // Configure CORS with security
  configureCORS() {
    const corsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Token'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400 // 24 hours
    };

    return cors(corsOptions);
  }

  // Rate limiting configuration
  configureRateLimiting() {
    const limiters = {};

    // General rate limiter
    limiters.general = rateLimit({
      windowMs: securityConfig.rateLimiting.windowMs,
      max: securityConfig.rateLimiting.max,
      message: securityConfig.rateLimiting.message,
      standardHeaders: securityConfig.rateLimiting.standardHeaders,
      legacyHeaders: securityConfig.rateLimiting.legacyHeaders,
      handler: async (req, res) => {
        await auditService.logEvent({
          eventType: 'RATE_LIMIT_EXCEEDED',
          action: 'request',
          result: 'blocked',
          metadata: {
            endpoint: req.path,
            method: req.method
          },
          req
        });

        res.status(429).json({
          success: false,
          error: securityConfig.rateLimiting.message
        });
      }
    });

    // Specific endpoint limiters
    for (const [endpoint, config] of Object.entries(securityConfig.rateLimiting.endpoints)) {
      limiters[endpoint] = rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        skipSuccessfulRequests: config.skipSuccessfulRequests || false
      });
    }

    return limiters;
  }

  // Input validation and sanitization
  validateAndSanitizeInput() {
    return (req, res, next) => {
      // Sanitize body, params, and query
      this.sanitizeObject(req.body);
      this.sanitizeObject(req.params);
      this.sanitizeObject(req.query);

      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
        /(--|\/\*|\*\/|xp_|sp_|0x)/gi,
        /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
        /(\bAND\b\s*\d+\s*=\s*\d+)/gi
      ];

      const checkForSQLInjection = (value) => {
        if (typeof value === 'string') {
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        }
        return false;
      };

      const containsSQLInjection = 
        this.checkObjectForPattern(req.body, checkForSQLInjection) ||
        this.checkObjectForPattern(req.params, checkForSQLInjection) ||
        this.checkObjectForPattern(req.query, checkForSQLInjection);

      if (containsSQLInjection) {
        auditService.logEvent({
          eventType: 'SECURITY_THREAT',
          action: 'sql_injection_attempt',
          result: 'blocked',
          metadata: {
            endpoint: req.path,
            method: req.method
          },
          req
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid input detected'
        });
      }

      // Check for XSS patterns
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];

      const checkForXSS = (value) => {
        if (typeof value === 'string') {
          for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        }
        return false;
      };

      const containsXSS = 
        this.checkObjectForPattern(req.body, checkForXSS) ||
        this.checkObjectForPattern(req.params, checkForXSS) ||
        this.checkObjectForPattern(req.query, checkForXSS);

      if (containsXSS) {
        auditService.logEvent({
          eventType: 'SECURITY_THREAT',
          action: 'xss_attempt',
          result: 'blocked',
          metadata: {
            endpoint: req.path,
            method: req.method
          },
          req
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid input detected'
        });
      }

      next();
    };
  }

  // Sanitize object recursively
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any HTML tags
        obj[key] = obj[key].replace(/<[^>]*>/g, '');
        // Trim whitespace
        obj[key] = obj[key].trim();
        // Escape special characters
        obj[key] = this.escapeHtml(obj[key]);
      } else if (typeof obj[key] === 'object') {
        this.sanitizeObject(obj[key]);
      }
    }
  }

  // Check object for pattern recursively
  checkObjectForPattern(obj, checkFunction) {
    if (!obj || typeof obj !== 'object') return false;

    for (const key in obj) {
      if (checkFunction(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && this.checkObjectForPattern(obj[key], checkFunction)) {
        return true;
      }
    }
    return false;
  }

  // Escape HTML special characters
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Session security middleware
  sessionSecurity() {
    return async (req, res, next) => {
      // Check session timeout
      if (req.session && req.session.lastActivity) {
        const now = Date.now();
        const lastActivity = req.session.lastActivity;
        const timeout = securityConfig.hipaa.accessControl.sessionTimeout;

        if (now - lastActivity > timeout) {
          await auditService.logEvent({
            eventType: 'SESSION_TIMEOUT',
            userId: req.session.userId,
            action: 'logout',
            result: 'success',
            req
          });

          req.session.destroy();
          return res.status(401).json({
            success: false,
            error: 'Session expired',
            code: 'SESSION_TIMEOUT'
          });
        }
      }

      // Update last activity
      if (req.session) {
        req.session.lastActivity = Date.now();
      }

      // Check for session hijacking
      if (req.session && req.session.fingerprint) {
        const currentFingerprint = this.generateSessionFingerprint(req);
        if (currentFingerprint !== req.session.fingerprint) {
          await auditService.logEvent({
            eventType: 'SECURITY_THREAT',
            action: 'session_hijacking_attempt',
            userId: req.session.userId,
            result: 'blocked',
            metadata: {
              originalFingerprint: req.session.fingerprint,
              currentFingerprint
            },
            req
          });

          req.session.destroy();
          return res.status(401).json({
            success: false,
            error: 'Security violation detected',
            code: 'SESSION_SECURITY'
          });
        }
      }

      next();
    };
  }

  // Generate session fingerprint
  generateSessionFingerprint(req) {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.ip || req.connection.remoteAddress || ''
    ];
    
    return encryptionService.hashData(components.join('|'));
  }

  // Account lockout middleware
  accountLockout() {
    return async (req, res, next) => {
      if (req.path === '/api/auth/login' && req.method === 'POST') {
        const email = req.body.email;
        
        if (!email) {
          return next();
        }

        // Check if account is locked
        const lockoutKey = `lockout:${email}`;
        const lockoutData = this.failedLoginAttempts.get(lockoutKey);
        
        if (lockoutData && lockoutData.lockedUntil) {
          if (Date.now() < lockoutData.lockedUntil) {
            const remainingTime = Math.ceil((lockoutData.lockedUntil - Date.now()) / 1000 / 60);
            
            await auditService.logEvent({
              eventType: 'AUTHORIZATION_FAILURE',
              action: 'login',
              result: 'blocked',
              errorMessage: 'Account locked',
              metadata: {
                email,
                remainingTime
              },
              req
            });

            return res.status(423).json({
              success: false,
              error: `Account locked. Please try again in ${remainingTime} minutes.`,
              code: 'ACCOUNT_LOCKED'
            });
          } else {
            // Lockout expired, reset
            this.failedLoginAttempts.delete(lockoutKey);
          }
        }
      }
      
      next();
    };
  }

  // Track failed login attempt
  trackFailedLogin(email) {
    const lockoutKey = `lockout:${email}`;
    const data = this.failedLoginAttempts.get(lockoutKey) || { attempts: 0 };
    
    data.attempts++;
    data.lastAttempt = Date.now();
    
    if (data.attempts >= securityConfig.hipaa.accessControl.maxLoginAttempts) {
      data.lockedUntil = Date.now() + securityConfig.hipaa.accessControl.accountLockoutDuration;
      data.attempts = 0;
    }
    
    this.failedLoginAttempts.set(lockoutKey, data);
  }

  // Clear failed login attempts
  clearFailedLoginAttempts(email) {
    const lockoutKey = `lockout:${email}`;
    this.failedLoginAttempts.delete(lockoutKey);
  }

  // PHI access control middleware
  phiAccessControl() {
    return async (req, res, next) => {
      // Track PHI access for specific endpoints
      const phiEndpoints = [
        '/api/patients',
        '/api/medical-records',
        '/api/emr',
        '/api/prescriptions',
        '/api/lab-results'
      ];

      const isPhiEndpoint = phiEndpoints.some(endpoint => 
        req.path.startsWith(endpoint)
      );

      if (isPhiEndpoint) {
        // Log PHI access
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            await auditService.logPHIAccess(
              req,
              req.params.patientId || req.query.patientId,
              req.method,
              Object.keys(req.body || {})
            );
          }
        });

        // Add PHI handling headers
        res.setHeader('X-PHI-Access', 'true');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      }

      next();
    };
  }

  // Data encryption in transit
  encryptionInTransit() {
    return (req, res, next) => {
      // Force HTTPS in production
      if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }

      // Check TLS version
      const tlsVersion = req.connection.getCipher?.()?.version;
      if (tlsVersion && !['TLSv1.2', 'TLSv1.3'].includes(tlsVersion)) {
        return res.status(426).json({
          success: false,
          error: 'Upgrade to TLS 1.2 or higher required',
          code: 'TLS_VERSION'
        });
      }

      next();
    };
  }

  // Response encryption for sensitive data
  responseEncryption() {
    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = function(data) {
        // Check if response contains PHI/PII
        if (data && typeof data === 'object') {
          const sensitiveFields = [
            ...securityConfig.dataClassification.fieldClassification.restricted,
            ...securityConfig.dataClassification.fieldClassification.confidential
          ];

          const containsSensitiveData = this.checkObjectForSensitiveFields(data, sensitiveFields);
          
          if (containsSensitiveData && req.headers['x-encryption-key']) {
            // Encrypt response data
            const encrypted = encryptionService.encryptForTransmission(
              data,
              req.headers['x-encryption-key']
            );
            
            res.setHeader('X-Encrypted-Response', 'true');
            return originalJson.call(this, encrypted);
          }
        }
        
        return originalJson.call(this, data);
      }.bind(res);
      
      next();
    };
  }

  // Check for sensitive fields in object
  checkObjectForSensitiveFields(obj, fields) {
    if (!obj || typeof obj !== 'object') return false;

    for (const key in obj) {
      if (fields.includes(key)) {
        return true;
      }
      if (typeof obj[key] === 'object' && 
          this.checkObjectForSensitiveFields(obj[key], fields)) {
        return true;
      }
    }
    return false;
  }

  // Content type validation
  contentTypeValidation() {
    return (req, res, next) => {
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        
        if (!contentType || !contentType.includes('application/json')) {
          return res.status(415).json({
            success: false,
            error: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE'
          });
        }
      }
      
      next();
    };
  }

  // Apply all security middlewares
  applyAll(app) {
    // Security headers
    app.use(this.applySecurityHeaders());
    
    // CORS configuration
    app.use(this.configureCORS());
    
    // Rate limiting
    const limiters = this.configureRateLimiting();
    app.use(limiters.general);
    
    // Apply specific rate limiters
    for (const [endpoint, limiter] of Object.entries(limiters)) {
      if (endpoint !== 'general') {
        app.use(endpoint, limiter);
      }
    }
    
    // Input validation and sanitization
    app.use(this.validateAndSanitizeInput());
    
    // Session security
    app.use(this.sessionSecurity());
    
    // Account lockout
    app.use(this.accountLockout());
    
    // PHI access control
    app.use(this.phiAccessControl());
    
    // Encryption in transit
    app.use(this.encryptionInTransit());
    
    // Response encryption
    app.use(this.responseEncryption());
    
    // Content type validation
    app.use(this.contentTypeValidation());
    
    console.log('All security middlewares applied');
  }
}

module.exports = new SecurityMiddleware();
