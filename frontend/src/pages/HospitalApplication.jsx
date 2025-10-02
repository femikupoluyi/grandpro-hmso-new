import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

const HospitalApplication = () => {
  const [formData, setFormData] = useState({
    hospitalName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    hospitalAddress: '',
    state: '',
    bedCapacity: '',
    staffCount: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/applications/submit`,
        formData
      );
      setApplicationId(response.data.application.id);
      setSubmitted(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Application Submitted Successfully!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your application ID is:
            </p>
            <p className="mt-2 text-lg font-mono text-primary-600">
              {applicationId}
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Please save this ID to track your application status.
              We will review your application and contact you within 3-5 business days.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href={`/applications/status/${applicationId}`}
                className="block w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Track Application Status
              </a>
              <a
                href="/login"
                className="block w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="bg-primary-600 px-6 py-8 rounded-t-lg">
            <div className="flex items-center justify-center">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white text-center">
              Hospital Partnership Application
            </h1>
            <p className="mt-2 text-primary-100 text-center">
              Join the GrandPro HMSO Network
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hospital Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hospital Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter hospital name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hospital Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.hospitalAddress}
                    onChange={(e) => setFormData({...formData, hospitalAddress: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select State</option>
                    {nigerianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bedCapacity}
                    onChange={(e) => setFormData({...formData, bedCapacity: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Number of beds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Staff Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.staffCount}
                    onChange={(e) => setFormData({...formData, staffCount: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Total staff"
                  />
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Full name of hospital owner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="owner@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({...formData, ownerPhone: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalApplication;
