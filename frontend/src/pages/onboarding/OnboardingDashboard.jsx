import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const OnboardingDashboard = () => {
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stages = [
    {
      id: 'application',
      name: 'Application Submitted',
      description: 'Initial application form completed',
      icon: DocumentTextIcon,
      percentage: 10
    },
    {
      id: 'document_submission',
      name: 'Document Submission',
      description: 'Required documents uploaded for verification',
      icon: DocumentCheckIcon,
      percentage: 25
    },
    {
      id: 'evaluation',
      name: 'Evaluation',
      description: 'Application and documents under review',
      icon: ClipboardDocumentCheckIcon,
      percentage: 50
    },
    {
      id: 'contract_negotiation',
      name: 'Contract Negotiation',
      description: 'Contract terms being finalized',
      icon: PencilSquareIcon,
      percentage: 70
    },
    {
      id: 'signature',
      name: 'Contract Signature',
      description: 'Contract ready for digital signature',
      icon: CheckBadgeIcon,
      percentage: 90
    },
    {
      id: 'completed',
      name: 'Onboarding Complete',
      description: 'Welcome to GrandPro HMSO network',
      icon: CheckCircleIcon,
      percentage: 100
    }
  ];

  useEffect(() => {
    fetchApplicationStatus();
    const interval = setInterval(fetchApplicationStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const applicationId = localStorage.getItem('applicationId');
      
      if (!applicationId) {
        navigate('/onboarding/apply');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/status/${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch application status');
      }

      const data = await response.json();
      setApplicationData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = () => {
    if (!applicationData) return -1;
    return stages.findIndex(stage => stage.id === applicationData.status.current_stage);
  };

  const getStageStatus = (index) => {
    const currentIndex = getCurrentStageIndex();
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const getTaskIcon = (completed) => {
    if (completed) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    return <ClockIcon className="h-5 w-5 text-gray-400" />;
  };

  const handleActionClick = (action) => {
    switch (action) {
      case 'upload_documents':
        navigate('/onboarding/documents');
        break;
      case 'review_contract':
        navigate('/onboarding/contract');
        break;
      case 'sign_contract':
        navigate('/onboarding/sign');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/onboarding/apply')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start New Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Onboarding Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Track your hospital onboarding progress
          </p>
        </div>

        {/* Application Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-semibold text-gray-900">
                {applicationData?.application.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hospital Name</p>
              <p className="font-semibold text-gray-900">
                {applicationData?.application.hospital_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted On</p>
              <p className="font-semibold text-gray-900">
                {new Date(applicationData?.application.created_at).toLocaleDateString('en-NG')}
              </p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-blue-600">
                {applicationData?.status.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${applicationData?.status.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Onboarding Progress
          </h2>
          
          <div className="relative">
            {stages.map((stage, index) => {
              const status = getStageStatus(index);
              const Icon = stage.icon;
              
              return (
                <div key={stage.id} className="relative flex items-start mb-8 last:mb-0">
                  {/* Timeline Line */}
                  {index < stages.length - 1 && (
                    <div
                      className={`absolute left-6 top-12 w-0.5 h-full ${
                        status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}

                  {/* Stage Icon */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${
                      status === 'completed'
                        ? 'bg-green-100 border-2 border-green-500'
                        : status === 'current'
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        status === 'completed'
                          ? 'text-green-600'
                          : status === 'current'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>

                  {/* Stage Content */}
                  <div className="ml-6 flex-1">
                    <div className="flex items-center">
                      <h3
                        className={`text-lg font-medium ${
                          status === 'completed'
                            ? 'text-green-700'
                            : status === 'current'
                            ? 'text-blue-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {stage.name}
                      </h3>
                      {status === 'current' && (
                        <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Current Stage
                        </span>
                      )}
                      {status === 'completed' && (
                        <CheckCircleIcon className="ml-3 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {stage.description}
                    </p>
                    {status === 'completed' && applicationData?.status.stage_dates?.[stage.id] && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed on {new Date(applicationData.status.stage_dates[stage.id]).toLocaleDateString('en-NG')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checklist */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Onboarding Checklist
            </h2>
            
            <div className="space-y-3">
              {applicationData?.checklist?.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    task.completed ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getTaskIcon(task.completed)}
                    <span
                      className={`text-sm ${
                        task.completed ? 'text-gray-700 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.task_name}
                    </span>
                  </div>
                  {task.completed && task.completed_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(task.completed_at).toLocaleDateString('en-NG')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions & Next Steps */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Next Steps
            </h2>

            {applicationData?.status.current_stage === 'application' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your application has been submitted. Please upload the required documents.
                </p>
                <button
                  onClick={() => handleActionClick('upload_documents')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span>Upload Documents</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {applicationData?.status.current_stage === 'document_submission' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Please ensure all required documents are uploaded for verification.
                </p>
                <button
                  onClick={() => handleActionClick('upload_documents')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span>Manage Documents</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {applicationData?.status.current_stage === 'evaluation' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your application is being evaluated by our team. We'll notify you once the review is complete.
                </p>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <ClockIcon className="inline h-4 w-4 mr-1" />
                    Estimated review time: 3-5 business days
                  </p>
                </div>
              </div>
            )}

            {applicationData?.status.current_stage === 'contract_negotiation' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Contract terms are being prepared. You'll be able to review them soon.
                </p>
                <button
                  onClick={() => handleActionClick('review_contract')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span>Review Contract</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {applicationData?.status.current_stage === 'signature' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your contract is ready for signature. Please review and sign digitally.
                </p>
                <button
                  onClick={() => handleActionClick('sign_contract')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <span>Sign Contract</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {applicationData?.status.current_stage === 'completed' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-center text-green-800 font-medium">
                    Congratulations! Your onboarding is complete.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/owner/dashboard')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span>Go to Dashboard</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Evaluation Scores (if available) */}
            {applicationData?.evaluation && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Evaluation Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Infrastructure</span>
                    <span className="font-medium text-blue-900">
                      {applicationData.evaluation.infrastructure_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Clinical Services</span>
                    <span className="font-medium text-blue-900">
                      {applicationData.evaluation.clinical_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Financial Health</span>
                    <span className="font-medium text-blue-900">
                      {applicationData.evaluation.financial_score}/100
                    </span>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-blue-700">Total Score</span>
                      <span className="font-bold text-blue-900">
                        {applicationData.evaluation.total_score}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard;
