import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Users,
  Bed,
  DollarSign,
  AlertCircle,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import RealTimeChart from './RealTimeChart';

const HospitalPerformanceCard = ({ hospital, onSelectHospital }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('occupancy');

  const metrics = hospital.metrics || {};
  
  // Generate mock historical data for charts
  const generateChartData = (baseValue, variance = 10) => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: baseValue + (Math.random() - 0.5) * variance
    }));
  };

  const chartData = {
    occupancy: generateChartData(metrics.occupancy?.percentage || 0, 15),
    revenue: generateChartData(metrics.finance?.dailyRevenue / 1000000 || 0, 0.5),
    patients: generateChartData(metrics.patients?.newToday || 0, 20),
    staff: generateChartData(metrics.staffing?.attendanceRate || 0, 10)
  };

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getOccupancyStatus = (percentage) => {
    if (percentage >= 95) return { color: 'bg-red-100 text-red-800', label: 'Critical' };
    if (percentage >= 85) return { color: 'bg-yellow-100 text-yellow-800', label: 'High' };
    if (percentage >= 70) return { color: 'bg-green-100 text-green-800', label: 'Optimal' };
    return { color: 'bg-blue-100 text-blue-800', label: 'Low' };
  };

  const occupancyStatus = getOccupancyStatus(metrics.occupancy?.percentage || 0);

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      {/* Hospital Header */}
      <div 
        className="p-4 border-b border-gray-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{hospital.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="h-3 w-3" />
                {hospital.location}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${occupancyStatus.color}`}>
              {occupancyStatus.label}
            </span>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Bed className="h-4 w-4 text-gray-500" />
            <span className={`text-xs font-medium ${
              metrics.occupancy?.percentage > 90 ? 'text-red-600' : 'text-green-600'
            }`}>
              {metrics.occupancy?.percentage > 90 ? '↑' : '↓'} 2%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.occupancy?.percentage?.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gray-500">Occupancy</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-green-600">
              ↑ 12
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.patients?.newToday || 0}
          </p>
          <p className="text-xs text-gray-500">New Patients</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-green-600">
              ↑ 8%
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ₦{((metrics.finance?.dailyRevenue || 0) / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <AlertCircle className="h-4 w-4 text-gray-500" />
            <span className={`text-xs font-medium ${
              (metrics.alerts?.critical || 0) > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {metrics.alerts?.critical || 0}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(metrics.alerts?.critical || 0) + (metrics.alerts?.warning || 0)}
          </p>
          <p className="text-xs text-gray-500">Active Alerts</p>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <>
          {/* Metric Selection Tabs */}
          <div className="px-4 pb-2">
            <div className="flex gap-2 border-b border-gray-200">
              {['occupancy', 'revenue', 'patients', 'staff'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-2 text-sm font-medium capitalize ${
                    selectedMetric === metric
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Chart */}
          <div className="px-4 pb-4">
            <div className="h-40">
              <RealTimeChart
                data={chartData[selectedMetric]}
                title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend (24h)`}
                color={selectedMetric === 'occupancy' ? 'blue' : 
                       selectedMetric === 'revenue' ? 'green' :
                       selectedMetric === 'patients' ? 'purple' : 'yellow'}
                type="line"
              />
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Staff & Operations</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Staff on Duty</span>
                    <span className="font-medium">{metrics.staffing?.onDuty || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attendance Rate</span>
                    <span className="font-medium">{metrics.staffing?.attendanceRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Emergency Cases</span>
                    <span className="font-medium">{metrics.emergency?.activeCases || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Inventory & Finance</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Low Stock Items</span>
                    <span className={`font-medium ${
                      (metrics.inventory?.lowStockItems || 0) > 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {metrics.inventory?.lowStockItems || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending Payments</span>
                    <span className="font-medium">
                      ₦{((metrics.finance?.pendingPayments || 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Insurance Claims</span>
                    <span className="font-medium">{metrics.finance?.insuranceClaims || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => onSelectHospital(hospital)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              View Details
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Generate Report
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalPerformanceCard;
