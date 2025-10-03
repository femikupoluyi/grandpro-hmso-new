import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, LinearProgress, Chip } from '@mui/material';
import { 
  CheckCircle, Clock, XCircle, AlertCircle, FileText, 
  TrendingUp, Users, Award, Calendar, ChevronRight,
  Download, Eye, Edit
} from 'lucide-react';
import onboardingService from '../../services/onboarding.service';
import { format } from 'date-fns';

const OnboardingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const applicationId = localStorage.getItem('applicationId');

  useEffect(() => {
    if (!applicationId) {
      navigate('/onboarding/application');
      return;
    }
    fetchDashboardData();
  }, [applicationId, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardResult, applicationResult, checklistResult] = await Promise.all([
        onboardingService.getDashboard(),
        onboardingService.getApplication(applicationId),
        onboardingService.getChecklist(applicationId)
      ]);

      setDashboardData(dashboardResult.data);
      setApplicationData(applicationResult.data);
      setChecklist(checklistResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'contract_signed':
        return 'success';
      case 'in_progress':
      case 'under_review':
        return 'warning';
      case 'pending':
      case 'submitted':
        return 'info';
      case 'rejected':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
      case 'under_review':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const calculateProgress = () => {
    if (!checklist.length) return 0;
    const completed = checklist.filter(item => item.status === 'completed').length;
    return (completed / checklist.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your hospital onboarding progress and manage your application
          </p>
        </div>

        {/* Application Status Card */}
        {applicationData && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {applicationData.hospital_name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Application ID: {applicationData.application_id || applicationId}
                  </p>
                  <p className="text-gray-600">
                    Submitted: {applicationData.submitted_at ? 
                      format(new Date(applicationData.submitted_at), 'MMM dd, yyyy') : 
                      'Recently'}
                  </p>
                </div>
                <Chip 
                  label={applicationData.status || 'Pending'} 
                  color={getStatusColor(applicationData.status)}
                  className="font-semibold"
                />
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Onboarding Progress
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(applicationData.overall_progress || calculateProgress())}%
                  </span>
                </div>
                <LinearProgress 
                  variant="determinate" 
                  value={applicationData.overall_progress || calculateProgress()} 
                  className="h-2 rounded"
                />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {applicationData.documents_count || 0}
                  </p>
                  <p className="text-sm text-gray-600">Documents</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {applicationData.evaluation_score || '-'}
                  </p>
                  <p className="text-sm text-gray-600">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {applicationData.bed_capacity || 0}
                  </p>
                  <p className="text-sm text-gray-600">Beds</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {applicationData.staff_count || 0}
                  </p>
                  <p className="text-sm text-gray-600">Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow">
          {['overview', 'checklist', 'documents', 'evaluation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid gap-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && dashboardData && (
            <>
              {/* Statistics Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Applications</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {dashboardData.summary?.totalApplications || 0}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Average Score</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {dashboardData.evaluationMetrics?.avg_score?.toFixed(1) || '-'}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Pending Reviews</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {dashboardData.summary?.pendingReviews || 0}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="bg-gray-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {dashboardData.recentApplications?.slice(0, 5).map((app, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {app.hospital_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {app.state} • {app.submitted_at ? 
                                format(new Date(app.submitted_at), 'MMM dd, yyyy') : 
                                'Recently'}
                            </p>
                          </div>
                          <Chip 
                            label={app.status} 
                            size="small"
                            color={getStatusColor(app.status)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <Card>
              <CardHeader className="bg-gray-50 p-4">
                <h3 className="text-lg font-semibold text-gray-900">Onboarding Checklist</h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {checklist.map((item, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(item.status)}
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {item.item_name}
                            </p>
                            {item.completed_at && (
                              <p className="text-sm text-gray-600">
                                Completed: {format(new Date(item.completed_at), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <Chip 
                          label={item.status} 
                          size="small"
                          color={getStatusColor(item.status)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card>
              <CardHeader className="bg-gray-50 p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <button
                  onClick={() => navigate('/onboarding/documents')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Documents
                </button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Upload and manage your onboarding documents
                  </p>
                  <button
                    onClick={() => navigate('/onboarding/documents')}
                    className="mt-4 text-blue-600 hover:underline flex items-center justify-center mx-auto"
                  >
                    Go to Document Upload
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluation Tab */}
          {activeTab === 'evaluation' && (
            <Card>
              <CardHeader className="bg-gray-50 p-4">
                <h3 className="text-lg font-semibold text-gray-900">Evaluation Results</h3>
              </CardHeader>
              <CardContent className="p-6">
                {applicationData?.evaluation_score ? (
                  <div>
                    <div className="text-center mb-6">
                      <p className="text-5xl font-bold text-blue-600">
                        {applicationData.evaluation_score}
                      </p>
                      <p className="text-gray-600 mt-2">Overall Score</p>
                    </div>
                    <div className="grid gap-4">
                      {/* Evaluation criteria would be displayed here */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Your application has been evaluated. Contract generation is the next step.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      Evaluation pending. Please complete all required documents.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate('/onboarding/documents')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Upload Documents
          </button>
          {applicationData?.status === 'approved' && (
            <button
              onClick={() => navigate('/onboarding/contract')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Review Contract
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard;
