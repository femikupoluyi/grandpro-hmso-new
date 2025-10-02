import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Hospital application submission
export const submitHospitalApplication = async (applicationData) => {
  try {
    const response = await axios.post(
      `${API_URL}/hospitals`,
      applicationData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Upload documents
export const uploadDocuments = async (hospitalId, files) => {
  try {
    const formData = new FormData();
    formData.append('hospitalId', hospitalId);
    
    files.forEach((file, index) => {
      formData.append('documents', file);
      formData.append('documentTypes', file.type || 'general');
    });
    
    const response = await axios.post(
      `${API_URL}/onboarding/documents`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get onboarding status
export const getOnboardingStatus = async (hospitalId) => {
  try {
    const params = hospitalId ? { hospitalId } : {};
    const response = await axios.get(
      `${API_URL}/onboarding/status`,
      { 
        headers: getAuthHeader(),
        params 
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update onboarding progress
export const updateOnboardingProgress = async (hospitalId, step, completed) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/progress`,
      { hospitalId, step, completed },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Generate contract
export const generateContract = async (contractData) => {
  try {
    const response = await axios.post(
      `${API_URL}/contracts/generate`,
      contractData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Sign contract
export const signContract = async (contractId, signatureData) => {
  try {
    const response = await axios.post(
      `${API_URL}/contracts/${contractId}/sign`,
      signatureData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get contract details
export const getContractDetails = async (contractId) => {
  try {
    const response = await axios.get(
      `${API_URL}/contracts/${contractId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all contracts
export const getAllContracts = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/contracts`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get hospital details
export const getHospitalDetails = async (hospitalId) => {
  try {
    const response = await axios.get(
      `${API_URL}/hospitals/${hospitalId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all hospitals
export const getAllHospitals = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/hospitals`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get onboarding checklist
export const getOnboardingChecklist = async (hospitalId) => {
  try {
    const response = await axios.get(
      `${API_URL}/onboarding/checklist/${hospitalId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  submitHospitalApplication,
  uploadDocuments,
  getOnboardingStatus,
  updateOnboardingProgress,
  generateContract,
  signContract,
  getContractDetails,
  getAllContracts,
  getHospitalDetails,
  getAllHospitals,
  getOnboardingChecklist
};
