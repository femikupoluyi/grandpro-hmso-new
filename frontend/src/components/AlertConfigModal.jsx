import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Bell, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AlertConfigModal = ({ isOpen, onClose }) => {
  const [alertRules, setAlertRules] = useState([]);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: 'threshold',
    metric_type: 'occupancy',
    comparison_operator: '>',
    threshold_value: '',
    severity: 'warning',
    notification_channels: []
  });
  const [loading, setLoading] = useState(false);

  const metricTypes = [
    { value: 'occupancy', label: 'Bed Occupancy Rate' },
    { value: 'revenue', label: 'Revenue Collection' },
    { value: 'stock_level', label: 'Inventory Stock Level' },
    { value: 'staff_attendance', label: 'Staff Attendance' },
    { value: 'wait_time', label: 'Patient Wait Time' },
    { value: 'outstanding_payments', label: 'Outstanding Payments' }
  ];

  const operators = [
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' },
    { value: '=', label: 'Equal to' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchAlertRules();
    }
  }, [isOpen]);

  const fetchAlertRules = async () => {
    try {
      const response = await api.get('/operations/alert-rules');
      if (response.data.success) {
        setAlertRules(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching alert rules:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.rule_name || !newRule.threshold_value) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/operations/alert-rules', newRule);
      fetchAlertRules();
      setNewRule({
        rule_name: '',
        rule_type: 'threshold',
        metric_type: 'occupancy',
        comparison_operator: '>',
        threshold_value: '',
        severity: 'warning',
        notification_channels: []
      });
    } catch (error) {
      console.error('Error creating alert rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await api.delete(`/operations/alert-rules/${ruleId}`);
      fetchAlertRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const toggleRuleStatus = async (ruleId, currentStatus) => {
    try {
      await api.put(`/operations/alert-rules/${ruleId}`, {
        is_active: !currentStatus
      });
      fetchAlertRules();
    } catch (error) {
      console.error('Error updating rule status:', error);
    }
  };

  if (!isOpen) return null;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Alert Configuration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Create New Rule */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Create New Alert Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., High Occupancy Alert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric Type
                </label>
                <select
                  value={newRule.metric_type}
                  onChange={(e) => setNewRule({ ...newRule, metric_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {metricTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <div className="flex space-x-2">
                  <select
                    value={newRule.comparison_operator}
                    onChange={(e) => setNewRule({ ...newRule, comparison_operator: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newRule.threshold_value}
                    onChange={(e) => setNewRule({ ...newRule, threshold_value: e.target.value })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Value"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={newRule.severity}
                  onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Channels
              </label>
              <div className="flex space-x-4">
                {['dashboard', 'email', 'sms'].map((channel) => (
                  <label key={channel} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.notification_channels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRule({
                            ...newRule,
                            notification_channels: [...newRule.notification_channels, channel]
                          });
                        } else {
                          setNewRule({
                            ...newRule,
                            notification_channels: newRule.notification_channels.filter(c => c !== channel)
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateRule}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>Create Rule</span>
            </button>
          </div>

          {/* Existing Rules */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Active Alert Rules</h3>
            <div className="space-y-3">
              {alertRules.map((rule) => (
                <div key={rule.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getSeverityIcon(rule.severity)}
                        <h4 className="font-medium text-gray-900">{rule.rule_name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Condition:</span> {rule.metric_type} {rule.comparison_operator} {rule.threshold_value}
                      </div>
                      {rule.notification_channels && rule.notification_channels.length > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Notifications:</span>
                          {rule.notification_channels.map((channel) => (
                            <span key={channel} className="px-2 py-1 text-xs bg-gray-100 rounded capitalize">
                              {channel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {rule.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {alertRules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No alert rules configured yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertConfigModal;
