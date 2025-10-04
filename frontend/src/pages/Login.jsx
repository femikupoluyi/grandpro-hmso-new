import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { mockLogin } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMockLogin = async (role) => {
    setLoading(true);
    try {
      // Call mockLogin (it's synchronous, not async)
      const result = mockLogin(role);
      
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (result.success) {
        // Navigate based on role
        switch(role) {
          case 'PATIENT':
            navigate('/patient');
            break;
          case 'OWNER':
            navigate('/owner');
            break;
          case 'STAFF':
            navigate('/staff');
            break;
          case 'ADMIN':
            navigate('/admin');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Mock login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-extrabold text-primary-800">
            GrandPro HMSO
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select a demo role to explore the system
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="space-y-4">
              {/* Owner Login Card */}
              <div 
                onClick={() => handleMockLogin('OWNER')}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary-400 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900">
                      Hospital Owner
                    </p>
                    <p className="text-sm text-gray-500">
                      Access contract status, payout history, and management dashboard
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Login Card */}
              <div 
                onClick={() => handleMockLogin('PATIENT')}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary-400 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-success-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900">
                      Patient
                    </p>
                    <p className="text-sm text-gray-500">
                      Schedule appointments, view rewards, and submit feedback
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Login Card */}
              <div 
                onClick={() => handleMockLogin('STAFF')}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary-400 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900">
                      Hospital Staff
                    </p>
                    <p className="text-sm text-gray-500">
                      Access EMR, billing, inventory, and operations
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Login Card */}
              <div 
                onClick={() => handleMockLogin('ADMIN')}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary-400 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900">
                      Administrator
                    </p>
                    <p className="text-sm text-gray-500">
                      Full system access and management capabilities
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Demo Mode - Click any role to login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
