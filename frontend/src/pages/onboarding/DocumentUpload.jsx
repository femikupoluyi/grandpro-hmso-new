import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const requiredDocuments = [
  {
    id: 'cac_certificate',
    name: 'CAC Certificate',
    description: 'Corporate Affairs Commission registration certificate',
    required: true,
    maxSize: 5 // MB
  },
  {
    id: 'tax_clearance',
    name: 'Tax Clearance Certificate',
    description: 'Valid tax clearance certificate from FIRS',
    required: true,
    maxSize: 5
  },
  {
    id: 'practice_license',
    name: 'Medical Practice License',
    description: 'License from Medical and Dental Council of Nigeria',
    required: true,
    maxSize: 5
  },
  {
    id: 'insurance_certificate',
    name: 'Professional Indemnity Insurance',
    description: 'Valid professional indemnity insurance certificate',
    required: true,
    maxSize: 5
  },
  {
    id: 'facility_photos',
    name: 'Facility Photos',
    description: 'Recent photos of hospital facilities (min. 5 photos)',
    required: true,
    maxSize: 20,
    multiple: true
  },
  {
    id: 'equipment_list',
    name: 'Equipment List',
    description: 'Detailed list of medical equipment available',
    required: false,
    maxSize: 5
  },
  {
    id: 'staff_list',
    name: 'Staff List & Qualifications',
    description: 'List of medical staff with their qualifications',
    required: false,
    maxSize: 5
  },
  {
    id: 'financial_statement',
    name: 'Financial Statement',
    description: 'Latest audited financial statement (if available)',
    required: false,
    maxSize: 10
  }
];

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});

  useEffect(() => {
    // Get application ID from localStorage or redirect if not found
    const storedAppId = localStorage.getItem('applicationId');
    if (!storedAppId) {
      navigate('/onboarding/apply');
    } else {
      setApplicationId(storedAppId);
      fetchUploadedDocuments(storedAppId);
    }
  }, [navigate]);

  const fetchUploadedDocuments = async (appId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/documents/${appId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const files = {};
        const status = {};
        
        data.documents.forEach(doc => {
          files[doc.document_type] = doc;
          status[doc.document_type] = doc.verification_status;
        });
        
        setUploadedFiles(files);
        setVerificationStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleFileSelect = async (documentType, files) => {
    const file = files[0];
    const document = requiredDocuments.find(d => d.id === documentType);
    
    // Validate file size
    if (file.size > document.maxSize * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [documentType]: `File size exceeds ${document.maxSize}MB limit`
      }));
      return;
    }

    // Clear previous errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[documentType];
      return newErrors;
    });

    // Start upload
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('applicationId', applicationId);

    try {
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/documents/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: {
          id: data.documentId,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }
      }));

      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
      
      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });
      }, 2000);

    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [documentType]: 'Upload failed. Please try again.'
      }));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
    }
  };

  const handleDelete = async (documentType) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/documents/${uploadedFiles[documentType].id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        setUploadedFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[documentType];
          return newFiles;
        });
        setVerificationStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[documentType];
          return newStatus;
        });
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleSubmitDocuments = async () => {
    // Check if all required documents are uploaded
    const missingDocs = requiredDocuments
      .filter(doc => doc.required && !uploadedFiles[doc.id])
      .map(doc => doc.name);

    if (missingDocs.length > 0) {
      alert(`Please upload the following required documents:\n${missingDocs.join('\n')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/documents/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ applicationId })
        }
      );

      if (response.ok) {
        navigate('/onboarding/status');
      } else {
        alert('Failed to submit documents. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (documentType) => {
    const status = verificationStatus[documentType];
    
    if (status === 'verified') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (status === 'rejected') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    } else if (status === 'pending') {
      return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Upload
          </h1>
          <p className="text-gray-600">
            Please upload all required documents for your hospital application
          </p>
          {applicationId && (
            <p className="text-sm text-gray-500 mt-2">
              Application ID: {applicationId}
            </p>
          )}
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Upload Progress
            </h2>
            <span className="text-sm text-gray-600">
              {Object.keys(uploadedFiles).length} of {requiredDocuments.filter(d => d.required).length} required documents uploaded
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (Object.keys(uploadedFiles).length / requiredDocuments.filter(d => d.required).length) * 100
                }%`
              }}
            />
          </div>
        </div>

        {/* Document List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requiredDocuments.map(document => (
            <div
              key={document.id}
              className={`bg-white rounded-lg shadow p-6 ${
                uploadedFiles[document.id] ? 'border-green-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {document.name}
                    {document.required && (
                      <span className="ml-2 text-red-500">*</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {document.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: {document.maxSize}MB
                  </p>
                </div>
                {getStatusIcon(document.id)}
              </div>

              {uploadedFiles[document.id] ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadedFiles[document.id].filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadedFiles[document.id].size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/onboarding/documents/view/${uploadedFiles[document.id].id}`, '_blank')}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(document.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {verificationStatus[document.id] && (
                    <div className={`text-sm px-3 py-2 rounded ${
                      verificationStatus[document.id] === 'verified' 
                        ? 'bg-green-50 text-green-700'
                        : verificationStatus[document.id] === 'rejected'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      Status: {verificationStatus[document.id]}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(document.id, e.target.files)}
                      className="hidden"
                      id={`file-${document.id}`}
                      multiple={document.multiple}
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, JPG, PNG (max. {document.maxSize}MB)
                      </p>
                    </div>
                  </label>

                  {uploadProgress[document.id] !== undefined && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[document.id]}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Uploading... {uploadProgress[document.id]}%
                      </p>
                    </div>
                  )}

                  {errors[document.id] && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600">{errors[document.id]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate('/onboarding/apply')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Back to Application
          </button>

          <button
            onClick={handleSubmitDocuments}
            disabled={loading || Object.keys(uploadedFiles).length === 0}
            className={`px-6 py-2 rounded-lg ${
              loading || Object.keys(uploadedFiles).length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? 'Submitting...' : 'Submit Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
