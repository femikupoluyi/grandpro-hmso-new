import { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/applications`);
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Applications</h1>
        <p className="text-sm text-gray-500">Review and manage hospital partnership applications</p>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-6">
        {applications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  {getStatusIcon(application.status)}
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {application.hospital_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Owner: {application.owner_name}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        📧 {application.owner_email}
                      </p>
                      <p className="text-sm text-gray-600">
                        📱 {application.owner_phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 {application.state}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                    {application.status}
                  </span>
                  {application.evaluation_score && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Score</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {(application.evaluation_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Bed Capacity</p>
                  <p className="text-sm font-medium text-gray-900">
                    {application.bed_capacity || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Staff Count</p>
                  <p className="text-sm font-medium text-gray-900">
                    {application.staff_count || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(application.submitted_at).toLocaleDateString('en-NG')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reviewed</p>
                  <p className="text-sm font-medium text-gray-900">
                    {application.reviewed_at 
                      ? new Date(application.reviewed_at).toLocaleDateString('en-NG')
                      : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Hospital Address</p>
                <p className="text-sm text-gray-700">{application.hospital_address}</p>
              </div>

              {application.evaluation_notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Evaluation Notes</p>
                  <p className="text-sm text-gray-700">{application.evaluation_notes}</p>
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  Review Application
                </button>
                <button className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                  View Documents
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">No applications found</p>
        </div>
      )}
    </div>
  );
};

export default Applications;
