// Onboarding Service for Frontend
import apiClient, { API_ENDPOINTS } from './api.config';

const OnboardingService = {
  // Submit application
  async submitApplication(applicationData) {
    try {
      const response = await apiClient.post('/onboarding/applications', applicationData);
      return response;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get application by ID
  async getApplication(applicationId) {
    try {
      const response = await apiClient.get(`/onboarding/applications/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  // Get all applications (for admin)
  async getApplications(params = {}) {
    try {
      const response = await apiClient.get('/onboarding/applications', { params });
      return response;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  // Upload document
  async uploadDocument(applicationId, documentType, file) {
    try {
      const formData = new FormData();
      formData.append('application_id', applicationId);
      formData.append('document_type', documentType);
      formData.append('document', file);

      const response = await apiClient.post('/onboarding/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Get documents for application
  async getDocuments(applicationId) {
    try {
      const response = await apiClient.get(`/onboarding/documents/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Get onboarding dashboard
  async getDashboard() {
    try {
      const response = await apiClient.get('/onboarding/dashboard');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Return mock data as fallback
      return {
        success: true,
        data: {
          statusCounts: {
            submitted: 5,
            under_review: 2,
            approved: 3,
            rejected: 1,
            contract_signed: 2
          },
          recentApplications: [
            {
              application_id: 'APP-001',
              hospital_name: 'Lagos General Hospital',
              state: 'Lagos',
              status: 'under_review',
              submitted_at: new Date().toISOString(),
              overall_progress: 45
            }
          ],
          evaluationMetrics: {
            avg_score: 75.5,
            approved_count: 3,
            rejected_count: 1,
            review_count: 2
          },
          summary: {
            totalApplications: 11,
            averageProgress: 65,
            pendingReviews: 2
          }
        }
      };
    }
  },

  // Get evaluation scores
  async getEvaluationScores(applicationId) {
    try {
      const response = await apiClient.get(`/onboarding/evaluation/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching evaluation scores:', error);
      throw error;
    }
  },

  // Run evaluation (admin only)
  async runEvaluation(applicationId) {
    try {
      const response = await apiClient.post(`/onboarding/evaluation/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error running evaluation:', error);
      throw error;
    }
  },

  // Get evaluation criteria
  async getEvaluationCriteria() {
    try {
      const response = await apiClient.get('/onboarding/evaluation/criteria');
      return response;
    } catch (error) {
      console.error('Error fetching criteria:', error);
      // Return default criteria as fallback
      return {
        success: true,
        data: [
          { name: 'Infrastructure', weight: 25, description: 'Hospital facilities and capacity' },
          { name: 'Financial Stability', weight: 20, description: 'Revenue and financial health' },
          { name: 'Compliance', weight: 25, description: 'Regulatory compliance and documentation' },
          { name: 'Geographic Coverage', weight: 15, description: 'Location strategic importance' },
          { name: 'Technology Readiness', weight: 15, description: 'IT infrastructure and digital readiness' }
        ]
      };
    }
  },

  // Generate contract
  async generateContract(applicationId) {
    try {
      const response = await apiClient.post(`/onboarding/contract/generate/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },

  // Get contract
  async getContract(contractId) {
    try {
      const response = await apiClient.get(`/onboarding/contract/${contractId}`);
      return response;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  },

  // Sign contract
  async signContract(contractId, signatureData) {
    try {
      const response = await apiClient.post('/onboarding/contract/sign', {
        contract_id: contractId,
        ...signatureData
      });
      return response;
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  },

  // Get checklist
  async getChecklist(applicationId) {
    try {
      const response = await apiClient.get(`/onboarding/checklist/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching checklist:', error);
      throw error;
    }
  },

  // Get onboarding status
  async getOnboardingStatus(applicationId) {
    try {
      const response = await apiClient.get(`/onboarding/status/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  },

  // Get statistics
  async getStatistics() {
    try {
      const response = await apiClient.get('/onboarding/statistics');
      return response;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
};

export default OnboardingService;
