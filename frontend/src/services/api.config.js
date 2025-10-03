// API Configuration for GrandPro HMSO Frontend
import axios from 'axios';

// Determine which API URL to use based on environment
const getApiUrl = () => {
  // Use public URL in production or when explicitly set
  if (import.meta.env.VITE_USE_PUBLIC_API === 'true' || 
      import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_PUBLIC_API_URL || 'https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api';
  }
  // Use local URL in development
  return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Nigerian timezone and currency headers
    config.headers['X-Timezone'] = import.meta.env.VITE_TIMEZONE || 'Africa/Lagos';
    config.headers['X-Currency'] = import.meta.env.VITE_CURRENCY || 'NGN';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle specific error status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access denied');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  
  // Hospital Management
  HOSPITALS: {
    LIST: '/hospitals',
    GET: (id) => `/hospitals/${id}`,
    CREATE: '/hospitals',
    UPDATE: (id) => `/hospitals/${id}`,
    DELETE: (id) => `/hospitals/${id}`,
    STATS: '/hospitals/stats',
  },
  
  // Onboarding
  ONBOARDING: {
    APPLICATIONS: '/onboarding/applications',
    SUBMIT: '/onboarding/submit',
    UPLOAD_DOCUMENT: '/onboarding/documents',
    EVALUATION: '/onboarding/evaluation',
    CONTRACT: '/onboarding/contract',
  },
  
  // CRM
  CRM: {
    OWNERS: '/crm/owners',
    PATIENTS: '/crm/patients',
    CAMPAIGNS: '/crm/campaigns',
    APPOINTMENTS: '/crm/appointments',
    FEEDBACK: '/crm/feedback',
    LOYALTY: '/crm/loyalty',
  },
  
  // Hospital Operations
  EMR: {
    PATIENTS: '/emr/patients',
    RECORDS: '/emr/records',
    PRESCRIPTIONS: '/emr/prescriptions',
  },
  
  BILLING: {
    INVOICES: '/billing/invoices',
    PAYMENTS: '/billing/payments',
    INSURANCE_CLAIMS: '/billing/insurance-claims',
  },
  
  INVENTORY: {
    ITEMS: '/inventory/items',
    ORDERS: '/inventory/orders',
    SUPPLIERS: '/inventory/suppliers',
  },
  
  HR: {
    STAFF: '/hr/staff',
    SCHEDULES: '/hr/schedules',
    PAYROLL: '/hr/payroll',
  },
  
  // Operations
  OPERATIONS: {
    COMMAND_CENTRE: '/operations/command-centre/overview',
    METRICS: '/operations/command-centre/metrics',
    ALERTS: '/operations/alerts',
    PROJECTS: '/operations/projects',
  },
  
  // Partner Integrations
  PARTNERS: {
    INSURANCE: '/insurance/providers',
    PHARMACY: '/pharmacy/suppliers',
    TELEMEDICINE: '/telemedicine/sessions',
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PREDICTIONS: '/analytics/predictions',
    ML_TRIAGE: '/analytics/ml/triage',
  },
  
  // Security
  SECURITY: {
    AUDIT_LOGS: '/security/audit-logs',
    COMPLIANCE: '/security/compliance-status',
  },
};

export default apiClient;
