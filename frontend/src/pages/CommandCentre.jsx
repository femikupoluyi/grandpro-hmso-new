import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Bell,
  BarChart3,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Filter,
  ChevronRight,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
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

const CommandCentre = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [activeTab, setActiveTab] = useState('overview');
  const [alertFilter, setAlertFilter] = useState('all');
  const [showAlertConfig, setShowAlertConfig] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/operations/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
        // Extract alerts and projects from the response
        if (response.data.data.commandCentre) {
          setAlerts(response.data.data.commandCentre.alerts || []);
        }
        if (response.data.data.activeProjects) {
          setProjects(response.data.data.activeProjects || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh dashboard
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, selectedHospitals]);

  // Handle alert acknowledgment
  const acknowledgeAlert = async (alertId) => {
    try {
      await api.put(`/operations/alerts/${alertId}/acknowledge`, {
        acknowledgedBy: 'Admin User',
        notes: 'Alert acknowledged from Command Centre'
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Filter alerts based on severity
  const getFilteredAlerts = () => {
    if (alertFilter === 'all') return alerts;
    return alerts.filter(alert => alert.severity === alertFilter);
  };

  // Get alert icon and color based on severity
  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-100' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-100' };
      default:
        return { icon: Bell, color: 'text-blue-600 bg-blue-100' };
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!dashboardData?.commandCentre?.metrics) return null;

    const metrics = dashboardData.commandCentre.metrics;

    // Patient flow chart
    const patientFlowData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Admissions',
          data: [65, 72, 68, 81, 79, 85, 87],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Discharges',
          data: [45, 52, 48, 61, 59, 65, 67],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true
        }
      ]
    };

    // Revenue chart
    const revenueData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue (₦M)',
          data: [12, 15, 18, 17, 20, 22],
          backgroundColor: 'rgba(59, 130, 246, 0.6)'
        },
        {
          label: 'Collections (₦M)',
          data: [10, 13, 16, 15, 18, 20],
          backgroundColor: 'rgba(34, 197, 94, 0.6)'
        }
      ]
    };

    // Occupancy rate chart
    const occupancyData = {
      labels: dashboardData.commandCentre.metrics.occupancy?.map(h => h.name) || [],
      datasets: [{
        data: dashboardData.commandCentre.metrics.occupancy?.map(h => h.occupancy_rate) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ]
      }]
    };

    return { patientFlowData, revenueData, occupancyData };
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = dashboardData?.commandCentre?.metrics || {};
  const summary = dashboardData?.commandCentre?.summary || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operations Command Centre</h1>
                <p className="text-sm text-gray-500">Real-time monitoring across all hospitals</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowAlertConfig(!showAlertConfig)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex space-x-8 border-t">
          {['overview', 'alerts', 'projects', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* System Status Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${
                      summary.systemHealth === 'healthy' ? 'bg-green-500' : 
                      summary.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    } animate-pulse`}></div>
                    <span className="text-sm font-medium">System Health: {summary.systemHealth || 'Unknown'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{summary.totalHospitals || 0}</span> Hospitals Monitored
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-red-600">{summary.criticalAlerts || 0}</span> Critical Alerts
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Last Updated: {new Date(dashboardData?.timestamp || Date.now()).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.patients?.totalPatients || 0}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      +{metrics.patients?.newPatientsToday || 0} today
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Staff Present</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.staff?.presentToday || 0}/{metrics.staff?.activeStaff || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {metrics.staff?.attendanceRate || 0}% attendance
                    </p>
                  </div>
                  <Briefcase className="h-10 w-10 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{((metrics.financial?.revenueMonth || 0) / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {metrics.financial?.collectionRate || 0}% collected
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-yellow-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Occupancy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.occupancy?.reduce((acc, h) => acc + (h.occupancy_rate || 0), 0) / 
                       (metrics.occupancy?.length || 1) || 0}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Across all facilities
                    </p>
                  </div>
                  <Building2 className="h-10 w-10 text-purple-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Patient Flow Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Patient Flow Trends</h3>
                {chartData?.patientFlowData && (
                  <Line 
                    data={chartData.patientFlowData} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'bottom' }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                )}
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Performance</h3>
                {chartData?.revenueData && (
                  <Bar 
                    data={chartData.revenueData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'bottom' }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Hospital Performance Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Hospital Performance Scores</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Occupancy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collection Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.performance?.map((hospital, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {hospital.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {hospital.performance_score}/100
                            </div>
                            <div className={`ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden`}>
                              <div 
                                className={`h-full ${
                                  hospital.performance_score > 80 ? 'bg-green-500' :
                                  hospital.performance_score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${hospital.performance_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hospital.occupancy_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hospital.collection_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            hospital.performance_score > 80 
                              ? 'bg-green-100 text-green-800'
                              : hospital.performance_score > 60 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {hospital.performance_score > 80 ? 'Excellent' :
                             hospital.performance_score > 60 ? 'Good' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Alert Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Filter by severity:</span>
                  <div className="flex space-x-2">
                    {['all', 'critical', 'warning', 'info'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAlertFilter(filter)}
                        className={`px-3 py-1 text-sm rounded-lg capitalize ${
                          alertFilter === filter
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {getFilteredAlerts().length} active alerts
                  </span>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                    Configure Rules
                  </button>
                </div>
              </div>
            </div>

            {/* Alert List */}
            <div className="space-y-4">
              {getFilteredAlerts().map((alert) => {
                const { icon: Icon, color } = getAlertStyle(alert.severity);
                return (
                  <div key={alert.id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {alert.message}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            Hospital: {alert.hospital_name || 'System-wide'} • 
                            Type: {alert.type} • 
                            Created: {new Date(alert.created_at).toLocaleString()}
                          </p>
                          {alert.current_value && alert.threshold_value && (
                            <p className="mt-2 text-sm text-gray-700">
                              Current: {alert.current_value} / Threshold: {alert.threshold_value}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.status === 'active' ? (
                          <>
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Acknowledge
                            </button>
                            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                              Dismiss
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Acknowledged by {alert.acknowledged_by}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {getFilteredAlerts().length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts matching your filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Project Board Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Hospital Expansion & Renovation Projects</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <span>New Project</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['Planning', 'Approved', 'Active', 'Completed'].map((status) => (
                <div key={status} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-4">{status}</h4>
                  <div className="space-y-3">
                    {projects
                      .filter(project => project.status?.toLowerCase() === status.toLowerCase())
                      .map((project) => (
                        <div key={project.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-sm text-gray-900">{project.name}</h5>
                            <span className={`px-2 py-1 text-xs rounded ${
                              project.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              project.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {project.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{project.hospital_name}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{project.completion_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${project.completion_percentage || 0}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <span>₦{((project.budget || 0) / 1000000).toFixed(1)}M</span>
                            <span>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}</span>
                          </div>

                          {project.team_size > 0 && (
                            <div className="mt-3 flex items-center text-xs text-gray-600">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{project.team_size} team members</span>
                            </div>
                          )}
                        </div>
                      ))}

                    {projects.filter(p => p.status?.toLowerCase() === status.toLowerCase()).length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No projects in {status.toLowerCase()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Total Projects</h4>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Active</span>
                    <span className="font-medium">{projects.filter(p => p.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Planning</span>
                    <span className="font-medium">{projects.filter(p => p.status === 'planning').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Total Budget</h4>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{(projects.reduce((sum, p) => sum + (p.budget || 0), 0) / 1000000).toFixed(1)}M
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Allocated</span>
                    <span className="font-medium">
                      ₦{(projects.reduce((sum, p) => sum + (p.allocated_budget || 0), 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Spent</span>
                    <span className="font-medium">
                      ₦{(projects.reduce((sum, p) => sum + (p.spent_budget || 0), 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Completion Rate</h4>
                <p className="text-3xl font-bold text-gray-900">
                  {projects.length > 0 
                    ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100)
                    : 0}%
                </p>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Overall Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${projects.length > 0 
                          ? (projects.filter(p => p.status === 'completed').length / projects.length) * 100
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Occupancy Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Hospital Occupancy Distribution</h3>
                {chartData?.occupancyData && chartData.occupancyData.labels.length > 0 ? (
                  <Doughnut 
                    data={chartData.occupancyData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'right' }
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8">No occupancy data available</p>
                )}
              </div>

              {/* Staff Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Staff Performance Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {metrics.staff?.attendanceRate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics.staff?.attendanceRate || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Performance Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {metrics.staff?.avgPerformanceScore || 0}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${metrics.staff?.avgPerformanceScore || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.staff?.patientToNurseRatio || 0}:1
                      </p>
                      <p className="text-xs text-gray-600">Patient to Nurse Ratio</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.staff?.patientToDoctorRatio || 0}:1
                      </p>
                      <p className="text-xs text-gray-600">Patient to Doctor Ratio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expansion Opportunities */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Expansion Opportunities</h3>
              </div>
              <div className="p-6">
                {dashboardData?.expansionOpportunities?.map((opportunity, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{opportunity.hospitalName}</h4>
                        <p className="text-sm text-gray-600 mt-1">{opportunity.recommendation}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Priority: {opportunity.priority}</span>
                          <span>•</span>
                          <span>Occupancy: {opportunity.metrics?.occupancyRate}%</span>
                          <span>•</span>
                          <span>Revenue: ₦{(opportunity.metrics?.monthlyRevenue / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        Create Project
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!dashboardData?.expansionOpportunities || dashboardData.expansionOpportunities.length === 0) && (
                  <p className="text-gray-500 text-center py-8">
                    No expansion opportunities identified at this time
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandCentre;
