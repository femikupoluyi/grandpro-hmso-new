// API Configuration using environment variables
import axios from 'axios';
import { toast } from 'react-toastify';

// Get API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL || API_BASE_URL;

// Determine which URL to use based on environment
const isProduction = import.meta.env.VITE_APP_ENVIRONMENT === 'production';
const API_URL = isProduction ? PUBLIC_API_URL : API_BASE_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
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
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Nigerian timezone header
    config.headers['X-Timezone'] = import.meta.env.VITE_TIMEZONE || 'Africa/Lagos';
    
    // Add app version for debugging
    config.headers['X-App-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
          
        case 404:
          toast.error('The requested resource was not found.');
          break;
          
        case 422:
          // Validation error
          const validationErrors = data.errors || data.message;
          toast.error(validationErrors || 'Validation error occurred.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data.message || 'An error occurred.');
      }
      
      if (import.meta.env.DEV) {
        console.error(`❌ Error ${status} from ${error.config?.url}:`, data);
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
      console.error('Network error:', error.request);
    } else {
      // Other errors
      toast.error('An unexpected error occurred.');
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const api = {
  // GET request
  get: (url, config = {}) => apiClient.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // File upload
  upload: (url, formData, onProgress) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  // Batch requests
  batch: (requests) => Promise.all(requests),
};

// Environment configuration helper
export const config = {
  API_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'GrandPro HMSO',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  TIMEZONE: import.meta.env.VITE_TIMEZONE || 'Africa/Lagos',
  CURRENCY: import.meta.env.VITE_CURRENCY || 'NGN',
  COUNTRY: import.meta.env.VITE_COUNTRY || 'Nigeria',
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en-NG',
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'),
  MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5'),
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@grandpro.ng',
  SUPPORT_PHONE: import.meta.env.VITE_SUPPORT_PHONE || '+234 800 GRANDPRO',
  
  // Feature flags
  features: {
    telemedicine: import.meta.env.VITE_ENABLE_TELEMEDICINE === 'true',
    aiTriage: import.meta.env.VITE_ENABLE_AI_TRIAGE === 'true',
    loyaltyProgram: import.meta.env.VITE_ENABLE_LOYALTY_PROGRAM === 'true',
    nhisIntegration: import.meta.env.VITE_ENABLE_NHIS_INTEGRATION === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
};

// API Endpoints configuration
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Hospitals
  HOSPITALS: '/hospitals',
  HOSPITAL_DETAILS: (id) => `/hospitals/${id}`,
  
  // Onboarding
  APPLICATIONS: '/onboarding/applications',
  APPLICATION_DETAILS: (id) => `/onboarding/applications/${id}`,
  DOCUMENTS: '/onboarding/documents',
  CONTRACTS: '/onboarding/contracts',
  
  // CRM
  OWNERS: '/crm/owners',
  PATIENTS: '/crm/patients',
  CAMPAIGNS: '/crm/campaigns',
  
  // Hospital Management
  EMR_PATIENTS: '/emr/patients',
  BILLING: '/billing/invoices',
  INVENTORY: '/inventory',
  HR_STAFF: '/hr/staff',
  
  // Operations
  METRICS: '/operations/metrics',
  ANALYTICS: '/analytics/dashboard',
  PROJECTS: '/operations/projects',
};

// Export configured axios instance for advanced usage
export default apiClient;
