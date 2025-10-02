/**
 * Authentication & Authorization Middleware
 * Implements security checks for all API endpoints
 */

const securityService = require('../services/securityService');

/**
 * Verify JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token provided'
            });
        }
        
        // Verify token
        const decoded = securityService.verifyToken(token);
        
        // Add user info to request
        req.user = {
            userId: decoded.userId,
            userRole: decoded.userRole,
            sessionId: decoded.sessionId,
            hospitalId: decoded.hospitalId
        };
        
        // Log successful authentication
        await securityService.auditLog({
            userId: decoded.userId,
            userRole: decoded.userRole,
            eventType: 'AUTHENTICATION',
            resourceType: 'API',
            resourceId: req.path,
            action: 'ACCESS',
            status: 'SUCCESS',
            clientIp: req.ip,
            userAgent: req.headers['user-agent'],
            sessionId: decoded.sessionId
        });
        
        next();
    } catch (error) {
        // Log failed authentication
        await securityService.auditLog({
            userId: 'UNKNOWN',
            eventType: 'AUTHENTICATION',
            resourceType: 'API',
            resourceId: req.path,
            action: 'ACCESS',
            status: 'FAILED',
            errorMessage: error.message,
            clientIp: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        if (error.message === 'Token expired') {
            return res.status(401).json({
                success: false,
                error: 'Authentication token expired'
            });
        }
        
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
};

/**
 * Check specific permission
 */
const authorize = (resource, action) => {
    return async (req, res, next) => {
        try {
            const { userId, userRole } = req.user;
            
            // Super admin bypass
            if (userRole === 'super_admin') {
                return next();
            }
            
            // Check permission
            const hasPermission = await securityService.checkPermission(
                userId,
                resource,
                action
            );
            
            if (!hasPermission) {
                // Log unauthorized access attempt
                await securityService.auditLog({
                    userId,
                    userRole,
                    eventType: 'AUTHORIZATION',
                    resourceType: resource,
                    resourceId: req.params.id || 'N/A',
                    action: action,
                    status: 'DENIED',
                    clientIp: req.ip,
                    sessionId: req.user.sessionId
                });
                
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }
            
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                success: false,
                error: 'Authorization check failed'
            });
        }
    };
};

/**
 * Check role-based access
 */
const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const { userRole } = req.user;
            
            if (!roles.includes(userRole)) {
                await securityService.auditLog({
                    userId: req.user.userId,
                    userRole,
                    eventType: 'AUTHORIZATION',
                    resourceType: 'ROLE_CHECK',
                    action: 'ACCESS',
                    status: 'DENIED',
                    metadata: { requiredRoles: roles },
                    clientIp: req.ip,
                    sessionId: req.user.sessionId
                });
                
                return res.status(403).json({
                    success: false,
                    error: 'Role not authorized for this action'
                });
            }
            
            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Role verification failed'
            });
        }
    };
};

/**
 * HIPAA compliance - log data access
 */
const hipaaCompliance = (dataCategory) => {
    return async (req, res, next) => {
        try {
            const { userId } = req.user;
            const patientId = req.params.patientId || req.body.patientId;
            
            // Log data access
            await securityService.logDataAccess({
                userId,
                patientId,
                dataCategory,
                accessType: req.method === 'GET' ? 'VIEW' : 'MODIFY',
                purpose: req.headers['x-purpose'] || 'TREATMENT',
                legalBasis: req.headers['x-legal-basis'] || 'LEGITIMATE_INTEREST',
                ipAddress: req.ip,
                deviceId: req.headers['x-device-id'],
                location: req.headers['x-location']
            });
            
            next();
        } catch (error) {
            console.error('HIPAA compliance logging error:', error);
            // Don't block request on logging failure
            next();
        }
    };
};

/**
 * GDPR compliance - check consent
 */
const gdprConsent = (consentType) => {
    return async (req, res, next) => {
        try {
            const patientId = req.params.patientId || req.body.patientId || req.user.userId;
            
            // Check if consent exists
            const query = `
                SELECT consent_status, consent_date, expiry_date
                FROM compliance.patient_consent
                WHERE patient_id = $1
                AND consent_type = $2
                AND consent_status = 'GRANTED'
                AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
                ORDER BY consent_date DESC
                LIMIT 1
            `;
            
            const db = require('../config/database');
            const result = await db.query(query, [patientId, consentType]);
            
            if (result.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Patient consent required for this operation',
                    consentType
                });
            }
            
            req.consent = result.rows[0];
            next();
        } catch (error) {
            console.error('GDPR consent check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Consent verification failed'
            });
        }
    };
};

/**
 * Rate limiting for security
 */
const rateLimit = (maxRequests = 100, windowMs = 60000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = `${req.user?.userId || req.ip}:${req.path}`;
        const now = Date.now();
        
        if (!requests.has(key)) {
            requests.set(key, []);
        }
        
        const userRequests = requests.get(key);
        const recentRequests = userRequests.filter(time => now - time < windowMs);
        
        if (recentRequests.length >= maxRequests) {
            securityService.auditLog({
                userId: req.user?.userId || 'UNKNOWN',
                eventType: 'RATE_LIMIT',
                resourceType: 'API',
                resourceId: req.path,
                action: 'BLOCKED',
                status: 'FAILED',
                clientIp: req.ip,
                metadata: { requests: recentRequests.length, limit: maxRequests }
            });
            
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please try again later.'
            });
        }
        
        recentRequests.push(now);
        requests.set(key, recentRequests);
        
        next();
    };
};

/**
 * Input validation and sanitization
 */
const validateInput = (schema) => {
    return (req, res, next) => {
        // Basic XSS prevention
        const sanitize = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    // Remove script tags and dangerous HTML
                    obj[key] = obj[key]
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitize(obj[key]);
                }
            }
            return obj;
        };
        
        req.body = sanitize(req.body);
        req.query = sanitize(req.query);
        req.params = sanitize(req.params);
        
        // SQL injection prevention (parameters are already parameterized in queries)
        // Additional validation can be added based on schema
        
        next();
    };
};

/**
 * Encrypt response data
 */
const encryptResponse = (fields = []) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            try {
                if (typeof data === 'object' && fields.length > 0) {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    
                    // Encrypt specified fields
                    for (const field of fields) {
                        if (parsed.data && parsed.data[field]) {
                            parsed.data[field] = securityService.encryptData(parsed.data[field]);
                        }
                    }
                    
                    data = JSON.stringify(parsed);
                }
            } catch (error) {
                console.error('Response encryption error:', error);
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

/**
 * Security headers
 */
const securityHeaders = (req, res, next) => {
    // OWASP recommended security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
};

module.exports = {
    authenticate,
    authorize,
    requireRole,
    hipaaCompliance,
    gdprConsent,
    rateLimit,
    validateInput,
    encryptResponse,
    securityHeaders
};
