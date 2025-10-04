import React, { useState, useEffect } from 'react';
import {
  AlertCircle, AlertTriangle, Bell, CheckCircle, XCircle,
  Filter, Settings, Download, TrendingUp, Clock,
  Activity, Package, Users, DollarSign, Zap
} from 'lucide-react';

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Alert thresholds configuration
  const [thresholds, setThresholds] = useState({
    occupancy: { warning: 85, critical: 95, enabled: true },
    revenue: { warning: 500000, critical: 300000, enabled: true },
    inventory: { warning: 25, critical: 10, enabled: true },
    waitTime: { warning: 60, critical: 90, enabled: true },
    staffUtilization: { warning: 85, critical: 95, enabled: true }
  });

  // Mock alerts data
  const mockAlerts = [
    {
      id: 1,
      severity: 'critical',
      category: 'wait_time',
      hospital: 'St. Nicholas Hospital',
      title: 'Critical Wait Time',
      message: 'Emergency department wait time exceeds 95 minutes',
      value: 95,
      threshold: 90,
      timestamp: '2025-10-04T12:30:00',
      status: 'active',
      assignedTo: 'Dr. Adebayo',
      department: 'Emergency'
    },
    {
      id: 2,
      severity: 'warning',
      category: 'occupancy',
      hospital: 'St. Nicholas Hospital',
      title: 'High Bed Occupancy',
      message: 'Bed occupancy rate at 89%, approaching critical level',
      value: 89,
      threshold: 85,
      timestamp: '2025-10-04T12:15:00',
      status: 'active',
      assignedTo: 'Nurse Manager',
      department: 'General Ward'
    },
    {
      id: 3,
      severity: 'warning',
      category: 'inventory',
      hospital: 'University College Hospital',
      title: 'Low Stock Alert',
      message: '8 critical items below reorder level',
      value: 8,
      threshold: 10,
      timestamp: '2025-10-04T11:45:00',
      status: 'active',
      assignedTo: 'Pharmacy Head',
      department: 'Pharmacy'
    },
    {
      id: 4,
      severity: 'warning',
      category: 'revenue',
      hospital: 'St. Nicholas Hospital',
      title: 'Revenue Below Target',
      message: 'Daily revenue ₦410,000 (18% below target)',
      value: 410000,
      threshold: 500000,
      timestamp: '2025-10-04T11:00:00',
      status: 'acknowledged',
      assignedTo: 'Finance Manager',
      department: 'Finance'
    },
    {
      id: 5,
      severity: 'info',
      category: 'staff',
      hospital: 'Lagos University Teaching Hospital',
      title: 'Staff Scheduling Update',
      message: 'Night shift staff rotation completed successfully',
      timestamp: '2025-10-04T10:30:00',
      status: 'resolved',
      resolvedBy: 'HR Manager',
      resolvedAt: '2025-10-04T10:45:00'
    },
    {
      id: 6,
      severity: 'critical',
      category: 'inventory',
      hospital: 'Federal Medical Centre Owerri',
      title: 'Critical Stock Shortage',
      message: 'Insulin stock critically low (3 vials remaining)',
      value: 3,
      threshold: 10,
      timestamp: '2025-10-04T10:00:00',
      status: 'active',
      assignedTo: 'Procurement Officer',
      department: 'Pharmacy'
    }
  ];

  useEffect(() => {
    setAlerts(mockAlerts);
    filterAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [selectedSeverity, selectedCategory, selectedStatus, alerts]);

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === selectedSeverity);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    setFilteredAlerts(filtered);
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Bell className="h-5 w-5 text-blue-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'occupancy': return <Users className="h-5 w-5" />;
      case 'inventory': return <Package className="h-5 w-5" />;
      case 'revenue': return <DollarSign className="h-5 w-5" />;
      case 'wait_time': return <Clock className="h-5 w-5" />;
      case 'staff': return <Users className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Active</span>;
      case 'acknowledged':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Acknowledged</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Resolved</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
        : alert
    ));
  };

  const resolveAlert = (alertId, notes) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'resolved', 
            resolvedAt: new Date().toISOString(),
            resolutionNotes: notes 
          }
        : alert
    ));
    setSelectedAlert(null);
  };

  const updateThreshold = (category, type, value) => {
    setThresholds(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value
      }
    }));
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    active: alerts.filter(a => a.status === 'active').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    avgResolutionTime: '45 min'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage system alerts across all hospitals</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Configure Thresholds</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Resolution</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="occupancy">Occupancy</option>
            <option value="inventory">Inventory</option>
            <option value="revenue">Revenue</option>
            <option value="wait_time">Wait Time</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>

          <div className="flex-1"></div>
          
          <span className="text-sm text-gray-600">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value / Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getSeverityIcon(alert.severity)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-500">{alert.message}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{alert.hospital}</p>
                      <p className="text-xs text-gray-500">{alert.department}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(alert.category)}
                      <span className="text-sm text-gray-900 capitalize">
                        {alert.category.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.value && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {alert.category === 'revenue' 
                            ? `₦${alert.value.toLocaleString()}`
                            : alert.category === 'wait_time'
                            ? `${alert.value} min`
                            : alert.value}
                        </span>
                        <span className="text-gray-500"> / </span>
                        <span className="text-gray-500">
                          {alert.category === 'revenue' 
                            ? `₦${alert.threshold.toLocaleString()}`
                            : alert.category === 'wait_time'
                            ? `${alert.threshold} min`
                            : alert.threshold}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(alert.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {alert.status === 'active' && (
                        <>
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Resolve
                        </button>
                      )}
                      {alert.status === 'resolved' && (
                        <span className="text-gray-400">Resolved</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Thresholds Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Configure Alert Thresholds</h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(thresholds).map(([category, config]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => updateThreshold(category, 'enabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">Enabled</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Warning Threshold
                        </label>
                        <input
                          type="number"
                          value={config.warning}
                          onChange={(e) => updateThreshold(category, 'warning', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={!config.enabled}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Critical Threshold
                        </label>
                        <input
                          type="number"
                          value={config.critical}
                          onChange={(e) => updateThreshold(category, 'critical', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={!config.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save thresholds
                    console.log('Saving thresholds:', thresholds);
                    setShowConfigModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Resolve Alert</h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Alert Details:</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{selectedAlert.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedAlert.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedAlert.hospital} - {selectedAlert.department}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Enter resolution details..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => resolveAlert(selectedAlert.id, 'Issue resolved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManagement;
