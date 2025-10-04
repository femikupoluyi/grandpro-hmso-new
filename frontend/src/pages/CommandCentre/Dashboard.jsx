import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertCircle, TrendingUp, Users, 
  DollarSign, Building2, AlertTriangle, CheckCircle,
  RefreshCw, Settings, Filter, Bell
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CommandCentreDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Simulated real-time data
  const mockMetrics = {
    systemTotals: {
      totalHospitals: 7,
      totalPatients: 5567,
      totalStaff: 384,
      totalRevenue: 13710000,
      avgOccupancy: 76.6,
      activeAlerts: 5,
      criticalAlerts: 1
    },
    hospitals: [
      {
        id: 'hosp-lagos-001',
        name: 'Lagos University Teaching Hospital',
        state: 'Lagos',
        metrics: {
          patients: 1250,
          occupancy: 77,
          revenue: 3500000,
          staff: 85,
          satisfaction: 4.5,
          waitTime: 35
        }
      },
      {
        id: 'hosp-abuja-001',
        name: 'National Hospital Abuja',
        state: 'FCT',
        metrics: {
          patients: 980,
          occupancy: 80,
          revenue: 2800000,
          staff: 72,
          satisfaction: 4.3,
          waitTime: 42
        }
      },
      {
        id: 'hosp-ibadan-001',
        name: 'University College Hospital Ibadan',
        state: 'Oyo',
        metrics: {
          patients: 890,
          occupancy: 75.5,
          revenue: 2200000,
          staff: 68,
          satisfaction: 4.2,
          waitTime: 28
        }
      },
      {
        id: 'hosp-lagos-002',
        name: 'St. Nicholas Hospital',
        state: 'Lagos',
        metrics: {
          patients: 567,
          occupancy: 89,
          revenue: 410000,
          staff: 45,
          satisfaction: 3.8,
          waitTime: 95
        }
      },
      {
        id: 'hosp-kano-001',
        name: 'Aminu Kano Teaching Hospital',
        state: 'Kano',
        metrics: {
          patients: 780,
          occupancy: 82.8,
          revenue: 1950000,
          staff: 58,
          satisfaction: 4.1,
          waitTime: 30
        }
      }
    ],
    recentActivity: [
      { time: '2 min ago', hospital: 'LUTH', event: 'New emergency admission', type: 'admission' },
      { time: '5 min ago', hospital: 'NHA', event: 'Surgery completed', type: 'procedure' },
      { time: '8 min ago', hospital: 'UCH', event: 'Low stock alert: Insulin', type: 'alert' },
      { time: '12 min ago', hospital: 'St. Nicholas', event: 'Critical occupancy level', type: 'warning' },
      { time: '15 min ago', hospital: 'AKTH', event: 'Patient discharged', type: 'discharge' }
    ]
  };

  useEffect(() => {
    // Load initial data
    loadMetrics();

    // Set up auto-refresh
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    }

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, selectedHospital]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setMetrics(mockMetrics);
      
      // Load alerts
      const mockAlerts = [
        { id: 1, severity: 'critical', type: 'wait_time', hospital: 'St. Nicholas Hospital', message: 'Wait time exceeds 90 minutes' },
        { id: 2, severity: 'warning', type: 'occupancy', hospital: 'St. Nicholas Hospital', message: 'Occupancy at 89%' },
        { id: 3, severity: 'warning', type: 'inventory', hospital: 'UCH Ibadan', message: 'Low stock: 5 critical items' },
        { id: 4, severity: 'warning', type: 'revenue', hospital: 'St. Nicholas Hospital', message: 'Revenue 18% below target' },
        { id: 5, severity: 'info', type: 'maintenance', hospital: 'LUTH', message: 'Scheduled maintenance in 2 days' }
      ];
      setActiveAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const occupancyChartData = {
    labels: metrics?.hospitals.map(h => h.name.split(' ')[0]) || [],
    datasets: [{
      label: 'Occupancy Rate (%)',
      data: metrics?.hospitals.map(h => h.metrics.occupancy) || [],
      backgroundColor: metrics?.hospitals.map(h => 
        h.metrics.occupancy > 85 ? 'rgba(239, 68, 68, 0.5)' :
        h.metrics.occupancy > 70 ? 'rgba(251, 191, 36, 0.5)' :
        'rgba(34, 197, 94, 0.5)'
      ) || [],
      borderColor: metrics?.hospitals.map(h => 
        h.metrics.occupancy > 85 ? 'rgb(239, 68, 68)' :
        h.metrics.occupancy > 70 ? 'rgb(251, 191, 36)' :
        'rgb(34, 197, 94)'
      ) || [],
      borderWidth: 1
    }]
  };

  const revenueChartData = {
    labels: metrics?.hospitals.map(h => h.name.split(' ')[0]) || [],
    datasets: [{
      label: 'Revenue Today (₦)',
      data: metrics?.hospitals.map(h => h.metrics.revenue) || [],
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 1
    }]
  };

  const performanceChartData = {
    labels: ['Excellent', 'Good', 'Average', 'Poor'],
    datasets: [{
      data: [2, 2, 2, 1],
      backgroundColor: [
        'rgba(34, 197, 94, 0.5)',
        'rgba(59, 130, 246, 0.5)',
        'rgba(251, 191, 36, 0.5)',
        'rgba(239, 68, 68, 0.5)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(59, 130, 246)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label?.includes('Revenue')) {
              return `${context.dataset.label}: ₦${context.parsed.y.toLocaleString()}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const getAlertIcon = (severity) => {
    switch(severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'admission': return <Users className="h-4 w-4 text-blue-500" />;
      case 'procedure': return <Activity className="h-4 w-4 text-green-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'discharge': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Command Centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Command Centre</h1>
            <p className="text-gray-600 mt-1">Real-time monitoring across all hospitals</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Hospital Filter */}
            <select 
              value={selectedHospital} 
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Hospitals</option>
              {metrics?.hospitals.map(hospital => (
                <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
              ))}
            </select>

            {/* Auto Refresh Toggle */}
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Hospitals</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.systemTotals.totalHospitals}</p>
              <p className="text-xs text-green-600 mt-1">All operational</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.systemTotals.totalPatients.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">+12% from yesterday</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Today</p>
              <p className="text-2xl font-bold text-gray-900">₦{(metrics?.systemTotals.totalRevenue / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-green-600 mt-1">On target</p>
            </div>
            <DollarSign className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.systemTotals.activeAlerts}</p>
              <p className="text-xs text-red-600 mt-1">{metrics?.systemTotals.criticalAlerts} critical</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Occupancy Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital Occupancy Rates</h2>
            <Bar data={occupancyChartData} options={chartOptions} />
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Normal (≤70%)
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  High (70-85%)
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Critical (>85%)
                </span>
              </div>
              <p className="text-gray-600">Avg: {metrics?.systemTotals.avgOccupancy}%</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Performance</h2>
            <Bar data={revenueChartData} options={chartOptions} />
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Today Total</p>
                <p className="font-semibold">₦{(metrics?.systemTotals.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-gray-600">Target</p>
                <p className="font-semibold">₦15M</p>
              </div>
              <div>
                <p className="text-gray-600">Achievement</p>
                <p className="font-semibold text-green-600">91.4%</p>
              </div>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Doughnut data={performanceChartData} />
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Top Performers</h3>
                {metrics?.hospitals.slice(0, 3).map((hospital, idx) => (
                  <div key={hospital.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">{idx + 1}.</span>
                      <span className="text-sm">{hospital.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {(90 - idx * 5)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Alerts & Activity */}
        <div className="space-y-6">
          {/* Active Alerts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeAlerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.hospital}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {metrics?.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.event}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.hospital}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Generate Report
              </button>
              <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Configure Alerts
              </button>
              <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCentreDashboard;
