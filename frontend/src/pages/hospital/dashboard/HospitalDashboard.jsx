import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  BeakerIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/hospital'
});

export default function HospitalDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const hospitalId = localStorage.getItem('hospitalId') || 'default';

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['hospitalDashboard', selectedDate, hospitalId],
    queryFn: async () => {
      const response = await api.get('/dashboard', {
        params: { hospital_id: hospitalId }
      });
      return response.data.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Patients',
      value: dashboardData?.patient_statistics?.total_patients || 0,
      subtext: `${dashboardData?.patient_statistics?.today_visits || 0} visits today`,
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      name: "Today's Revenue",
      value: formatCurrency(dashboardData?.billing_statistics?.revenue_today),
      subtext: `${formatCurrency(dashboardData?.billing_statistics?.collected_today)} collected`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Inventory Alerts',
      value: dashboardData?.inventory_alerts?.low_stock || 0,
      subtext: `${dashboardData?.inventory_alerts?.out_of_stock || 0} out of stock`,
      icon: BeakerIcon,
      color: dashboardData?.inventory_alerts?.out_of_stock > 0 ? 'bg-red-500' : 'bg-yellow-500'
    },
    {
      name: 'Staff on Duty',
      value: dashboardData?.staff_statistics?.staff_on_duty || 0,
      subtext: `${dashboardData?.staff_statistics?.morning_shift || 0} morning shift`,
      icon: UserIcon,
      color: 'bg-purple-500'
    }
  ];

  const departments = [
    { name: 'Emergency', patients: 12, status: 'busy' },
    { name: 'OPD', patients: 45, status: 'moderate' },
    { name: 'Pediatrics', patients: 23, status: 'normal' },
    { name: 'Surgery', patients: 8, status: 'normal' },
    { name: 'ICU', patients: 5, status: 'critical' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time operational overview for Lagos Central Hospital
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.subtext}
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
        {/* Department Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
              Department Status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      dept.status === 'critical' ? 'bg-red-500' :
                      dept.status === 'busy' ? 'bg-yellow-500' :
                      dept.status === 'moderate' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">{dept.patients} patients</span>
                    {dept.status === 'critical' && (
                      <ExclamationTriangleIcon className="h-4 w-4 ml-2 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" />
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">New patient registered</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Adebayo Ogundimu - GP2025000145
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <span>5 minutes ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" />
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <CurrencyDollarIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Payment received</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            ₦15,000 - Bill #BILL2025000089
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <span>12 minutes ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Low stock alert</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Paracetamol 500mg - 50 units remaining
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <span>30 minutes ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <UserGroupIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Register Patient</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Generate Bill</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <BeakerIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Check Inventory</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
