// Nigerian States
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOSPITAL_ADMIN: 'hospital_admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  BILLING_OFFICER: 'billing_officer',
  INVENTORY_MANAGER: 'inventory_manager',
  HR_MANAGER: 'hr_manager',
  PATIENT: 'patient',
  HOSPITAL_OWNER: 'hospital_owner'
};

// Hospital Status
export const HOSPITAL_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
};

// Contract Status
export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING_SIGNATURE: 'pending_signature',
  SIGNED: 'signed',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated'
};

// Application Status
export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Medical Specialties
export const MEDICAL_SPECIALTIES = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Internal Medicine',
  'Emergency Medicine',
  'Oncology',
  'Ophthalmology',
  'ENT',
  'Dermatology',
  'Urology'
];

// Blood Groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Genotypes
export const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'];

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    LOGOUT: '/auth/logout'
  },
  HOSPITALS: {
    BASE: '/hospitals',
    STATS: (id) => `/hospitals/${id}/stats`
  },
  APPLICATIONS: {
    SUBMIT: '/applications/submit',
    LIST: '/applications',
    STATUS: (id) => `/applications/status/${id}`,
    REVIEW: (id) => `/applications/${id}/review`
  },
  CONTRACTS: {
    BASE: '/contracts',
    STATUS: (id) => `/contracts/${id}/status`
  },
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    ANALYTICS: '/dashboard/analytics'
  }
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};
