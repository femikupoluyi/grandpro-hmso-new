import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  GiftIcon,
  UserCircleIcon,
  BellIcon,
  HeartIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Mock data for demo
const mockPatientData = {
  profile: {
    firstName: 'Jane',
    lastName: 'Smith',
    registration_number: 'GP2025000123',
    blood_group: 'O+',
    genotype: 'AA',
    allergies: ['Penicillin'],
    insurance_provider: 'AXA Mansard',
    nhis_number: 'NHIS987654'
  },
  appointments: [
    {
      id: 1,
      doctor_name: 'Dr. Adewale Ogundimu',
      department: 'General Medicine',
      appointmentDate: '2025-10-15',
      appointmentTime: '10:00',
      status: 'SCHEDULED'
    },
    {
      id: 2,
      doctor_name: 'Dr. Fatima Abdullahi',
      department: 'Cardiology',
      appointmentDate: '2025-10-20',
      appointmentTime: '14:30',
      status: 'SCHEDULED'
    }
  ],
  loyalty: {
    points_balance: 450,
    lifetime_points: 1250,
    tier: 'SILVER',
    next_tier_points: 550
  },
  notifications: [
    {
      id: 1,
      type: 'APPOINTMENT_REMINDER',
      message: 'Reminder: You have an appointment tomorrow at 10:00 AM',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'REWARD',
      message: 'You earned 20 points for your recent feedback!',
      time: '1 day ago'
    }
  ]
};

export default function PatientPortal() {
  const { user } = useAuthStore();
  const [patientData] = useState(mockPatientData);

  const quickActions = [
    {
      name: 'Book Appointment',
      description: 'Schedule your next visit',
      href: '/patient/appointments',
      icon: CalendarIcon,
      iconBackground: 'bg-primary-500'
    },
    {
      name: 'Submit Feedback',
      description: 'Share your experience',
      href: '/patient/feedback',
      icon: ChatBubbleLeftRightIcon,
      iconBackground: 'bg-green-500'
    },
    {
      name: 'View Rewards',
      description: 'Check loyalty points',
      href: '/patient/rewards',
      icon: GiftIcon,
      iconBackground: 'bg-purple-500'
    },
    {
      name: 'Medical Records',
      description: 'Access your health records',
      href: '#',
      icon: DocumentTextIcon,
      iconBackground: 'bg-blue-500'
    }
  ];

  const getTierColor = (tier) => {
    switch(tier) {
      case 'BRONZE':
        return 'text-orange-600 bg-orange-100';
      case 'SILVER':
        return 'text-gray-600 bg-gray-100';
      case 'GOLD':
        return 'text-yellow-600 bg-yellow-100';
      case 'PLATINUM':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressToNextTier = () => {
    const currentPoints = patientData.loyalty.points_balance;
    const pointsForNextTier = patientData.loyalty.next_tier_points;
    const progress = (currentPoints / (currentPoints + pointsForNextTier)) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-2 text-primary-100">
              Your health journey continues here. How can we help you today?
            </p>
          </div>
          <UserCircleIcon className="h-16 w-16 text-primary-200" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patientData.appointments.length}
              </p>
              <p className="text-xs text-gray-500">Appointments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <GiftIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Loyalty Points</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patientData.loyalty.points_balance}
              </p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <HeartIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Blood Group</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patientData.profile.blood_group}
              </p>
              <p className="text-xs text-gray-500">{patientData.profile.genotype}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${getTierColor(patientData.loyalty.tier).replace('text-', 'bg-').replace('600', '100')}`}>
              <GiftIcon className={`h-6 w-6 ${getTierColor(patientData.loyalty.tier).split(' ')[0]}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Loyalty Tier</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patientData.loyalty.tier}
              </p>
              <p className="text-xs text-gray-500">Member</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actions Grid */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="relative rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 ${action.iconBackground} rounded-md p-2`}>
                      <action.icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{action.name}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
              <Link to="/patient/appointments" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {patientData.appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between border-l-4 border-primary-500 pl-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.doctor_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.department}
                      </p>
                      <div className="flex items-center mt-1">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')} at {appointment.appointmentTime}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Loyalty Progress */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Loyalty Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(patientData.loyalty.tier)}`}>
                    {patientData.loyalty.tier} TIER
                  </span>
                  <span className="text-sm text-gray-500">
                    {patientData.loyalty.next_tier_points} pts to next tier
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressToNextTier()}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {patientData.loyalty.points_balance} pts
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lifetime</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {patientData.loyalty.lifetime_points} pts
                  </p>
                </div>
              </div>
              <Link 
                to="/patient/rewards"
                className="block w-full text-center bg-purple-600 text-white rounded-md px-4 py-2 text-sm hover:bg-purple-700 transition-colors"
              >
                View Rewards
              </Link>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {patientData.notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-1.5 ${
                    notification.type === 'APPOINTMENT_REMINDER' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Registration Number</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {patientData.profile.registration_number}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Insurance Provider</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {patientData.profile.insurance_provider}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">NHIS Number</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {patientData.profile.nhis_number}
                </dd>
              </div>
              {patientData.profile.allergies.length > 0 && (
                <div>
                  <dt className="text-xs text-gray-500">Allergies</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {patientData.profile.allergies.map((allergy, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                      >
                        {allergy}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
