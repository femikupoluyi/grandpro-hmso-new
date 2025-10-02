import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/operations'
});

export default function CommandCentre() {
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch command centre overview
  const { data: overviewData, isLoading, refetch } = useQuery({
    queryKey: ['commandCentreOverview'],
    queryFn: async () => {
      const response = await api.get('/command-centre/overview');
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false // Auto-refresh every 30 seconds
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ['operationalAlerts', selectedHospital, alertFilter],
    queryFn: async () => {
      const params = {};
      if (selectedHospital !== 'all') params.hospital_id = selectedHospital;
      if (alertFilter !== 'all') params.severity = alertFilter;
      
      const response = await api.get('/alerts', { params });
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-NG').format(num || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const overview = overviewData?.overview || {};
  const financial = overviewData?.financial_summary || {};
  const hospitals = overviewData?.hospitals || [];
  const alerts = alertsData || [];
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operations Command Centre</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time monitoring across all GrandPro HMSO facilities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Hospitals</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Critical Alerts ({criticalAlerts.length})
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {criticalAlerts.slice(0, 3).map((alert, index) => (
                    <li key={index}>{alert.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System-wide Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Hospitals
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {overview.total_hospitals || 0}
                    </div>
                    <div className="ml-2 text-sm text-green-600">
                      All Operational
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Patients
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(overview.total_patients)}
                    </div>
                    <div className="ml-2 text-sm text-gray-600">
                      {overview.today_encounters} today
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Revenue
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(financial.today_revenue)}
                    </div>
                    <div className="ml-2 flex items-center text-sm text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Staff on Duty
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(overview.staff_on_duty)}
                    </div>
                    <div className="ml-2 text-sm text-gray-600">
                      of {formatNumber(overview.total_staff)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Performance Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Hospital Performance Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today's Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Cases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Present
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
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {hospital.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {hospital.city}, {hospital.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(hospital.total_patients)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hospital.today_encounters}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      hospital.active_encounters > 50 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {hospital.active_encounters}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hospital.staff_on_duty} / {hospital.total_staff}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Operational
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      View Details
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      KPIs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Panel */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <BellAlertIcon className="h-5 w-5 mr-2 text-gray-400" />
                Active Alerts
              </h2>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No active alerts
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {alerts.slice(0, 10).map((alert, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {alert.message}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-400">
                          <span>{alert.hospital_name}</span>
                          <span className="mx-2">•</span>
                          <span>{alert.alert_type}</span>
                        </div>
                      </div>
                      <button className="ml-3 text-xs text-primary-600 hover:text-primary-900">
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
              Financial Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Today's Revenue</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(financial.today_revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Today's Collections</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(financial.today_collected)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Outstanding Amount</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {formatCurrency(financial.total_outstanding)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Bills Generated Today</span>
                <span className="text-lg font-semibold text-gray-900">
                  {financial.today_bills || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Avg Payment Days</span>
                <span className="text-lg font-semibold text-gray-900">
                  {Math.round(financial.avg_payment_days) || 0} days
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Collection Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((financial.today_collected / financial.today_revenue) * 100) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, Math.round((financial.today_collected / financial.today_revenue) * 100) || 0)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <ChartBarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Generate Reports</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <BellAlertIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Alert Settings</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Staff Roster</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Hospital Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
