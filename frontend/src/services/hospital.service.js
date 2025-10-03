// Hospital Management Service
import apiClient, { API_ENDPOINTS } from './api.config';

const HospitalService = {
  // Get all hospitals
  async getHospitals(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HOSPITALS.LIST, { params });
      return response;
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  },

  // Get hospital by ID
  async getHospital(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HOSPITALS.GET(id));
      return response;
    } catch (error) {
      console.error('Error fetching hospital:', error);
      throw error;
    }
  },

  // Create new hospital
  async createHospital(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.HOSPITALS.CREATE, data);
      return response;
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  },

  // Update hospital
  async updateHospital(id, data) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.HOSPITALS.UPDATE(id), data);
      return response;
    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  },

  // Delete hospital
  async deleteHospital(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.HOSPITALS.DELETE(id));
      return response;
    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }
  },

  // Get hospital statistics
  async getHospitalStats() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HOSPITALS.STATS);
      return response;
    } catch (error) {
      console.error('Error fetching hospital stats:', error);
      // Return mock data as fallback
      return {
        total_hospitals: 3,
        active_hospitals: 3,
        pending_applications: 5,
        total_beds: 2200,
        occupancy_rate: 78.5,
        total_staff: 5700,
        patient_satisfaction: 4.6
      };
    }
  },

  // Search hospitals
  async searchHospitals(query) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HOSPITALS.LIST, {
        params: { search: query }
      });
      return response;
    } catch (error) {
      console.error('Error searching hospitals:', error);
      throw error;
    }
  },

  // Get hospitals by state
  async getHospitalsByState(state) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HOSPITALS.LIST, {
        params: { state }
      });
      return response;
    } catch (error) {
      console.error('Error fetching hospitals by state:', error);
      throw error;
    }
  },
};

export default HospitalService;
