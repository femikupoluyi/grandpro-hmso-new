import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  StarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const OwnerManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);

  // Mock data for demonstration
  const mockOwners = [
    {
      id: 'owner-001',
      name: 'Dr. Adebayo Ogundimu',
      hospital: 'Lagos Premier Hospital',
      email: 'adebayo@lagospremier.ng',
      phone: '+234 803 456 7890',
      contractStatus: 'active',
      contractType: 'premium',
      contractStart: '2024-01-01',
      contractEnd: '2025-12-31',
      revenueShare: 70,
      totalRevenue: 45000000,
      lastPayout: 3150000,
      nextPayoutDate: '2025-10-31',
      satisfactionScore: 4.5,
      joinedDate: '2024-01-01',
      totalPatients: 1250,
      monthlyGrowth: 12
    },
    {
      id: 'owner-002',
      name: 'Dr. Funke Adeyemi',
      hospital: 'Abuja Medical Centre',
      email: 'funke@abujamedical.ng',
      phone: '+234 805 123 4567',
      contractStatus: 'active',
      contractType: 'standard',
      contractStart: '2024-03-15',
      contractEnd: '2026-03-14',
      revenueShare: 65,
      totalRevenue: 32000000,
      lastPayout: 2080000,
      nextPayoutDate: '2025-10-31',
      satisfactionScore: 4.2,
      joinedDate: '2024-03-15',
      totalPatients: 890,
      monthlyGrowth: 8
    }
  ];

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // const response = await fetch('/api/crm/owners');
      // const data = await response.json();
      setOwners(mockOwners);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (owner) => {
    setSelectedOwner(owner);
    setShowPayoutModal(true);
  };

  const processPayout = async () => {
    try {
      // API call to process payout
      const response = await fetch(`/api/crm/enhanced/owners/${selectedOwner.id}/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: {
            start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            end: new Date()
          }
        })
      });
      
      if (response.ok) {
        alert('Payout processed successfully!');
        setShowPayoutModal(false);
        fetchOwners();
      }
    } catch (error) {
      console.error('Failed to process payout:', error);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <UserGroupIcon className="h-10 w-10 text-blue-500" />
          <span className="text-2xl font-bold">156</span>
        </div>
        <h3 className="text-gray-600 text-sm">Total Owners</h3>
        <p className="text-green-500 text-xs mt-2">+12% from last month</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <BanknotesIcon className="h-10 w-10 text-green-500" />
          <span className="text-2xl font-bold">₦425M</span>
        </div>
        <h3 className="text-gray-600 text-sm">Total Revenue</h3>
        <p className="text-green-500 text-xs mt-2">+18% from last month</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <CurrencyDollarIcon className="h-10 w-10 text-purple-500" />
          <span className="text-2xl font-bold">₦85M</span>
        </div>
        <h3 className="text-gray-600 text-sm">Pending Payouts</h3>
        <p className="text-orange-500 text-xs mt-2">15 owners pending</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <StarIcon className="h-10 w-10 text-yellow-500" />
          <span className="text-2xl font-bold">4.3</span>
        </div>
        <h3 className="text-gray-600 text-sm">Avg Satisfaction</h3>
        <p className="text-green-500 text-xs mt-2">+0.2 from last quarter</p>
      </div>
    </div>
  );

  const renderOwnersList = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Hospital Owners</h2>
          <button
            onClick={() => setShowContractModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Contract
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
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
            {owners.map((owner) => (
              <tr key={owner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {owner.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {owner.hospital}
                    </div>
                    <div className="text-xs text-gray-400">
                      {owner.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      owner.contractStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {owner.contractStatus}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {owner.contractType} ({owner.revenueShare}%)
                    </div>
                    <div className="text-xs text-gray-400">
                      Expires: {new Date(owner.contractEnd).toLocaleDateString('en-NG')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      ₦{(owner.totalRevenue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">
                      Last: ₦{(owner.lastPayout / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-blue-600">
                      Next: {new Date(owner.nextPayoutDate).toLocaleDateString('en-NG')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIconSolid
                          key={star}
                          className={`h-4 w-4 ${
                            star <= owner.satisfactionScore
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {owner.satisfactionScore}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleProcessPayout(owner)}
                      className="text-green-600 hover:text-green-900"
                      title="Process Payout"
                    >
                      <BanknotesIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOwner(owner);
                        setShowCommunicationModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Send Message"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOwner(owner);
                        setActiveTab('details');
                      }}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Details"
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

  const renderOwnerDetails = () => {
    if (!selectedOwner) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setActiveTab('owners');
            setSelectedOwner(null);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Owners
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">{selectedOwner.name}</h2>
          <p className="text-gray-600">{selectedOwner.hospital}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Contract Details
              </h3>
              <p className="text-sm text-gray-700">
                Type: {selectedOwner.contractType}
              </p>
              <p className="text-sm text-gray-700">
                Revenue Share: {selectedOwner.revenueShare}%
              </p>
              <p className="text-sm text-gray-700">
                Period: {new Date(selectedOwner.contractStart).toLocaleDateString('en-NG')} - {new Date(selectedOwner.contractEnd).toLocaleDateString('en-NG')}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-900 mb-2">
                Financial Performance
              </h3>
              <p className="text-sm text-gray-700">
                Total Revenue: ₦{(selectedOwner.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-700">
                Last Payout: ₦{(selectedOwner.lastPayout / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-700">
                Growth: +{selectedOwner.monthlyGrowth}% monthly
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">
                Operations Metrics
              </h3>
              <p className="text-sm text-gray-700">
                Total Patients: {selectedOwner.totalPatients}
              </p>
              <p className="text-sm text-gray-700">
                Satisfaction: {selectedOwner.satisfactionScore}/5
              </p>
              <p className="text-sm text-gray-700">
                Member Since: {new Date(selectedOwner.joinedDate).toLocaleDateString('en-NG')}
              </p>
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payout History</h3>
          <div className="space-y-3">
            {[
              { date: '2025-09-30', amount: 3150000, status: 'completed' },
              { date: '2025-08-31', amount: 2980000, status: 'completed' },
              { date: '2025-07-31', amount: 3220000, status: 'completed' }
            ].map((payout, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">
                    ₦{(payout.amount / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(payout.date).toLocaleDateString('en-NG')}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  payout.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Owner CRM</h1>
        <p className="text-gray-600">Manage hospital owners and partnerships</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6">
        {['overview', 'owners', 'contracts', 'payouts', 'details'].map((tab) => (
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
      {activeTab === 'owners' && renderOwnersList()}
      {activeTab === 'details' && renderOwnerDetails()}

      {/* Payout Modal */}
      {showPayoutModal && selectedOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Process Payout</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Owner</p>
                <p className="font-medium">{selectedOwner.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Hospital</p>
                <p className="font-medium">{selectedOwner.hospital}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Period</p>
                <p className="font-medium">
                  {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-NG')} - 
                  {' ' + new Date().toLocaleDateString('en-NG')}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Calculated Amount</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₦{(selectedOwner.lastPayout / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={processPayout}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Process Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Modal */}
      {showCommunicationModal && selectedOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Send Communication</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={`${selectedOwner.name} - ${selectedOwner.hospital}`}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Email</option>
                  <option>WhatsApp</option>
                  <option>SMS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows="5"
                  placeholder="Enter your message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCommunicationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Message sent!');
                  setShowCommunicationModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerManagement;
