import { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleBottomCenterIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const CommunicationCampaigns = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock campaigns data
  const mockCampaigns = [
    {
      id: 'campaign-001',
      name: 'Health Awareness Week',
      targetAudience: 'all_patients',
      audienceCount: 15420,
      channels: ['email', 'sms'],
      status: 'active',
      scheduledDate: '2025-10-10',
      createdDate: '2025-10-01',
      sentCount: 8234,
      deliveredCount: 8100,
      openRate: 0.68,
      clickRate: 0.23,
      message: 'Dear {{first_name}}, join us for free health screening this week at your nearest GrandPro facility!'
    },
    {
      id: 'campaign-002',
      name: 'Loyalty Points Reminder',
      targetAudience: 'high_value_patients',
      audienceCount: 1479,
      channels: ['whatsapp', 'email'],
      status: 'scheduled',
      scheduledDate: '2025-10-15',
      createdDate: '2025-10-02',
      sentCount: 0,
      deliveredCount: 0,
      openRate: 0,
      clickRate: 0,
      message: 'Hi {{first_name}}, you have {{loyalty_points}} points! Visit our rewards catalog to redeem.'
    },
    {
      id: 'campaign-003',
      name: 'Vaccination Drive',
      targetAudience: 'all_patients',
      audienceCount: 15420,
      channels: ['sms'],
      status: 'completed',
      scheduledDate: '2025-09-20',
      createdDate: '2025-09-15',
      sentCount: 15420,
      deliveredCount: 14890,
      openRate: 0.72,
      clickRate: 0.31,
      message: 'Free flu vaccination available at all GrandPro hospitals. Book your slot today!'
    }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <EnvelopeIcon className="h-5 w-5" />;
      case 'sms': return <DevicePhoneMobileIcon className="h-5 w-5" />;
      case 'whatsapp': return <ChatBubbleBottomCenterIcon className="h-5 w-5" />;
      default: return <MegaphoneIcon className="h-5 w-5" />;
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'all_patients': return 'All Patients';
      case 'high_value_patients': return 'High Value Patients (Gold/Platinum)';
      case 'inactive_patients': return 'Inactive Patients (90+ days)';
      case 'all_owners': return 'All Hospital Owners';
      default: return audience;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <MegaphoneIcon className="h-10 w-10 text-blue-500" />
            <span className="text-2xl font-bold">45</span>
          </div>
          <h3 className="text-gray-600 text-sm">Total Campaigns</h3>
          <p className="text-green-500 text-xs mt-2">12 this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <EnvelopeIcon className="h-10 w-10 text-green-500" />
            <span className="text-2xl font-bold">45.2K</span>
          </div>
          <h3 className="text-gray-600 text-sm">Messages Sent</h3>
          <p className="text-green-500 text-xs mt-2">94% delivery rate</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="h-10 w-10 text-purple-500" />
            <span className="text-2xl font-bold">68%</span>
          </div>
          <h3 className="text-gray-600 text-sm">Avg Open Rate</h3>
          <p className="text-green-500 text-xs mt-2">+5% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <UserGroupIcon className="h-10 w-10 text-orange-500" />
            <span className="text-2xl font-bold">23%</span>
          </div>
          <h3 className="text-gray-600 text-sm">Avg Click Rate</h3>
          <p className="text-green-500 text-xs mt-2">+2% from last month</p>
        </div>
      </div>

      {/* Channel Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Channel Distribution</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <EnvelopeIcon className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">28,450</p>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-xs text-green-500 mt-1">72% open rate</p>
          </div>
          <div className="text-center">
            <DevicePhoneMobileIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">12,340</p>
            <p className="text-sm text-gray-600">SMS</p>
            <p className="text-xs text-green-500 mt-1">96% delivery</p>
          </div>
          <div className="text-center">
            <ChatBubbleBottomCenterIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">4,440</p>
            <p className="text-sm text-gray-600">WhatsApp</p>
            <p className="text-xs text-green-500 mt-1">89% read rate</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCampaignsList = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Audience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channels
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(campaign.createdDate).toLocaleDateString('en-NG')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Scheduled: {new Date(campaign.scheduledDate).toLocaleDateString('en-NG')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {getAudienceLabel(campaign.targetAudience)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {campaign.audienceCount.toLocaleString()} recipients
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    {campaign.channels.map((channel) => (
                      <span
                        key={channel}
                        className="text-gray-600"
                        title={channel}
                      >
                        {getChannelIcon(channel)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    {campaign.sentCount > 0 ? (
                      <>
                        <div className="text-sm">
                          Sent: {campaign.sentCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Open: {(campaign.openRate * 100).toFixed(0)}% • 
                          Click: {(campaign.clickRate * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Not sent yet</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {campaign.status === 'scheduled' && (
                      <button
                        onClick={() => alert('Campaign started!')}
                        className="text-green-600 hover:text-green-900"
                        title="Start Now"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => alert('Campaign paused!')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Pause"
                      >
                        <PauseIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setActiveTab('details');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => alert('Edit campaign')}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
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

  const renderCampaignDetails = () => {
    if (!selectedCampaign) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setActiveTab('campaigns');
            setSelectedCampaign(null);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Campaigns
        </button>

        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedCampaign.name}</h2>
              <p className="text-gray-600">{getAudienceLabel(selectedCampaign.targetAudience)}</p>
              <div className="flex space-x-4 mt-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCampaign.status)}`}>
                  {selectedCampaign.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created: {new Date(selectedCampaign.createdDate).toLocaleDateString('en-NG')}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {selectedCampaign.channels.map((channel) => (
                <span key={channel} className="text-gray-600">
                  {getChannelIcon(channel)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{selectedCampaign.audienceCount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Target Audience</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <EnvelopeIcon className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{selectedCampaign.sentCount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Messages Sent</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <p className="text-2xl font-bold">{(selectedCampaign.openRate * 100).toFixed(0)}%</p>
            <p className="text-sm text-gray-600">Open Rate</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <CheckCircleIcon className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{(selectedCampaign.clickRate * 100).toFixed(0)}%</p>
            <p className="text-sm text-gray-600">Click Rate</p>
          </div>
        </div>

        {/* Message Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Message Preview</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{selectedCampaign.message}</p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              <strong>Variables used:</strong> {'{first_name}'}, {'{loyalty_points}'}
            </p>
          </div>
        </div>

        {/* Delivery Statistics */}
        {selectedCampaign.sentCount > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sent</span>
                <span className="font-medium">{selectedCampaign.sentCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivered</span>
                <span className="font-medium">{selectedCampaign.deliveredCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Opened</span>
                <span className="font-medium">
                  {Math.round(selectedCampaign.sentCount * selectedCampaign.openRate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clicked</span>
                <span className="font-medium">
                  {Math.round(selectedCampaign.sentCount * selectedCampaign.clickRate).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Communication Campaigns</h1>
        <p className="text-gray-600">Manage multi-channel marketing campaigns</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6">
        {['overview', 'campaigns', 'templates', 'analytics', 'details'].map((tab) => (
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
      {activeTab === 'campaigns' && renderCampaignsList()}
      {activeTab === 'details' && renderCampaignDetails()}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Campaign</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="Enter campaign name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="all_patients">All Patients</option>
                  <option value="high_value_patients">High Value Patients (Gold/Platinum)</option>
                  <option value="inactive_patients">Inactive Patients (90+ days)</option>
                  <option value="all_owners">All Hospital Owners</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channels
                </label>
                <div className="space-y-2">
                  {['email', 'sms', 'whatsapp'].map((channel) => (
                    <label key={channel} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="time"
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows="4"
                  placeholder="Enter your message. Use {{first_name}}, {{loyalty_points}}, etc. for personalization"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Campaign created!');
                  setShowCreateModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationCampaigns;
