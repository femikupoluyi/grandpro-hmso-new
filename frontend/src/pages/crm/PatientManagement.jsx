import { useState, useEffect } from 'react';
import {
  UserIcon,
  CalendarIcon,
  StarIcon,
  GiftIcon,
  ChatBubbleBottomCenterTextIcon,
  HeartIcon,
  TrophyIcon,
  BellIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const PatientManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data
  const mockPatients = [
    {
      id: 'patient-001',
      name: 'Chioma Okonkwo',
      email: 'chioma.okonkwo@gmail.com',
      phone: '+234 806 789 0123',
      registrationNumber: 'PAT-2024-001',
      age: 32,
      gender: 'Female',
      bloodGroup: 'O+',
      loyaltyTier: 'gold',
      loyaltyPoints: 5420,
      lifetimePoints: 12350,
      lastVisit: '2025-09-28',
      nextAppointment: '2025-10-15',
      totalVisits: 18,
      averageRating: 4.5,
      communicationPreference: 'whatsapp',
      conditions: ['Hypertension'],
      insurance: 'NHIS'
    },
    {
      id: 'patient-002',
      name: 'Ibrahim Musa',
      email: 'ibrahim.musa@yahoo.com',
      phone: '+234 701 234 5678',
      registrationNumber: 'PAT-2024-002',
      age: 45,
      gender: 'Male',
      bloodGroup: 'A+',
      loyaltyTier: 'silver',
      loyaltyPoints: 2850,
      lifetimePoints: 6200,
      lastVisit: '2025-09-15',
      nextAppointment: null,
      totalVisits: 12,
      averageRating: 4.2,
      communicationPreference: 'sms',
      conditions: ['Diabetes', 'Hypertension'],
      insurance: 'Private'
    },
    {
      id: 'patient-003',
      name: 'Folake Adebisi',
      email: 'folake.adebisi@gmail.com',
      phone: '+234 803 987 6543',
      registrationNumber: 'PAT-2024-003',
      age: 28,
      gender: 'Female',
      bloodGroup: 'B+',
      loyaltyTier: 'platinum',
      loyaltyPoints: 10250,
      lifetimePoints: 25000,
      lastVisit: '2025-10-01',
      nextAppointment: '2025-10-08',
      totalVisits: 35,
      averageRating: 4.8,
      communicationPreference: 'email',
      conditions: [],
      insurance: 'HMO'
    }
  ];

  const loyaltyRewards = [
    { id: 1, name: 'Free Consultation', points: 1000, tier: 'bronze' },
    { id: 2, name: '20% Discount on Lab Tests', points: 500, tier: 'bronze' },
    { id: 3, name: 'Priority Appointment Booking', points: 2000, tier: 'silver' },
    { id: 4, name: 'Free Health Screening', points: 3000, tier: 'silver' },
    { id: 5, name: 'Annual Health Check Package', points: 5000, tier: 'gold' },
    { id: 6, name: 'Family Member Discount (30%)', points: 7500, tier: 'gold' },
    { id: 7, name: 'Executive Health Package', points: 10000, tier: 'platinum' },
    { id: 8, name: 'VIP Room Upgrade', points: 15000, tier: 'platinum' }
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      setPatients(mockPatients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <UserIcon className="h-10 w-10 text-blue-500" />
            <span className="text-2xl font-bold">15,420</span>
          </div>
          <h3 className="text-gray-600 text-sm">Total Patients</h3>
          <p className="text-green-500 text-xs mt-2">+523 this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <CalendarIcon className="h-10 w-10 text-green-500" />
            <span className="text-2xl font-bold">1,256</span>
          </div>
          <h3 className="text-gray-600 text-sm">Appointments</h3>
          <p className="text-blue-500 text-xs mt-2">85 today</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <TrophyIcon className="h-10 w-10 text-purple-500" />
            <span className="text-2xl font-bold">8,234</span>
          </div>
          <h3 className="text-gray-600 text-sm">Loyalty Members</h3>
          <p className="text-green-500 text-xs mt-2">425 avg points</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <StarIcon className="h-10 w-10 text-yellow-500" />
            <span className="text-2xl font-bold">4.2</span>
          </div>
          <h3 className="text-gray-600 text-sm">Avg Rating</h3>
          <p className="text-green-500 text-xs mt-2">+0.3 from last month</p>
        </div>
      </div>

      {/* Loyalty Tier Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Loyalty Tier Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🥉</div>
            <p className="text-2xl font-bold">3,299</p>
            <p className="text-sm text-gray-600">Bronze</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🥈</div>
            <p className="text-2xl font-bold">3,456</p>
            <p className="text-sm text-gray-600">Silver</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🥇</div>
            <p className="text-2xl font-bold">1,245</p>
            <p className="text-sm text-gray-600">Gold</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💎</div>
            <p className="text-2xl font-bold">234</p>
            <p className="text-sm text-gray-600">Platinum</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatientsList = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Patients</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search patients..."
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Patient
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loyalty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satisfaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {patient.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      {patient.phone} • {patient.registrationNumber}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(patient.loyaltyTier)}`}>
                      {getTierIcon(patient.loyaltyTier)} {patient.loyaltyTier}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {patient.loyaltyPoints.toLocaleString()} pts
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium">{patient.totalVisits}</div>
                    <div className="text-xs text-gray-500">
                      Last: {new Date(patient.lastVisit).toLocaleDateString('en-NG')}
                    </div>
                    {patient.nextAppointment && (
                      <div className="text-xs text-blue-600">
                        Next: {new Date(patient.nextAppointment).toLocaleDateString('en-NG')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIconSolid
                          key={star}
                          className={`h-4 w-4 ${
                            star <= patient.averageRating
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {patient.averageRating}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowAppointmentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Schedule Appointment"
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowFeedbackModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="Collect Feedback"
                    >
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowLoyaltyModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="Manage Loyalty"
                    >
                      <GiftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setActiveTab('journey');
                      }}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Journey"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPatientJourney = () => {
    if (!selectedPatient) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setActiveTab('patients');
            setSelectedPatient(null);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Patients
        </button>

        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
              <p className="text-gray-600">{selectedPatient.registrationNumber}</p>
              <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                <span>{selectedPatient.age} years • {selectedPatient.gender}</span>
                <span>Blood Group: {selectedPatient.bloodGroup}</span>
                <span>Insurance: {selectedPatient.insurance}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getTierColor(selectedPatient.loyaltyTier)}`}>
                {getTierIcon(selectedPatient.loyaltyTier)} {selectedPatient.loyaltyTier.toUpperCase()}
              </span>
              <p className="text-2xl font-bold mt-2">{selectedPatient.loyaltyPoints.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Loyalty Points</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <CalendarIcon className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{selectedPatient.totalVisits}</p>
            <p className="text-sm text-gray-600">Total Visits</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <HeartIcon className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{selectedPatient.conditions.length || 0}</p>
            <p className="text-sm text-gray-600">Health Conditions</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <StarIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <p className="text-2xl font-bold">{selectedPatient.averageRating}</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <GiftIcon className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{selectedPatient.lifetimePoints.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Lifetime Points</p>
          </div>
        </div>

        {/* Visit Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Visits</h3>
          <div className="space-y-4">
            {[
              { date: '2025-10-01', type: 'Consultation', doctor: 'Dr. Adebayo', rating: 5 },
              { date: '2025-09-15', type: 'Follow-up', doctor: 'Dr. Adebayo', rating: 4 },
              { date: '2025-08-20', type: 'Lab Test', doctor: 'Lab Tech', rating: 5 }
            ].map((visit, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{visit.type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(visit.date).toLocaleDateString('en-NG')} • {visit.doctor}
                  </p>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIconSolid
                      key={star}
                      className={`h-4 w-4 ${
                        star <= visit.rating ? 'text-yellow-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLoyaltyRewards = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Loyalty Rewards Catalog</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loyaltyRewards.map((reward) => (
            <div key={reward.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{reward.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(reward.tier)}`}>
                  {reward.tier}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-bold text-blue-600">
                  {reward.points.toLocaleString()} pts
                </p>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Redeem
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient CRM</h1>
        <p className="text-gray-600">Manage patients, appointments, and loyalty program</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6">
        {['overview', 'patients', 'appointments', 'loyalty', 'journey'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'patients' && renderPatientsList()}
      {activeTab === 'loyalty' && renderLoyaltyRewards()}
      {activeTab === 'journey' && renderPatientJourney()}

      {/* Appointment Modal */}
      {showAppointmentModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>
                <input
                  type="text"
                  value={selectedPatient.name}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Procedure</option>
                  <option>Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Dr. Adebayo Ogundimu</option>
                  <option>Dr. Funke Adeyemi</option>
                  <option>Dr. Ibrahim Musa</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Appointment scheduled!');
                  setShowAppointmentModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Collect Patient Feedback</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="text-3xl hover:scale-110 transition-transform">
                      <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Would you recommend us? (0-10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  rows="4"
                  placeholder="Please share your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Feedback collected! +50 loyalty points awarded.');
                  setShowFeedbackModal(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Modal */}
      {showLoyaltyModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Manage Loyalty Points</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-3xl font-bold text-blue-900">
                  {selectedPatient.loyaltyPoints.toLocaleString()} pts
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {getTierIcon(selectedPatient.loyaltyTier)} {selectedPatient.loyaltyTier} Tier
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Award Points</option>
                  <option>Deduct Points</option>
                  <option>Redeem Reward</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  placeholder="Enter points amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  placeholder="Enter reason"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Points updated!');
                  setShowLoyaltyModal(false);
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
