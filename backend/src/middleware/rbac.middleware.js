// Role-Based Access Control (RBAC) Middleware
const securityConfig = require('../config/security.config');
const auditService = require('../services/audit.service');

class RBACMiddleware {
  constructor() {
    this.roles = securityConfig.rbac.roles;
    this.inheritance = securityConfig.rbac.inheritance;
  }

  // Check if user has required permission
  hasPermission(userRole, requiredPermission, context = {}) {
    if (!userRole || !this.roles[userRole]) {
      return false;
    }

    const role = this.roles[userRole];
    
    // Check for wildcard permission (super admin)
    if (role.permissions.includes('*')) {
      return true;
    }

    // Check direct permissions
    if (this.checkPermissionPattern(role.permissions, requiredPermission, context)) {
      return true;
    }

    // Check inherited permissions
    const inheritedRoles = this.inheritance[userRole] || [];
    for (const inheritedRole of inheritedRoles) {
      if (this.hasPermission(inheritedRole, requiredPermission, context)) {
        return true;
      }
    }

    return false;
  }

  // Check permission pattern with wildcards and ownership
  checkPermissionPattern(permissions, requiredPermission, context) {
    for (const permission of permissions) {
      // Parse permission string
      const [permissionPattern, ownershipRule] = permission.split(':');
      
      // Check if permission matches pattern
      if (this.matchesPattern(permissionPattern, requiredPermission)) {
        // Check ownership rule if present
        if (ownershipRule) {
          if (ownershipRule === 'own' && context.ownerId !== context.userId) {
            continue; // Skip this permission if not owner
          }
          // Add more ownership rules as needed
        }
        return true;
      }
    }
    return false;
  }

  // Match permission pattern with wildcards
  matchesPattern(pattern, permission) {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(permission);
  }

  // Main middleware function
  requirePermission(requiredPermission, options = {}) {
    return async (req, res, next) => {
      try {
        // Get user from request
        const user = req.user;
        
        if (!user) {
          await auditService.logEvent({
            eventType: 'AUTHORIZATION_FAILURE',
            action: requiredPermission,
            result: 'failure',
            errorMessage: 'No user authenticated',
            req
          });
          
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Build context for permission check
        const context = {
          userId: user.id,
          userRole: user.role,
          ownerId: null,
          resourceType: options.resourceType,
          resourceId: null
        };

        // Get resource ownership if needed
        if (options.checkOwnership) {
          context.ownerId = await this.getResourceOwner(
            options.resourceType,
            req.params[options.resourceIdParam || 'id']
          );
          context.resourceId = req.params[options.resourceIdParam || 'id'];
        }

        // Check permission
        const hasPermission = this.hasPermission(
          user.role,
          requiredPermission,
          context
        );

        if (!hasPermission) {
          await auditService.logEvent({
            eventType: 'AUTHORIZATION_FAILURE',
            userId: user.id,
            userRole: user.role,
            action: requiredPermission,
            resourceType: options.resourceType,
            resourceId: context.resourceId,
            result: 'failure',
            errorMessage: 'Insufficient permissions',
            req
          });

          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            required: requiredPermission
          });
        }

        // Log successful authorization for sensitive operations
        if (options.logSuccess) {
          await auditService.logEvent({
            eventType: 'AUTHORIZATION_SUCCESS',
            userId: user.id,
            userRole: user.role,
            action: requiredPermission,
            resourceType: options.resourceType,
            resourceId: context.resourceId,
            result: 'success',
            req
          });
        }

        // Add permission context to request
        req.rbacContext = context;
        next();
      } catch (error) {
        console.error('RBAC middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Authorization check failed'
        });
      }
    };
  }

  // Check multiple permissions (OR logic)
  requireAnyPermission(permissions, options = {}) {
    return async (req, res, next) => {
      for (const permission of permissions) {
        const middleware = this.requirePermission(permission, options);
        const mockRes = {
          status: () => ({ json: () => {} })
        };
        
        let passed = false;
        await middleware(req, mockRes, () => { passed = true; });
        
        if (passed) {
          return next();
        }
      }

      // None of the permissions matched
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: `Any of: ${permissions.join(', ')}`
      });
    };
  }

  // Check multiple permissions (AND logic)
  requireAllPermissions(permissions, options = {}) {
    return async (req, res, next) => {
      for (const permission of permissions) {
        const middleware = this.requirePermission(permission, options);
        let passed = false;
        
        await middleware(req, res, () => { passed = true; });
        
        if (!passed) {
          return; // Response already sent by middleware
        }
      }
      
      next();
    };
  }

  // Role-based route protection
  requireRole(roles, options = {}) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return async (req, res, next) => {
      try {
        const user = req.user;
        
        if (!user) {
          await auditService.logEvent({
            eventType: 'AUTHORIZATION_FAILURE',
            action: `role:${allowedRoles.join(',')}`,
            result: 'failure',
            errorMessage: 'No user authenticated',
            req
          });
          
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        if (!allowedRoles.includes(user.role)) {
          await auditService.logEvent({
            eventType: 'AUTHORIZATION_FAILURE',
            userId: user.id,
            userRole: user.role,
            action: `role:${allowedRoles.join(',')}`,
            result: 'failure',
            errorMessage: `Role not allowed: ${user.role}`,
            req
          });

          return res.status(403).json({
            success: false,
            error: 'Access denied for your role',
            required: allowedRoles,
            current: user.role
          });
        }

        if (options.logSuccess) {
          await auditService.logEvent({
            eventType: 'AUTHORIZATION_SUCCESS',
            userId: user.id,
            userRole: user.role,
            action: `role:${allowedRoles.join(',')}`,
            result: 'success',
            req
          });
        }

        next();
      } catch (error) {
        console.error('Role check error:', error);
        res.status(500).json({
          success: false,
          error: 'Role verification failed'
        });
      }
    };
  }

  // Get resource owner for ownership checks
  async getResourceOwner(resourceType, resourceId) {
    const pool = require('../config/database');
    
    try {
      let query;
      let values = [resourceId];
      
      switch (resourceType) {
        case 'hospital':
          query = 'SELECT owner_id as owner FROM hospitals WHERE id = $1';
          break;
        case 'patient':
          query = 'SELECT user_id as owner FROM patients WHERE id = $1';
          break;
        case 'appointment':
          query = 'SELECT patient_id as owner FROM appointments WHERE id = $1';
          break;
        case 'medical_record':
          query = 'SELECT patient_id as owner FROM medical_records WHERE id = $1';
          break;
        case 'contract':
          query = 'SELECT owner_id as owner FROM contracts WHERE id = $1';
          break;
        default:
          return null;
      }

      const result = await pool.query(query, values);
      return result.rows[0]?.owner || null;
    } catch (error) {
      console.error('Failed to get resource owner:', error);
      return null;
    }
  }

  // Data filtering based on role
  filterDataByRole(data, userRole, userId) {
    const role = this.roles[userRole];
    
    if (!role) {
      return null;
    }

    // Super admin sees everything
    if (role.permissions.includes('*')) {
      return data;
    }

    // Filter sensitive fields based on role
    const sensitiveFields = {
      patient: ['ssn', 'nationalId', 'bankAccount'],
      doctor: ['salary', 'performance_score'],
      hospital: ['revenue', 'profit_margin'],
      billing: ['payment_details', 'card_number']
    };

    // Remove fields the role shouldn't see
    const filteredData = { ...data };
    
    Object.keys(sensitiveFields).forEach(category => {
      if (!this.hasPermission(userRole, `${category}.read.sensitive`)) {
        sensitiveFields[category].forEach(field => {
          if (filteredData[field] !== undefined) {
            filteredData[field] = '[REDACTED]';
          }
        });
      }
    });

    return filteredData;
  }

  // Dynamic permission generation
  generateDynamicPermissions(user, resource) {
    const permissions = [];
    const basePermissions = this.roles[user.role]?.permissions || [];

    // Add time-based permissions
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      permissions.push('business_hours.*');
    }

    // Add location-based permissions (if implemented)
    if (user.location === resource.location) {
      permissions.push('same_location.*');
    }

    // Add delegation permissions
    if (user.delegatedPermissions) {
      permissions.push(...user.delegatedPermissions);
    }

    return [...basePermissions, ...permissions];
  }

  // Permission delegation
  async delegatePermission(fromUserId, toUserId, permission, duration) {
    const pool = require('../config/database');
    
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      const query = `
        INSERT INTO permission_delegations 
        (from_user_id, to_user_id, permission, expires_at, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `;

      const result = await pool.query(query, [
        fromUserId,
        toUserId,
        permission,
        expiresAt
      ]);

      await auditService.logEvent({
        eventType: 'PERMISSION_DELEGATION',
        userId: fromUserId,
        action: 'delegate',
        metadata: {
          toUserId,
          permission,
          duration,
          delegationId: result.rows[0].id
        }
      });

      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to delegate permission:', error);
      throw error;
    }
  }
}

module.exports = new RBACMiddleware();
