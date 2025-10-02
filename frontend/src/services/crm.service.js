import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class CRMService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Owner CRM Methods
  async getOwnerProfile(ownerId) {
    return this.api.get(`/api/crm/owners/${ownerId}/profile`);
  }

  async getOwnerContracts(ownerId) {
    return this.api.get(`/api/crm/owners/${ownerId}/contracts`);
  }

  async getOwnerPayouts(ownerId) {
    return this.api.get(`/api/crm/owners/${ownerId}/payouts`);
  }

  async getOwnerHospitals(ownerId) {
    return this.api.get(`/api/crm/owners/${ownerId}/hospitals`);
  }

  async getOwnerCommunications(ownerId) {
    return this.api.get(`/api/crm/owners/${ownerId}/communications`);
  }

  async getOwnerSatisfaction(ownerId) {
    return this.api.get(`/api/crm/owners/${ownerId}/satisfaction`);
  }

  async createOwnerContract(data) {
    return this.api.post('/api/crm/enhanced/owners/contracts', data);
  }

  async processOwnerPayout(ownerId, data) {
    return this.api.post(`/api/crm/enhanced/owners/${ownerId}/payouts`, data);
  }

  // Patient CRM Methods
  async getPatientProfile(patientId) {
    return this.api.get(`/api/crm/patients/${patientId}/profile`);
  }

  async getPatientAppointments(patientId) {
    return this.api.get(`/api/crm/patients/${patientId}/appointments`);
  }

  async getPatientReminders(patientId) {
    return this.api.get(`/api/crm/patients/${patientId}/reminders`);
  }

  async getPatientFeedback(patientId) {
    return this.api.get(`/api/crm/patients/${patientId}/feedback`);
  }

  async getPatientLoyalty(patientId) {
    return this.api.get(`/api/crm/patients/${patientId}/loyalty`);
  }

  async getPatientMedicalHistory(patientId) {
    return this.api.get(`/api/crm/patients/${patientId}/medical-history`);
  }

  async createAppointment(data) {
    return this.api.post('/api/crm/patients/appointments', data);
  }

  async updateAppointment(appointmentId, data) {
    return this.api.put(`/api/crm/patients/appointments/${appointmentId}`, data);
  }

  async cancelAppointment(appointmentId) {
    return this.api.delete(`/api/crm/patients/appointments/${appointmentId}`);
  }

  async submitFeedback(data) {
    return this.api.post('/api/crm/patients/feedback', data);
  }

  async redeemReward(patientId, rewardId) {
    return this.api.post(`/api/crm/patients/${patientId}/rewards/${rewardId}/redeem`);
  }

  async setReminder(data) {
    return this.api.post('/api/crm/patients/reminders', data);
  }

  async updateReminder(reminderId, data) {
    return this.api.put(`/api/crm/patients/reminders/${reminderId}`, data);
  }

  async deleteReminder(reminderId) {
    return this.api.delete(`/api/crm/patients/reminders/${reminderId}`);
  }

  // Communication Methods
  async sendCommunication(data) {
    return this.api.post('/api/crm/communications/send', data);
  }

  async sendBulkCommunication(data) {
    return this.api.post('/api/crm/communications/send-bulk', data);
  }

  async getCommunicationHistory(filters) {
    return this.api.get('/api/crm/communications/history', { params: filters });
  }

  async getCommunicationTemplates() {
    return this.api.get('/api/crm/communications/templates');
  }

  async createCommunicationTemplate(data) {
    return this.api.post('/api/crm/communications/templates', data);
  }

  async scheduleCommunication(data) {
    return this.api.post('/api/crm/communications/schedule', data);
  }

  // Campaign Methods
  async createCampaign(data) {
    return this.api.post('/api/crm/enhanced/campaigns', data);
  }

  async getCampaigns() {
    return this.api.get('/api/crm/enhanced/campaigns');
  }

  async getCampaignMetrics(campaignId) {
    return this.api.get(`/api/crm/enhanced/campaigns/${campaignId}/metrics`);
  }

  async updateCampaign(campaignId, data) {
    return this.api.put(`/api/crm/enhanced/campaigns/${campaignId}`, data);
  }

  async deleteCampaign(campaignId) {
    return this.api.delete(`/api/crm/enhanced/campaigns/${campaignId}`);
  }

  // Loyalty Program Methods
  async getLoyaltyProgram() {
    return this.api.get('/api/crm/enhanced/loyalty/program');
  }

  async updateLoyaltyProgram(data) {
    return this.api.put('/api/crm/enhanced/loyalty/program', data);
  }

  async addLoyaltyPoints(patientId, points, reason) {
    return this.api.post('/api/crm/enhanced/loyalty/points', {
      patientId,
      points,
      reason
    });
  }

  async getLoyaltyTransactions(patientId) {
    return this.api.get(`/api/crm/enhanced/loyalty/${patientId}/transactions`);
  }

  async getAvailableRewards() {
    return this.api.get('/api/crm/enhanced/loyalty/rewards');
  }

  async createReward(data) {
    return this.api.post('/api/crm/enhanced/loyalty/rewards', data);
  }

  // Analytics Methods
  async getOwnerAnalytics(ownerId, dateRange) {
    return this.api.get(`/api/crm/enhanced/analytics/owner/${ownerId}`, {
      params: dateRange
    });
  }

  async getPatientAnalytics(dateRange) {
    return this.api.get('/api/crm/enhanced/analytics/patients', {
      params: dateRange
    });
  }

  async getCommunicationAnalytics(dateRange) {
    return this.api.get('/api/crm/enhanced/analytics/communications', {
      params: dateRange
    });
  }

  async getCampaignAnalytics(campaignId) {
    return this.api.get(`/api/crm/enhanced/analytics/campaigns/${campaignId}`);
  }

  // Utility Methods
  async getHospitals() {
    return this.api.get('/api/hospitals');
  }

  async getDoctorsByHospital(hospitalId) {
    return this.api.get(`/api/hospitals/${hospitalId}/doctors`);
  }

  async getAppointmentSlots(doctorId, date) {
    return this.api.get(`/api/crm/patients/appointment-slots`, {
      params: { doctorId, date }
    });
  }

  async searchPatients(query) {
    return this.api.get('/api/crm/patients/search', {
      params: { q: query }
    });
  }

  async searchOwners(query) {
    return this.api.get('/api/crm/owners/search', {
      params: { q: query }
    });
  }

  // Notification Methods
  async getNotificationPreferences(userId) {
    return this.api.get(`/api/crm/notifications/${userId}/preferences`);
  }

  async updateNotificationPreferences(userId, preferences) {
    return this.api.put(`/api/crm/notifications/${userId}/preferences`, preferences);
  }

  async getNotifications(userId) {
    return this.api.get(`/api/crm/notifications/${userId}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.api.put(`/api/crm/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(userId) {
    return this.api.put(`/api/crm/notifications/${userId}/read-all`);
  }

  // Export Methods
  async exportOwnerData(ownerId, format = 'csv') {
    return this.api.get(`/api/crm/owners/${ownerId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  async exportPatientData(patientId, format = 'csv') {
    return this.api.get(`/api/crm/patients/${patientId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  async exportCommunicationHistory(filters, format = 'csv') {
    return this.api.get('/api/crm/communications/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
  }
}

export default new CRMService();
