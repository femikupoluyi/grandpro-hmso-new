import { useState } from 'react';
import { GiftIcon, SparklesIcon } from '@heroicons/react/24/outline';

const mockRewards = [
  {
    id: 1,
    reward_name: '10% Discount on Consultation',
    reward_type: 'DISCOUNT',
    points_required: 200,
    discount_percentage: 10,
    description: 'Get 10% off on your next consultation',
    terms_conditions: 'Valid for 30 days after redemption'
  },
  {
    id: 2,
    reward_name: 'Free Health Checkup',
    reward_type: 'FREE_SERVICE',
    points_required: 500,
    description: 'Complete health checkup including blood tests',
    terms_conditions: 'Must be used within 60 days'
  },
  {
    id: 3,
    reward_name: 'Priority Appointment Booking',
    reward_type: 'PRIORITY_ACCESS',
    points_required: 150,
    description: 'Skip the queue and book priority appointments',
    terms_conditions: 'Valid for 3 appointments'
  },
  {
    id: 4,
    reward_name: '20% Discount on Pharmacy',
    reward_type: 'DISCOUNT',
    points_required: 300,
    discount_percentage: 20,
    description: 'Save 20% on pharmacy purchases',
    terms_conditions: 'Maximum discount of ₦5,000'
  }
];

const mockTransactions = [
  { id: 1, type: 'EARNED', points: 20, description: 'Feedback submission', date: '2025-10-05' },
  { id: 2, type: 'EARNED', points: 10, description: 'Appointment booking', date: '2025-10-01' },
  { id: 3, type: 'REDEEMED', points: -200, description: 'Consultation discount', date: '2025-09-28' },
  { id: 4, type: 'EARNED', points: 50, description: 'Referral bonus', date: '2025-09-20' }
];

export default function LoyaltyRewards() {
  const [currentPoints] = useState(450);
  const [lifetimePoints] = useState(1250);
  const [tier] = useState('SILVER');
  const [selectedReward, setSelectedReward] = useState(null);

  const getTierBenefits = (tier) => {
    switch(tier) {
      case 'BRONZE':
        return ['5% discount on services', 'Birthday bonus points'];
      case 'SILVER':
        return ['10% discount on services', 'Priority support', 'Birthday bonus points'];
      case 'GOLD':
        return ['15% discount on services', 'Priority appointments', 'Free annual checkup', 'Birthday bonus points'];
      case 'PLATINUM':
        return ['20% discount on services', 'VIP lounge access', 'Free quarterly checkup', 'Personal health advisor', 'Birthday bonus points'];
      default:
        return [];
    }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'BRONZE':
        return 'from-orange-400 to-orange-600';
      case 'SILVER':
        return 'from-gray-400 to-gray-600';
      case 'GOLD':
        return 'from-yellow-400 to-yellow-600';
      case 'PLATINUM':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const canRedeem = (pointsRequired) => currentPoints >= pointsRequired;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Loyalty Rewards</h1>
        <p className="mt-1 text-sm text-gray-500">
          Earn points and redeem exclusive rewards
        </p>
      </div>

      {/* Points Overview */}
      <div className={`bg-gradient-to-r ${getTierColor(tier)} rounded-lg shadow-lg p-8 text-white`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">Available Points</p>
            <p className="text-4xl font-bold mt-1">{currentPoints}</p>
            <p className="text-sm opacity-90 mt-2">Lifetime: {lifetimePoints} points</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur">
              <SparklesIcon className="h-5 w-5 mr-1" />
              <span className="font-semibold">{tier} TIER</span>
            </div>
            <div className="mt-4 text-sm">
              <p className="opacity-90">Next Tier: {tier === 'SILVER' ? 'GOLD' : 'PLATINUM'}</p>
              <p className="opacity-90">Need {tier === 'SILVER' ? '550' : '3750'} more points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Rewards */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Available Rewards</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockRewards.map((reward) => (
                <div 
                  key={reward.id}
                  className={`border rounded-lg p-4 ${canRedeem(reward.points_required) ? 'hover:shadow-md cursor-pointer' : 'opacity-60'}`}
                  onClick={() => canRedeem(reward.points_required) && setSelectedReward(reward)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{reward.reward_name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{reward.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{reward.terms_conditions}</p>
                    </div>
                    <GiftIcon className={`h-5 w-5 ${canRedeem(reward.points_required) ? 'text-purple-500' : 'text-gray-300'}`} />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary-600">
                      {reward.points_required} pts
                    </span>
                    {canRedeem(reward.points_required) ? (
                      <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700">
                        Redeem
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Need {reward.points_required - currentPoints} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tier Benefits */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your {tier} Benefits</h3>
            <ul className="space-y-2">
              {getTierBenefits(tier).map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {mockTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{transaction.description}</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                  <span className={`font-semibold ${transaction.type === 'EARNED' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'EARNED' ? '+' : ''}{transaction.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Redemption Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Redemption</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to redeem <strong>{selectedReward.reward_name}</strong> for {selectedReward.points_required} points?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedReward(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Reward redeemed successfully! Check your email for the redemption code.');
                  setSelectedReward(null);
                }}
                className="btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
