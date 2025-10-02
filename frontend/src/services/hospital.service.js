import api from './api';

class HospitalService {
  async getAll(params = {}) {
    const response = await api.get('/hospitals', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/hospitals/${id}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/hospitals', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/hospitals/${id}`, data);
    return response.data;
  }

  async getStats(id) {
    const response = await api.get(`/hospitals/${id}/stats`);
    return response.data;
  }

  async submitApplication(data) {
    const response = await api.post('/applications/submit', data);
    return response.data;
  }

  async getApplications(params = {}) {
    const response = await api.get('/applications', { params });
    return response.data;
  }

  async reviewApplication(id, data) {
    const response = await api.patch(`/applications/${id}/review`, data);
    return response.data;
  }

  async getApplicationStatus(id) {
    const response = await api.get(`/applications/status/${id}`);
    return response.data;
  }
}

export default new HospitalService();
