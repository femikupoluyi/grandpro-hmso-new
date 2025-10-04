/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for all user types in the system
 */

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HOSPITAL_OWNER: 'HOSPITAL_OWNER',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
  RECEPTIONIST: 'RECEPTIONIST',
  BILLING_CLERK: 'BILLING_CLERK',
  PATIENT: 'PATIENT',
  VIEWER: 'VIEWER'
};

const PERMISSIONS = {
  // System Administration
  MANAGE_SYSTEM: 'manage:system',
  VIEW_SYSTEM_LOGS: 'view:system_logs',
  MANAGE_USERS: 'manage:users',
  MANAGE_ROLES: 'manage:roles',
  
  // Hospital Management
  MANAGE_HOSPITAL: 'manage:hospital',
  VIEW_HOSPITAL: 'view:hospital',
  EDIT_HOSPITAL_SETTINGS: 'edit:hospital_settings',
  
  // Patient Management
  CREATE_PATIENT: 'create:patient',
  VIEW_ALL_PATIENTS: 'view:all_patients',
  VIEW_OWN_PATIENT: 'view:own_patient',
  EDIT_PATIENT: 'edit:patient',
  DELETE_PATIENT: 'delete:patient',
  
  // Medical Records
  CREATE_MEDICAL_RECORD: 'create:medical_record',
  VIEW_ALL_MEDICAL_RECORDS: 'view:all_medical_records',
  VIEW_OWN_MEDICAL_RECORDS: 'view:own_medical_records',
  EDIT_MEDICAL_RECORD: 'edit:medical_record',
  DELETE_MEDICAL_RECORD: 'delete:medical_record',
  
  // Prescriptions
  CREATE_PRESCRIPTION: 'create:prescription',
  VIEW_PRESCRIPTIONS: 'view:prescriptions',
  APPROVE_PRESCRIPTION: 'approve:prescription',
  DISPENSE_MEDICATION: 'dispense:medication',
  
  // Appointments
  CREATE_APPOINTMENT: 'create:appointment',
  VIEW_ALL_APPOINTMENTS: 'view:all_appointments',
  VIEW_OWN_APPOINTMENTS: 'view:own_appointments',
  EDIT_APPOINTMENT: 'edit:appointment',
  CANCEL_APPOINTMENT: 'cancel:appointment',
  
  // Billing & Finance
  CREATE_INVOICE: 'create:invoice',
  VIEW_ALL_INVOICES: 'view:all_invoices',
  VIEW_OWN_INVOICES: 'view:own_invoices',
  PROCESS_PAYMENT: 'process:payment',
  VIEW_FINANCIAL_REPORTS: 'view:financial_reports',
  MANAGE_INSURANCE_CLAIMS: 'manage:insurance_claims',
  
  // Inventory
  MANAGE_INVENTORY: 'manage:inventory',
  VIEW_INVENTORY: 'view:inventory',
  ORDER_SUPPLIES: 'order:supplies',
  
  // Staff Management
  MANAGE_STAFF: 'manage:staff',
  VIEW_STAFF: 'view:staff',
  MANAGE_SCHEDULES: 'manage:schedules',
  VIEW_OWN_SCHEDULE: 'view:own_schedule',
  
  // Analytics & Reports
  VIEW_ANALYTICS: 'view:analytics',
  GENERATE_REPORTS: 'generate:reports',
  VIEW_DASHBOARD: 'view:dashboard',
  
  // Operations
  ACCESS_COMMAND_CENTER: 'access:command_center',
  MANAGE_ALERTS: 'manage:alerts',
  VIEW_OPERATIONS: 'view:operations',
  
  // Data Lake & ML
  ACCESS_DATA_LAKE: 'access:data_lake',
  RUN_ETL_PIPELINES: 'run:etl_pipelines',
  VIEW_PREDICTIONS: 'view:predictions',
  MANAGE_ML_MODELS: 'manage:ml_models',
  
  // Audit & Compliance
  VIEW_AUDIT_LOGS: 'view:audit_logs',
  EXPORT_DATA: 'export:data',
  MANAGE_COMPLIANCE: 'manage:compliance',
  
  // Communication
  SEND_NOTIFICATIONS: 'send:notifications',
  VIEW_COMMUNICATIONS: 'view:communications',
  
  // Telemedicine
  CONDUCT_CONSULTATION: 'conduct:consultation',
  SCHEDULE_TELEMEDICINE: 'schedule:telemedicine',
  VIEW_TELEMEDICINE_SESSIONS: 'view:telemedicine_sessions'
};

// Role-Permission Mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_HOSPITAL,
    PERMISSIONS.VIEW_HOSPITAL,
    PERMISSIONS.EDIT_HOSPITAL_SETTINGS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_PATIENTS,
    PERMISSIONS.VIEW_ALL_MEDICAL_RECORDS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_INVOICES,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.ACCESS_COMMAND_CENTER,
    PERMISSIONS.MANAGE_ALERTS,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.ACCESS_DATA_LAKE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_COMPLIANCE
  ],
  
  [ROLES.HOSPITAL_OWNER]: [
    PERMISSIONS.VIEW_HOSPITAL,
    PERMISSIONS.EDIT_HOSPITAL_SETTINGS,
    PERMISSIONS.VIEW_ALL_PATIENTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_AUDIT_LOGS
  ],
  
  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_ALL_PATIENTS,
    PERMISSIONS.CREATE_PATIENT,
    PERMISSIONS.EDIT_PATIENT,
    PERMISSIONS.CREATE_MEDICAL_RECORD,
    PERMISSIONS.VIEW_ALL_MEDICAL_RECORDS,
    PERMISSIONS.EDIT_MEDICAL_RECORD,
    PERMISSIONS.CREATE_PRESCRIPTION,
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENT,
    PERMISSIONS.EDIT_APPOINTMENT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.CONDUCT_CONSULTATION,
    PERMISSIONS.SCHEDULE_TELEMEDICINE,
    PERMISSIONS.VIEW_TELEMEDICINE_SESSIONS,
    PERMISSIONS.VIEW_PREDICTIONS
  ],
  
  [ROLES.NURSE]: [
    PERMISSIONS.VIEW_ALL_PATIENTS,
    PERMISSIONS.EDIT_PATIENT,
    PERMISSIONS.VIEW_ALL_MEDICAL_RECORDS,
    PERMISSIONS.CREATE_MEDICAL_RECORD,
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.VIEW_INVENTORY
  ],
  
  [ROLES.PHARMACIST]: [
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.APPROVE_PRESCRIPTION,
    PERMISSIONS.DISPENSE_MEDICATION,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.ORDER_SUPPLIES,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_OWN_SCHEDULE
  ],
  
  [ROLES.LAB_TECH]: [
    PERMISSIONS.VIEW_ALL_PATIENTS,
    PERMISSIONS.CREATE_MEDICAL_RECORD,
    PERMISSIONS.VIEW_ALL_MEDICAL_RECORDS,
    PERMISSIONS.EDIT_MEDICAL_RECORD,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_OWN_SCHEDULE
  ],
  
  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.CREATE_PATIENT,
    PERMISSIONS.VIEW_ALL_PATIENTS,
    PERMISSIONS.EDIT_PATIENT,
    PERMISSIONS.CREATE_APPOINTMENT,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENT,
    PERMISSIONS.CANCEL_APPOINTMENT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.SEND_NOTIFICATIONS
  ],
  
  [ROLES.BILLING_CLERK]: [
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_ALL_INVOICES,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_INSURANCE_CLAIMS,
    PERMISSIONS.VIEW_DASHBOARD
  ],
  
  [ROLES.PATIENT]: [
    PERMISSIONS.VIEW_OWN_PATIENT,
    PERMISSIONS.VIEW_OWN_MEDICAL_RECORDS,
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENT,
    PERMISSIONS.CANCEL_APPOINTMENT,
    PERMISSIONS.VIEW_OWN_INVOICES,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.VIEW_COMMUNICATIONS
  ],
  
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS
  ]
};

// Resource-based permissions
const RESOURCE_PERMISSIONS = {
  patient: {
    create: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
    read: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
    update: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE],
    delete: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  },
  medical_record: {
    create: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.LAB_TECH],
    read: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE],
    update: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR],
    delete: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  },
  prescription: {
    create: [ROLES.DOCTOR],
    read: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST],
    update: [ROLES.DOCTOR, ROLES.PHARMACIST],
    delete: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  },
  invoice: {
    create: [ROLES.BILLING_CLERK, ROLES.ADMIN],
    read: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BILLING_CLERK, ROLES.HOSPITAL_OWNER],
    update: [ROLES.BILLING_CLERK, ROLES.ADMIN],
    delete: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  },
  analytics: {
    create: [ROLES.SUPER_ADMIN],
    read: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOSPITAL_OWNER, ROLES.DOCTOR],
    update: [ROLES.SUPER_ADMIN],
    delete: [ROLES.SUPER_ADMIN]
  }
};

// Permission checking functions
class RBACService {
  /**
   * Check if a role has a specific permission
   */
  hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a role can perform an action on a resource
   */
  canPerformAction(role, resource, action) {
    const resourcePerms = RESOURCE_PERMISSIONS[resource];
    if (!resourcePerms) return false;
    
    const allowedRoles = resourcePerms[action] || [];
    return allowedRoles.includes(role);
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check multiple permissions
   */
  hasAnyPermission(role, permissions) {
    const rolePerms = this.getRolePermissions(role);
    return permissions.some(perm => rolePerms.includes(perm));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(role, permissions) {
    const rolePerms = this.getRolePermissions(role);
    return permissions.every(perm => rolePerms.includes(perm));
  }

  /**
   * Get resource access level
   */
  getResourceAccess(role, resource) {
    const actions = ['create', 'read', 'update', 'delete'];
    const access = {};
    
    actions.forEach(action => {
      access[action] = this.canPerformAction(role, resource, action);
    });
    
    return access;
  }

  /**
   * Validate role exists
   */
  isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }

  /**
   * Get role hierarchy level
   */
  getRoleLevel(role) {
    const hierarchy = {
      [ROLES.SUPER_ADMIN]: 10,
      [ROLES.ADMIN]: 9,
      [ROLES.HOSPITAL_OWNER]: 8,
      [ROLES.DOCTOR]: 7,
      [ROLES.PHARMACIST]: 6,
      [ROLES.NURSE]: 5,
      [ROLES.LAB_TECH]: 4,
      [ROLES.BILLING_CLERK]: 3,
      [ROLES.RECEPTIONIST]: 2,
      [ROLES.PATIENT]: 1,
      [ROLES.VIEWER]: 0
    };
    
    return hierarchy[role] || 0;
  }

  /**
   * Check if role1 can manage role2
   */
  canManageRole(role1, role2) {
    return this.getRoleLevel(role1) > this.getRoleLevel(role2);
  }
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  RESOURCE_PERMISSIONS,
  RBACService: new RBACService()
};
