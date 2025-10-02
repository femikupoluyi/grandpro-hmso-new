import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  DollarSign,
  Bed,
  Building,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Monitor,
  MapPin,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CommandCentre = () => {
  const [metrics, setMetrics] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [alerts, setAlerts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchDashboardData();
        setLastUpdate(new Date());
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedHospital, timeRange, autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const requests = [
        axios.get(`${API_URL}/operations/metrics/multi-hospital`, {
          params: { timeRange },
          headers
        }),
        axios.get(`${API_URL}/operations/alerts`, {
          params: { resolved: false },
          headers
        }),
        axios.get(`${API_URL}/operations/kpis`, {
          params: { period: 'month' },
          headers
        }),
        axios.get(`${API_URL}/operations/rankings/occupancy`, {
          params: { period: '7d' },
          headers
        })
      ];

      if (selectedHospital !== 'all') {
        requests[0] = axios.get(`${API_URL}/operations/metrics/hospital/${selectedHospital}`, {
          params: { timeRange },
          headers
        });
      }

      const [metricsRes, alertsRes, kpisRes, rankingsRes] = await Promise.all(requests);

      setMetrics(metricsRes.data.metrics);
      setAlerts(alertsRes.data.alerts || []);
      setKpis(kpisRes.data.kpis);
      setRankings(rankingsRes.data.rankings || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getAlertIcon = (severity) => {
    switch(severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Activity className="h-5 w-5 text-blue-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyColor = (percentage) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 85) return 'bg-yellow-500';
    if (percentage < 95) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Operations Command Centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Monitor className="h-8 w-8 text-blue-400" />
              Operations Command Centre
            </h1>
            <p className="text-gray-400 mt-1">Real-time monitoring across all facilities</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString('en-NG')}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Critical Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Patients</span>
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{metrics?.aggregate?.totalPatients || 0}</div>
          <div className="text-xs text-green-400 mt-1">↑ 12% from yesterday</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Admissions</span>
            <Bed className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold">{metrics?.aggregate?.totalAdmissions || 0}</div>
          <div className="text-xs text-yellow-400 mt-1">↑ 5% from yesterday</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Occupancy</span>
            <Activity className="h-5 w-5 text-green-400" />
          </div>
          <div className={`text-2xl font-bold ${
            metrics?.aggregate?.averageOccupancy > 90 ? 'text-red-400' :
            metrics?.aggregate?.averageOccupancy > 75 ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {metrics?.aggregate?.averageOccupancy?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Across all facilities</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Daily Revenue</span>
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics?.aggregate?.totalRevenue)}
          </div>
          <div className="text-xs text-green-400 mt-1">↑ 8% from target</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Staff On Duty</span>
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold">{metrics?.aggregate?.staffOnDuty || 0}</div>
          <div className="text-xs text-gray-400 mt-1">All locations</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Critical Alerts</span>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className={`text-2xl font-bold ${
            metrics?.aggregate?.criticalAlerts > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {metrics?.aggregate?.criticalAlerts || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">Requiring attention</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Performance Grid */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-400" />
                Hospital Performance Matrix
              </h2>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="pb-3">Hospital</th>
                      <th className="pb-3 text-center">Occupancy</th>
                      <th className="pb-3 text-center">Patients</th>
                      <th className="pb-3 text-center">Revenue</th>
                      <th className="pb-3 text-center">Staff</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.hospitals?.map((hospital) => (
                      <tr key={hospital.id} className="border-t border-gray-700">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{hospital.name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {hospital.location}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-20">
                              <div className="text-sm font-medium mb-1">
                                {hospital.metrics?.occupancy?.percentage?.toFixed(1) || 0}%
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getOccupancyColor(hospital.metrics?.occupancy?.percentage || 0)}`}
                                  style={{ width: `${hospital.metrics?.occupancy?.percentage || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="text-sm">
                            <div className="font-medium">{hospital.metrics?.patients?.total || 0}</div>
                            <div className="text-xs text-gray-400">
                              +{hospital.metrics?.patients?.newToday || 0} today
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatCurrency(hospital.metrics?.finance?.dailyRevenue)}
                            </div>
                            <div className="text-xs text-green-400">
                              ↑ 5%
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="text-sm">
                            <div className="font-medium">
                              {hospital.metrics?.staffing?.onDuty || 0}/{hospital.metrics?.staffing?.totalStaff || 0}
                            </div>
                            <div className="text-xs text-gray-400">
                              {hospital.metrics?.staffing?.attendanceRate?.toFixed(0) || 0}%
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          {hospital.metrics?.alerts?.critical > 0 ? (
                            <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded-full">
                              Critical
                            </span>
                          ) : hospital.metrics?.alerts?.warning > 0 ? (
                            <span className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs rounded-full">
                              Warning
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded-full">
                              Optimal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* KPI Tracking */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 mt-6">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Key Performance Indicators
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Patient Satisfaction</div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-green-400">
                      {kpis?.clinical?.patientSatisfaction?.toFixed(1) || 0}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">/5.0</div>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(kpis?.clinical?.patientSatisfaction || 0) * 20}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Bed Turnover Rate</div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-blue-400">
                      {kpis?.operational?.bedTurnoverRate?.toFixed(1) || 0}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">days</div>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((kpis?.operational?.bedTurnoverRate || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Collection Efficiency</div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-yellow-400">
                      {kpis?.financial?.collectionEfficiency?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${kpis?.financial?.collectionEfficiency || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Clinical Compliance</div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-purple-400">
                      {kpis?.quality?.clinicalCompliance?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${kpis?.quality?.clinicalCompliance || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Real-time Alerts
              </h2>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>All systems operational</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 10).map((alert, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-900/20 border-red-800' :
                        alert.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-800' :
                        'bg-blue-900/20 border-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{alert.title}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {alert.hospital_name} • {new Date(alert.created_at).toLocaleTimeString('en-NG')}
                          </div>
                          <div className="text-xs text-gray-300 mt-2">
                            {alert.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hospital Rankings */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                Performance Rankings
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {rankings.slice(0, 5).map((hospital, index) => (
                  <div key={hospital.hospitalId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-lg font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{hospital.name}</div>
                        <div className="text-xs text-gray-400">
                          Occupancy: {hospital.value?.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {hospital.trend?.direction === 'up' ? (
                        <span className="text-green-400 text-xs">
                          ↑ {hospital.trend.percentage?.toFixed(1)}%
                        </span>
                      ) : hospital.trend?.direction === 'down' ? (
                        <span className="text-red-400 text-xs">
                          ↓ {hospital.trend.percentage?.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">→ 0%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">System Status: Online</span>
            </div>
            <div className="text-sm text-gray-400">
              Data Latency: <span className="text-green-400">12ms</span>
            </div>
            <div className="text-sm text-gray-400">
              Active Users: <span className="text-blue-400">247</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-blue-400 hover:text-blue-300">
              View Detailed Analytics →
            </button>
            <button className="text-sm text-purple-400 hover:text-purple-300">
              Export Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCentre;
