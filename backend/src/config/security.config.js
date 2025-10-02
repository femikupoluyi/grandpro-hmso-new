// HIPAA/GDPR Compliant Security Configuration
const crypto = require('crypto');

module.exports = {
  // Encryption Configuration
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000,
    keyLength: 32,
    saltLength: 16,
    tagLength: 16,
    ivLength: 16
  },

  // HIPAA Compliance Settings
  hipaa: {
    // Access Controls (164.312(a)(1))
    accessControl: {
      sessionTimeout: 15 * 60 * 1000, // 15 minutes
      maxLoginAttempts: 5,
      accountLockoutDuration: 30 * 60 * 1000, // 30 minutes
      passwordMinLength: 12,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      passwordHistoryCount: 12, // Remember last 12 passwords
      passwordExpiryDays: 90,
      mfaRequired: true
    },

    // Audit Controls (164.312(b))
    auditControls: {
      enabled: true,
      logLevel: 'detailed',
      retentionDays: 2555, // 7 years as per HIPAA
      includePatientData: false, // Log references only, not actual PHI
      auditEvents: [
        'LOGIN',
        'LOGOUT',
        'ACCESS_PHI',
        'MODIFY_PHI',
        'DELETE_PHI',
        'EXPORT_PHI',
        'PRINT_PHI',
        'AUTHORIZATION_FAILURE',
        'CONFIGURATION_CHANGE',
        'USER_MANAGEMENT',
        'BACKUP_RESTORE'
      ]
    },

    // Integrity Controls (164.312(c)(1))
    integrityControls: {
      dataHashing: 'sha256',
      transmissionChecksum: true,
      digitalSignatures: true,
      tamperDetection: true
    },

    // Transmission Security (164.312(e)(1))
    transmissionSecurity: {
      tlsVersion: 'TLSv1.3',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ],
      forceHttps: true,
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // GDPR Compliance Settings
  gdpr: {
    // Data Protection
    dataProtection: {
      encryptionAtRest: true,
      encryptionInTransit: true,
      pseudonymization: true,
      anonymizationAfterDays: 365
    },

    // Consent Management
    consentManagement: {
      explicitConsent: true,
      granularConsent: true,
      withdrawalEnabled: true,
      consentAuditLog: true
    },

    // Data Subject Rights
    dataSubjectRights: {
      accessEnabled: true,
      rectificationEnabled: true,
      erasureEnabled: true,
      portabilityEnabled: true,
      restrictionEnabled: true,
      objectionEnabled: true
    },

    // Privacy by Design
    privacyByDesign: {
      dataMinimization: true,
      purposeLimitation: true,
      defaultPrivacy: true,
      endToEndEncryption: true
    },

    // Breach Notification
    breachNotification: {
      enabled: true,
      notificationTimeframe: 72, // hours
      autoNotifyDPA: true,
      autoNotifySubjects: true
    }
  },

  // Role-Based Access Control (RBAC)
  rbac: {
    roles: {
      super_admin: {
        level: 0,
        permissions: ['*'], // All permissions
        description: 'System administrator with full access'
      },
      admin: {
        level: 1,
        permissions: [
          'hospitals.*',
          'users.*',
          'reports.*',
          'analytics.*',
          'operations.*',
          'billing.*',
          'inventory.*'
        ],
        description: 'Administrator with hospital management access'
      },
      hospital_owner: {
        level: 2,
        permissions: [
          'hospitals.read',
          'hospitals.update:own',
          'contracts.*:own',
          'analytics.read:own',
          'billing.read:own',
          'staff.manage:own'
        ],
        description: 'Hospital owner with access to own hospital data'
      },
      doctor: {
        level: 3,
        permissions: [
          'patients.read',
          'patients.update',
          'emr.*',
          'prescriptions.*',
          'appointments.*',
          'telemedicine.*'
        ],
        description: 'Medical professional with patient care access'
      },
      nurse: {
        level: 4,
        permissions: [
          'patients.read',
          'patients.update:vitals',
          'emr.read',
          'emr.update:notes',
          'appointments.read',
          'inventory.request'
        ],
        description: 'Nursing staff with limited patient care access'
      },
      billing_clerk: {
        level: 5,
        permissions: [
          'billing.*',
          'insurance.*',
          'payments.*',
          'invoices.*',
          'claims.*'
        ],
        description: 'Billing staff with financial access'
      },
      inventory_manager: {
        level: 6,
        permissions: [
          'inventory.*',
          'suppliers.*',
          'orders.*',
          'stock.*'
        ],
        description: 'Inventory management staff'
      },
      receptionist: {
        level: 7,
        permissions: [
          'appointments.*',
          'patients.register',
          'patients.search',
          'queue.manage'
        ],
        description: 'Front desk staff'
      },
      patient: {
        level: 8,
        permissions: [
          'profile.read:own',
          'profile.update:own',
          'appointments.read:own',
          'appointments.book',
          'emr.read:own',
          'bills.read:own',
          'prescriptions.read:own'
        ],
        description: 'Patient with access to own medical records'
      }
    },

    // Permission Inheritance
    inheritance: {
      super_admin: [],
      admin: ['super_admin'],
      hospital_owner: ['admin'],
      doctor: [],
      nurse: [],
      billing_clerk: [],
      inventory_manager: [],
      receptionist: [],
      patient: []
    }
  },

  // Data Classification
  dataClassification: {
    levels: {
      public: {
        encryption: false,
        accessControl: 'none',
        auditLog: false
      },
      internal: {
        encryption: true,
        accessControl: 'authenticated',
        auditLog: true
      },
      confidential: {
        encryption: true,
        accessControl: 'role-based',
        auditLog: true
      },
      restricted: {
        encryption: true,
        accessControl: 'need-to-know',
        auditLog: true,
        additionalAuth: true
      }
    },
    
    // PHI/PII Field Classification
    fieldClassification: {
      // Restricted - Highest sensitivity
      restricted: [
        'ssn',
        'nationalId',
        'bankAccount',
        'creditCard',
        'medicalRecordNumber',
        'geneticData',
        'biometricData'
      ],
      // Confidential - High sensitivity
      confidential: [
        'name',
        'email',
        'phone',
        'address',
        'dateOfBirth',
        'diagnosis',
        'medications',
        'allergies',
        'testResults',
        'treatmentPlans'
      ],
      // Internal - Medium sensitivity
      internal: [
        'appointmentDates',
        'insuranceInfo',
        'employerInfo',
        'emergencyContact'
      ]
    }
  },

  // Security Headers
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12,
      yearly: 7
    },
    encryption: true,
    verification: true,
    testRestore: {
      enabled: true,
      frequency: 'weekly'
    }
  },

  // Session Management
  session: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    name: 'hmso_session',
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    },
    resave: false,
    saveUninitialized: false,
    rolling: true
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    
    // Specific endpoints
    endpoints: {
      '/api/auth/login': {
        windowMs: 15 * 60 * 1000,
        max: 5,
        skipSuccessfulRequests: true
      },
      '/api/auth/register': {
        windowMs: 60 * 60 * 1000,
        max: 3
      },
      '/api/auth/reset-password': {
        windowMs: 60 * 60 * 1000,
        max: 3
      }
    }
  }
};
