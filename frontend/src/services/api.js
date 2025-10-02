import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Owner CRM APIs
export const ownerAPI = {
  getProfile: (ownerId) => api.get(`/crm/owners/${ownerId}/profile`),
  getPayouts: (ownerId) => api.get(`/crm/owners/payouts?owner_id=${ownerId}`),
  createPayout: (data) => api.post('/crm/owners/payouts', data),
  updatePayoutStatus: (payoutId, status) => 
    api.patch(`/crm/owners/payouts/${payoutId}/status`, { status }),
  getCommunications: (ownerId) => api.get(`/crm/owners/${ownerId}/communications`),
  submitSatisfaction: (ownerId, data) => 
    api.post(`/crm/owners/${ownerId}/satisfaction`, data),
  getSatisfactionMetrics: (hospitalId) => 
    api.get(`/crm/owners/satisfaction/metrics?hospital_id=${hospitalId}`)
};

// Patient CRM APIs
export const patientAPI = {
  getProfile: (patientId) => api.get(`/crm/patients/${patientId}/profile`),
  createProfile: (data) => api.post('/crm/patients/profile', data),
  updatePreferences: (patientId, preferences) => 
    api.patch(`/crm/patients/${patientId}/preferences`, preferences),
  
  // Appointments
  scheduleAppointment: (data) => api.post('/crm/patients/appointments', data),
  getAppointments: (patientId) => api.get(`/crm/patients/${patientId}/appointments`),
  
  // Feedback
  submitFeedback: (patientId, data) => 
    api.post(`/crm/patients/${patientId}/feedback`, data),
  getFeedbackHistory: (patientId) => 
    api.get(`/crm/patients/${patientId}/feedback`),
  
  // Loyalty
  getLoyaltyPoints: (patientId) => api.get(`/crm/patients/${patientId}/loyalty`),
  getLoyaltyTransactions: (patientId) => 
    api.get(`/crm/patients/${patientId}/loyalty/transactions`),
  getAvailableRewards: (hospitalId, patientId) => 
    api.get(`/crm/patients/loyalty/rewards?hospital_id=${hospitalId}&patient_id=${patientId}`),
  redeemReward: (patientId, rewardId, hospitalId) => 
    api.post(`/crm/patients/${patientId}/loyalty/redeem`, { 
      reward_id: rewardId, 
      hospital_id: hospitalId 
    }),
  
  // Communications
  getCommunications: (patientId) => 
    api.get(`/crm/patients/${patientId}/communications`)
};

// Communication APIs
export const communicationAPI = {
  sendMessage: (data) => api.post('/crm/communications/send', data),
  getTemplates: () => api.get('/crm/communications/templates'),
  getCampaigns: (hospitalId) => 
    api.get(`/crm/communications/campaigns?hospital_id=${hospitalId}`),
  createCampaign: (data) => api.post('/crm/communications/campaigns', data),
  executeCampaign: (campaignId) => 
    api.post(`/crm/communications/campaigns/${campaignId}/execute`),
  getStatistics: (hospitalId) => 
    api.get(`/crm/communications/statistics?hospital_id=${hospitalId}`)
};

// Dashboard API
export const dashboardAPI = {
  getCRMDashboard: () => api.get('/crm/dashboard'),
  getAnalytics: (period = '30days') => api.get(`/crm/analytics?period=${period}`)
};

export default api;
