import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, LinearProgress } from '@mui/material';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import onboardingService from '../../services/onboarding.service';
import { toast } from 'react-toastify';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [checklist, setChecklist] = useState([]);

  const documentTypes = [
    {
      type: 'cac_certificate',
      name: 'CAC Certificate',
      description: 'Corporate Affairs Commission registration certificate',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    {
      type: 'medical_license',
      name: 'Medical License',
      description: 'Valid medical practice license from regulatory body',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5 * 1024 * 1024
    },
    {
      type: 'tax_clearance',
      name: 'Tax Clearance Certificate',
      description: 'Recent tax clearance certificate (within last 3 years)',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5 * 1024 * 1024
    },
    {
      type: 'financial_statements',
      name: 'Financial Statements',
      description: 'Audited financial statements for the last 2 years',
      required: true,
      accept: '.pdf,.doc,.docx',
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    {
      type: 'facility_images',
      name: 'Facility Images',
      description: 'Photos of hospital facilities and equipment',
      required: false,
      accept: '.jpg,.jpeg,.png',
      maxSize: 10 * 1024 * 1024
    },
    {
      type: 'insurance_certificate',
      name: 'Insurance Certificate',
      description: 'Professional indemnity and liability insurance',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5 * 1024 * 1024
    }
  ];

  useEffect(() => {
    const appId = localStorage.getItem('applicationId');
    if (!appId) {
      toast.error('No application found. Please submit an application first.');
      navigate('/onboarding/application');
      return;
    }
    setApplicationId(appId);
    fetchDocuments(appId);
    fetchChecklist(appId);
  }, [navigate]);

  const fetchDocuments = async (appId) => {
    try {
      const result = await onboardingService.getDocuments(appId);
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchChecklist = async (appId) => {
    try {
      const result = await onboardingService.getChecklist(appId);
      if (result.success) {
        setChecklist(result.data);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  };

  const handleFileSelect = async (documentType, file) => {
    const docConfig = documentTypes.find(d => d.type === documentType);
    
    // Validate file size
    if (file.size > docConfig.maxSize) {
      toast.error(`File size exceeds ${docConfig.maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!docConfig.accept.includes(fileExtension)) {
      toast.error(`Invalid file type. Accepted formats: ${docConfig.accept}`);
      return;
    }

    // Start upload
    setUploading({ ...uploading, [documentType]: true });
    setUploadProgress({ ...uploadProgress, [documentType]: 0 });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [documentType]: Math.min(prev[documentType] + 20, 90)
        }));
      }, 500);

      const result = await onboardingService.uploadDocument(
        applicationId,
        documentType,
        file
      );

      clearInterval(progressInterval);
      setUploadProgress({ ...uploadProgress, [documentType]: 100 });

      if (result.success) {
        toast.success(`${docConfig.name} uploaded successfully`);
        await fetchDocuments(applicationId);
        await fetchChecklist(applicationId);
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading({ ...uploading, [documentType]: false });
      setTimeout(() => {
        setUploadProgress({ ...uploadProgress, [documentType]: 0 });
      }, 1000);
    }
  };

  const getDocumentStatus = (documentType) => {
    const uploaded = documents.find(d => d.document_type === documentType);
    const checklistItem = checklist.find(c => 
      c.item_name === `Upload ${documentTypes.find(dt => dt.type === documentType)?.name}`
    );
    
    if (uploaded || checklistItem?.status === 'completed') {
      return 'completed';
    } else if (uploading[documentType]) {
      return 'uploading';
    } else {
      return 'pending';
    }
  };

  const getOverallProgress = () => {
    const requiredDocs = documentTypes.filter(d => d.required);
    const uploadedRequired = requiredDocs.filter(d => 
      getDocumentStatus(d.type) === 'completed'
    ).length;
    return (uploadedRequired / requiredDocs.length) * 100;
  };

  const handleProceed = () => {
    const requiredDocs = documentTypes.filter(d => d.required);
    const allRequiredUploaded = requiredDocs.every(d => 
      getDocumentStatus(d.type) === 'completed'
    );

    if (!allRequiredUploaded) {
      toast.warning('Please upload all required documents before proceeding');
      return;
    }

    navigate('/onboarding/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Upload</h1>
          <p className="text-gray-600 mt-2">
            Upload required documents for your hospital onboarding application
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(getOverallProgress())}%
              </span>
            </div>
            <LinearProgress 
              variant="determinate" 
              value={getOverallProgress()} 
              className="h-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-2">
              {documents.length} of {documentTypes.filter(d => d.required).length} required documents uploaded
            </p>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid gap-6">
          {documentTypes.map((docType) => {
            const status = getDocumentStatus(docType.type);
            const isUploading = uploading[docType.type];
            const progress = uploadProgress[docType.type] || 0;

            return (
              <Card 
                key={docType.type}
                className={`transition-all ${
                  status === 'completed' ? 'border-green-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <FileText className="h-6 w-6 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {docType.name}
                            {docType.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {docType.description}
                          </p>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="mt-3">
                        {status === 'completed' && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Uploaded</span>
                          </div>
                        )}
                        {status === 'pending' && docType.required && (
                          <div className="flex items-center text-yellow-600">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Required</span>
                          </div>
                        )}
                        {isUploading && (
                          <div className="mt-2">
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              className="h-1 rounded"
                            />
                            <span className="text-xs text-gray-500 mt-1">
                              Uploading... {progress}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="mt-3 text-xs text-gray-500">
                        <p>Accepted formats: {docType.accept}</p>
                        <p>Max size: {docType.maxSize / (1024 * 1024)}MB</p>
                      </div>
                    </div>

                    {/* Upload Button */}
                    <div className="ml-4">
                      {status !== 'completed' && !isUploading && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept={docType.accept}
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleFileSelect(docType.type, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={isUploading}
                          />
                          <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Upload className="h-5 w-5 mr-2" />
                            <span>Upload</span>
                          </div>
                        </label>
                      )}
                      {status === 'completed' && (
                        <div className="flex flex-col gap-2">
                          <button className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                            <Download className="h-4 w-4 mr-1" />
                            <span className="text-sm">View</span>
                          </button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept={docType.accept}
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleFileSelect(docType.type, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                            <div className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                              <Upload className="h-4 w-4 mr-1" />
                              <span className="text-sm">Replace</span>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate('/onboarding/application')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Application
          </button>
          <button
            onClick={handleProceed}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Proceed to Dashboard
          </button>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              If you're having trouble uploading documents or need assistance with the requirements:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Ensure documents are clear and legible</li>
              <li>Check that file sizes are within limits</li>
              <li>Use supported file formats only</li>
              <li>Contact support at <a href="mailto:documents@grandpro.ng" className="text-blue-600 hover:underline">documents@grandpro.ng</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentUpload;
