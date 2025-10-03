// CRM Service Module
import apiClient, { API_ENDPOINTS } from './api.config';

const CRMService = {
  // Owner Management
  owners: {
    async getAll(params = {}) {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CRM.OWNERS, { params });
        return response;
      } catch (error) {
        console.error('Error fetching owners:', error);
        throw error;
      }
    },

    async getById(id) {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.OWNERS}/${id}`);
        return response;
      } catch (error) {
        console.error('Error fetching owner:', error);
        throw error;
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post(API_ENDPOINTS.CRM.OWNERS, data);
        return response;
      } catch (error) {
        console.error('Error creating owner:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`${API_ENDPOINTS.CRM.OWNERS}/${id}`, data);
        return response;
      } catch (error) {
        console.error('Error updating owner:', error);
        throw error;
      }
    },

    async getPayouts(ownerId) {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.OWNERS}/${ownerId}/payouts`);
        return response;
      } catch (error) {
        console.error('Error fetching payouts:', error);
        throw error;
      }
    },
  },

  // Patient Management
  patients: {
    async getAll(params = {}) {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CRM.PATIENTS, { params });
        return response;
      } catch (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }
    },

    async getById(id) {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.PATIENTS}/${id}`);
        return response;
      } catch (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post(API_ENDPOINTS.CRM.PATIENTS, data);
        return response;
      } catch (error) {
        console.error('Error creating patient:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`${API_ENDPOINTS.CRM.PATIENTS}/${id}`, data);
        return response;
      } catch (error) {
        console.error('Error updating patient:', error);
        throw error;
      }
    },

    async getLoyaltyPoints(patientId) {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.PATIENTS}/${patientId}/loyalty`);
        return response;
      } catch (error) {
        console.error('Error fetching loyalty points:', error);
        throw error;
      }
    },
  },

  // Communication Campaigns
  campaigns: {
    async getAll(params = {}) {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CRM.CAMPAIGNS, { params });
        return response;
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        // Return mock data as fallback
        return {
          data: [
            {
              id: 1,
              name: 'Health Awareness Campaign',
              type: 'SMS',
              status: 'active',
              recipients: 500
            }
          ]
        };
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post(API_ENDPOINTS.CRM.CAMPAIGNS, data);
        return response;
      } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
      }
    },

    async send(campaignId, recipientIds) {
      try {
        const response = await apiClient.post(`${API_ENDPOINTS.CRM.CAMPAIGNS}/${campaignId}/send`, {
          recipients: recipientIds
        });
        return response;
      } catch (error) {
        console.error('Error sending campaign:', error);
        throw error;
      }
    },
  },

  // Appointments
  appointments: {
    async getAll(params = {}) {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CRM.APPOINTMENTS, { params });
        return response;
      } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post(API_ENDPOINTS.CRM.APPOINTMENTS, data);
        return response;
      } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`${API_ENDPOINTS.CRM.APPOINTMENTS}/${id}`, data);
        return response;
      } catch (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }
    },

    async cancel(id) {
      try {
        const response = await apiClient.delete(`${API_ENDPOINTS.CRM.APPOINTMENTS}/${id}`);
        return response;
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        throw error;
      }
    },
  },

  // Feedback
  feedback: {
    async getAll(params = {}) {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CRM.FEEDBACK, { params });
        return response;
      } catch (error) {
        console.error('Error fetching feedback:', error);
        throw error;
      }
    },

    async submit(data) {
      try {
        const response = await apiClient.post(API_ENDPOINTS.CRM.FEEDBACK, data);
        return response;
      } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
      }
    },

    async getSummary() {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.FEEDBACK}/summary`);
        return response;
      } catch (error) {
        console.error('Error fetching feedback summary:', error);
        throw error;
      }
    },
  },

  // Loyalty Program
  loyalty: {
    async getRewards() {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.LOYALTY}/rewards`);
        return response;
      } catch (error) {
        console.error('Error fetching rewards:', error);
        throw error;
      }
    },

    async redeemPoints(patientId, rewardId) {
      try {
        const response = await apiClient.post(`${API_ENDPOINTS.CRM.LOYALTY}/redeem`, {
          patient_id: patientId,
          reward_id: rewardId
        });
        return response;
      } catch (error) {
        console.error('Error redeeming points:', error);
        throw error;
      }
    },

    async getTransactions(patientId) {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.CRM.LOYALTY}/transactions/${patientId}`);
        return response;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    },
  },
};

export default CRMService;
