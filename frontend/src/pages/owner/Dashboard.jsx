import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ownerAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Mock data for demo
const mockOwnerProfile = {
  id: 'owner-001',
  firstName: 'John',
  lastName: 'Doe',
  hospital_name: 'Lagos Central Hospital',
  contracts: [
    {
      id: 'contract-001',
      contractNumber: 'CTR202500123',
      title: 'Hospital Management Agreement',
      status: 'ACTIVE',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      contractValue: 5000000,
      revenueShareRate: 15
    }
  ],
  recentPayouts: [
    {
      id: 1,
      payout_number: 'PAY202510001',
      payout_period: '2025-10',
      amount_naira: 750000,
      status: 'COMPLETED',
      paid_date: '2025-10-05'
    },
    {
      id: 2,
      payout_number: 'PAY202509001',
      payout_period: '2025-09',
      amount_naira: 680000,
      status: 'COMPLETED',
      paid_date: '2025-09-05'
    }
  ],
  satisfaction: {
    avg_overall: 4.5,
    avg_communication: 4.7,
    avg_support: 4.3,
    avg_payment: 4.8,
    total_surveys: 12
  }
};

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState(mockOwnerProfile);

  // In production, uncomment this to fetch real data
  // const { data: profileData, isLoading } = useQuery({
  //   queryKey: ['ownerProfile', user?.ownerId],
  //   queryFn: () => ownerAPI.getProfile(user?.ownerId),
  //   enabled: !!user?.ownerId
  // });

  const stats = [
    {
      name: 'Total Revenue',
      value: '₦15.2M',
      change: '+12%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Active Contracts',
      value: profileData?.contracts?.filter(c => c.status === 'ACTIVE').length || 0,
      change: 'Active',
      changeType: 'neutral',
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Satisfaction Score',
      value: profileData?.satisfaction?.avg_overall?.toFixed(1) || '0',
      change: '/5.0',
      changeType: 'neutral',
      icon: ChartBarIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Pending Payouts',
      value: '₦2.5M',
      change: '3 payments',
      changeType: 'neutral',
      icon: BanknotesIcon,
      color: 'bg-yellow-500'
    }
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Owner Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.firstName}! Here's your hospital management overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Contracts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Contracts</h2>
          </div>
          <div className="px-6 py-4">
            {profileData?.contracts?.map((contract) => (
              <div key={contract.id} className="mb-4 last:mb-0 border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {contract.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Contract #{contract.contractNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(contract.startDate), 'MMM dd, yyyy')} - {' '}
                      {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contract.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contract.status}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      {formatCurrency(contract.contractValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contract.revenueShareRate}% revenue share
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Payouts</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flow-root">
              <ul className="-my-3 divide-y divide-gray-200">
                {profileData?.recentPayouts?.map((payout) => (
                  <li key={payout.id} className="py-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(payout.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payout.amount_naira)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payout.payout_number} • Period: {payout.payout_period}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {payout.paid_date && format(new Date(payout.paid_date), 'MMM dd, yyyy')}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          payout.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800'
                            : payout.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Satisfaction Metrics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Satisfaction Metrics</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {profileData?.satisfaction?.avg_overall?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-500">Overall Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profileData?.satisfaction?.avg_communication?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-500">Communication</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {profileData?.satisfaction?.avg_support?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-500">Support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {profileData?.satisfaction?.avg_payment?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-500">Payment</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Based on {profileData?.satisfaction?.total_surveys || 0} surveys
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
