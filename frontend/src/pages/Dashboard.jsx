import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Activity,
  DollarSign,
  Hospital,
  ClipboardList
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/overview`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Hospitals',
      value: stats?.overview?.hospitals?.total || 0,
      icon: Hospital,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Users',
      value: stats?.overview?.users?.total || 0,
      icon: Users,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Active Contracts',
      value: stats?.overview?.contracts?.active || 0,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: 'Pending Applications',
      value: stats?.overview?.applications?.pending || 0,
      icon: ClipboardList,
      color: 'bg-orange-500',
      change: '+3%'
    }
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Welcome to GrandPro HMSO Management Platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Monthly Revenue</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatCurrency(stats?.metrics?.revenue?.monthly || 0)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Yearly Revenue</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatCurrency(stats?.metrics?.revenue?.yearly || 0)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Average Occupancy</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats?.metrics?.averageOccupancy || 75}%
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats?.recentActivities?.applications?.map((app) => (
                  <li key={app.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {app.hospital_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {app.owner_name} • {app.state}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* State Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Hospital Distribution by State</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats?.stateDistribution?.map((state) => (
                  <li key={state.state} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {state.state}
                      </p>
                      <p className="text-sm text-gray-500">
                        {state.hospital_count} hospitals
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
