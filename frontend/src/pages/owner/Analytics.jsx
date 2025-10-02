import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ownerAPI } from '../../services/api';
import {
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import {
  ChartBarIcon,
  TrendingUpIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Mock data with Nigerian context
const mockAnalyticsData = {
  revenue: {
    monthly: [
      { month: 'Jan', revenue: 4500000, target: 5000000, patients: 420 },
      { month: 'Feb', revenue: 4800000, target: 5000000, patients: 445 },
      { month: 'Mar', revenue: 5200000, target: 5000000, patients: 478 },
      { month: 'Apr', revenue: 5500000, target: 5500000, patients: 512 },
      { month: 'May', revenue: 5300000, target: 5500000, patients: 498 },
      { month: 'Jun', revenue: 5800000, target: 5500000, patients: 534 },
      { month: 'Jul', revenue: 6200000, target: 6000000, patients: 567 },
      { month: 'Aug', revenue: 6500000, target: 6000000, patients: 589 },
      { month: 'Sep', revenue: 6800000, target: 6500000, patients: 612 },
      { month: 'Oct', revenue: 3200000, target: 3500000, patients: 298 } // Current month (partial)
    ],
    ytd: 54800000,
    ytdTarget: 55000000,
    growth: 0.15,
    avgMonthly: 5480000
  },
  departments: [
    { name: 'General Medicine', revenue: 18500000, percentage: 33.8 },
    { name: 'Surgery', revenue: 12300000, percentage: 22.4 },
    { name: 'Pediatrics', revenue: 9200000, percentage: 16.8 },
    { name: 'Obstetrics', revenue: 7600000, percentage: 13.9 },
    { name: 'Emergency', revenue: 4800000, percentage: 8.8 },
    { name: 'Others', revenue: 2400000, percentage: 4.3 }
  ],
  paymentMethods: [
    { method: 'Cash', amount: 28500000, percentage: 52, count: 3456 },
    { method: 'Insurance (NHIS)', amount: 13700000, percentage: 25, count: 1234 },
    { method: 'HMO', amount: 8200000, percentage: 15, count: 892 },
    { method: 'Bank Transfer', amount: 3300000, percentage: 6, count: 412 },
    { method: 'Card', amount: 1100000, percentage: 2, count: 189 }
  ],
  patientMetrics: {
    totalPatients: 4953,
    newPatients: 298,
    returningPatients: 4655,
    averageVisitsPerPatient: 2.8,
    patientSatisfaction: 4.5,
    retentionRate: 0.89
  },
  operationalMetrics: {
    bedOccupancy: 0.75,
    averageLengthOfStay: 3.2,
    staffUtilization: 0.82,
    equipmentUtilization: 0.68,
    emergencyResponseTime: 12, // minutes
    appointmentNoShowRate: 0.08
  },
  weeklyTrends: [
    { week: 'Week 1', revenue: 1450000, patients: 89, satisfaction: 4.6 },
    { week: 'Week 2', revenue: 1380000, patients: 82, satisfaction: 4.4 },
    { week: 'Week 3', revenue: 1520000, patients: 94, satisfaction: 4.5 },
    { week: 'Week 4', revenue: 1600000, patients: 98, satisfaction: 4.7 }
  ],
  comparisons: {
    revenueVsLastYear: 0.23,
    patientsVsLastYear: 0.18,
    satisfactionVsLastYear: 0.05,
    costsVsLastYear: 0.12
  }
};

function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [analyticsData] = useState(mockAnalyticsData);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    const formatted = (value * 100).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const getMetricCard = (title, value, change, icon, color = 'indigo') => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(change)}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last year</span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Performance</h1>
            <p className="text-gray-600 mt-1">Lagos Central Hospital - October 2025</p>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getMetricCard(
          'YTD Revenue',
          formatCurrency(analyticsData.revenue.ytd),
          analyticsData.comparisons.revenueVsLastYear,
          <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />,
          'indigo'
        )}
        {getMetricCard(
          'Total Patients',
          analyticsData.patientMetrics.totalPatients.toLocaleString(),
          analyticsData.comparisons.patientsVsLastYear,
          <UsersIcon className="h-6 w-6 text-green-600" />,
          'green'
        )}
        {getMetricCard(
          'Patient Satisfaction',
          `${analyticsData.patientMetrics.patientSatisfaction}/5.0`,
          analyticsData.comparisons.satisfactionVsLastYear,
          <TrendingUpIcon className="h-6 w-6 text-purple-600" />,
          'purple'
        )}
        {getMetricCard(
          'Retention Rate',
          `${(analyticsData.patientMetrics.retentionRate * 100).toFixed(0)}%`,
          0.03,
          <ChartBarIcon className="h-6 w-6 text-blue-600" />,
          'blue'
        )}
      </div>

      {/* Revenue Trends */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends & Targets</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.revenue.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis 
              tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#4F46E5" 
              strokeWidth={2}
              name="Actual Revenue"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#EF4444" 
              strokeDasharray="5 5"
              name="Target"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Revenue */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.departments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {analyticsData.departments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.paymentMethods}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Operational Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {(analyticsData.operationalMetrics.bedOccupancy * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Bed Occupancy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {analyticsData.operationalMetrics.averageLengthOfStay} days
            </p>
            <p className="text-sm text-gray-600 mt-1">Avg Length of Stay</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {(analyticsData.operationalMetrics.staffUtilization * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Staff Utilization</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {(analyticsData.operationalMetrics.equipmentUtilization * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Equipment Use</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {analyticsData.operationalMetrics.emergencyResponseTime} min
            </p>
            <p className="text-sm text-gray-600 mt-1">Emergency Response</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {(analyticsData.operationalMetrics.appointmentNoShowRate * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">No-Show Rate</p>
          </div>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance (October)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analyticsData.weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis yAxisId="left" tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'revenue') return formatCurrency(value);
                if (name === 'satisfaction') return `${value}/5.0`;
                return value;
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#4F46E5" name="Revenue" />
            <Bar yAxisId="right" dataKey="patients" fill="#10B981" name="Patients" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Key Insights & Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <span className="text-xs font-bold">1</span>
            </div>
            <p className="text-sm">
              Revenue is <span className="font-semibold">23% higher</span> than last year, exceeding targets by ₦3.2M this quarter.
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <span className="text-xs font-bold">2</span>
            </div>
            <p className="text-sm">
              General Medicine and Surgery departments generate <span className="font-semibold">56%</span> of total revenue - consider expansion.
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <span className="text-xs font-bold">3</span>
            </div>
            <p className="text-sm">
              Cash payments still dominate at <span className="font-semibold">52%</span> - opportunity to increase insurance partnerships.
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <span className="text-xs font-bold">4</span>
            </div>
            <p className="text-sm">
              Patient satisfaction improved to <span className="font-semibold">4.5/5.0</span> - maintain quality while scaling operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
