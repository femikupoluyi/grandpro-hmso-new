import { api } from './api.config';

class CRMService {
  // Owner CRM Services
  async getOwnerProfile(ownerId) {
    try {
      const response = await api.get(`/crm/owners/${ownerId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching owner profile:', error);
      throw error;
    }
  }

  async getOwnerContracts(ownerId) {
    try {
      const response = await api.get(`/crm/owners/${ownerId}/contracts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  }

  async getOwnerPayouts(ownerId) {
    try {
      const response = await api.get(`/crm/owners/${ownerId}/payouts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payouts:', error);
      throw error;
    }
  }

  async updateOwnerProfile(ownerId, data) {
    try {
      const response = await api.put(`/crm/owners/${ownerId}/profile`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating owner profile:', error);
      throw error;
    }
  }

  async getOwnerNotifications(ownerId) {
    try {
      const response = await api.get(`/crm/owners/${ownerId}/notifications`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.patch(`/crm/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Patient CRM Services
  async getPatientProfile(patientId) {
    try {
      const response = await api.get(`/crm/patients/${patientId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      throw error;
    }
  }

  async updatePatientProfile(patientId, data) {
    try {
      const response = await api.put(`/crm/patients/${patientId}/profile`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating patient profile:', error);
      throw error;
    }
  }

  async getPatientAppointments(patientId) {
    try {
      const response = await api.get(`/crm/patients/${patientId}/appointments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async bookAppointment(patientId, appointmentData) {
    try {
      const response = await api.post(`/crm/patients/${patientId}/appointments`, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }

  async rescheduleAppointment(appointmentId, newDateTime) {
    try {
      const response = await api.patch(`/crm/appointments/${appointmentId}/reschedule`, newDateTime);
      return response.data;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId, reason) {
    try {
      const response = await api.patch(`/crm/appointments/${appointmentId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  async getPatientReminders(patientId) {
    try {
      const response = await api.get(`/crm/patients/${patientId}/reminders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }

  async markReminderAsRead(reminderId) {
    try {
      const response = await api.patch(`/crm/reminders/${reminderId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking reminder as read:', error);
      throw error;
    }
  }

  async getPatientLoyaltyData(patientId) {
    try {
      const response = await api.get(`/crm/patients/${patientId}/loyalty`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      throw error;
    }
  }

  async redeemLoyaltyReward(patientId, rewardId) {
    try {
      const response = await api.post(`/crm/patients/${patientId}/loyalty/redeem`, { rewardId });
      return response.data;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  async submitFeedback(patientId, feedbackData) {
    try {
      const response = await api.post(`/crm/patients/${patientId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getPatientFeedbackHistory(patientId) {
    try {
      const response = await api.get(`/crm/patients/${patientId}/feedback`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      throw error;
    }
  }

  // Communication Services
  async sendCommunication(recipientId, recipientType, communicationData) {
    try {
      const response = await api.post('/crm/communications/send', {
        recipientId,
        recipientType,
        ...communicationData
      });
      return response.data;
    } catch (error) {
      console.error('Error sending communication:', error);
      throw error;
    }
  }

  async getCommunicationHistory(recipientId, recipientType) {
    try {
      const response = await api.get(`/crm/communications/history`, {
        params: { recipientId, recipientType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching communication history:', error);
      throw error;
    }
  }

  async updateCommunicationPreferences(userId, preferences) {
    try {
      const response = await api.put(`/crm/users/${userId}/communication-preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating communication preferences:', error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getOwnerDashboardStats(ownerId) {
    try {
      const response = await api.get(`/crm/owners/${ownerId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching owner stats:', error);
      // Return mock data as fallback
      return {
        totalRevenue: 45000000,
        activeContracts: 3,
        pendingPayouts: 2500000,
        satisfactionScore: 4.6,
        totalHospitals: 3,
        monthlyRevenue: 15000000
      };
    }
  }

  async getPatientDashboardStats(patientId) {
    try {
      const response = await api.get(`/crm/patients/${patientId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      // Return mock data as fallback
      return {
        upcomingAppointments: 1,
        loyaltyPoints: 2500,
        activeReminders: 3,
        healthScore: 'Good'
      };
    }
  }
}

export default new CRMService();
