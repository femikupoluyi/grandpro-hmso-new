import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Save, 
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

const AlertConfiguration = ({ onSave, onClose }) => {
  const [alertSettings, setAlertSettings] = useState({
    occupancy: {
      enabled: true,
      critical: 95,
      warning: 85,
      email: true,
      sms: false,
      dashboard: true
    },
    staffing: {
      enabled: true,
      critical: 75,
      warning: 85,
      email: true,
      sms: true,
      dashboard: true
    },
    inventory: {
      enabled: true,
      critical: 10,
      warning: 5,
      email: false,
      sms: false,
      dashboard: true
    },
    revenue: {
      enabled: true,
      target: 3000000,
      belowTarget: 2500000,
      email: true,
      sms: false,
      dashboard: true
    },
    emergency: {
      enabled: true,
      surge: 10,
      email: true,
      sms: true,
      dashboard: true
    },
    pendingPayments: {
      enabled: true,
      threshold: 1000000,
      email: true,
      sms: false,
      dashboard: true
    }
  });

  const handleThresholdChange = (category, field, value) => {
    setAlertSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: field === 'enabled' || field === 'email' || field === 'sms' || field === 'dashboard' 
          ? value 
          : parseFloat(value) || 0
      }
    }));
  };

  const handleSave = () => {
    onSave(alertSettings);
    alert('Alert settings saved successfully!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Alert Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Occupancy Alerts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Bed Occupancy Alerts
              </h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alertSettings.occupancy.enabled}
                  onChange={(e) => handleThresholdChange('occupancy', 'enabled', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>
            
            {alertSettings.occupancy.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Critical Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.occupancy.critical}
                      onChange={(e) => handleThresholdChange('occupancy', 'critical', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warning Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.occupancy.warning}
                      onChange={(e) => handleThresholdChange('occupancy', 'warning', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.occupancy.dashboard}
                      onChange={(e) => handleThresholdChange('occupancy', 'dashboard', e.target.checked)}
                      className="rounded"
                    />
                    Dashboard
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.occupancy.email}
                      onChange={(e) => handleThresholdChange('occupancy', 'email', e.target.checked)}
                      className="rounded"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.occupancy.sms}
                      onChange={(e) => handleThresholdChange('occupancy', 'sms', e.target.checked)}
                      className="rounded"
                    />
                    SMS
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Staff Attendance Alerts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Staff Attendance Alerts
              </h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alertSettings.staffing.enabled}
                  onChange={(e) => handleThresholdChange('staffing', 'enabled', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>
            
            {alertSettings.staffing.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Critical Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.staffing.critical}
                      onChange={(e) => handleThresholdChange('staffing', 'critical', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warning Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.staffing.warning}
                      onChange={(e) => handleThresholdChange('staffing', 'warning', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.staffing.dashboard}
                      onChange={(e) => handleThresholdChange('staffing', 'dashboard', e.target.checked)}
                      className="rounded"
                    />
                    Dashboard
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.staffing.email}
                      onChange={(e) => handleThresholdChange('staffing', 'email', e.target.checked)}
                      className="rounded"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.staffing.sms}
                      onChange={(e) => handleThresholdChange('staffing', 'sms', e.target.checked)}
                      className="rounded"
                    />
                    SMS
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Inventory Alerts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Inventory Alerts
              </h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alertSettings.inventory.enabled}
                  onChange={(e) => handleThresholdChange('inventory', 'enabled', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>
            
            {alertSettings.inventory.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Critical (Low Stock Items)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.inventory.critical}
                      onChange={(e) => handleThresholdChange('inventory', 'critical', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warning (Low Stock Items)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.inventory.warning}
                      onChange={(e) => handleThresholdChange('inventory', 'warning', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.inventory.dashboard}
                      onChange={(e) => handleThresholdChange('inventory', 'dashboard', e.target.checked)}
                      className="rounded"
                    />
                    Dashboard
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.inventory.email}
                      onChange={(e) => handleThresholdChange('inventory', 'email', e.target.checked)}
                      className="rounded"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.inventory.sms}
                      onChange={(e) => handleThresholdChange('inventory', 'sms', e.target.checked)}
                      className="rounded"
                    />
                    SMS
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Revenue Alerts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-green-500" />
                Revenue Alerts
              </h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alertSettings.revenue.enabled}
                  onChange={(e) => handleThresholdChange('revenue', 'enabled', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>
            
            {alertSettings.revenue.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Target (₦)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.revenue.target}
                      onChange={(e) => handleThresholdChange('revenue', 'target', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Below (₦)
                    </label>
                    <input
                      type="number"
                      value={alertSettings.revenue.belowTarget}
                      onChange={(e) => handleThresholdChange('revenue', 'belowTarget', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.revenue.dashboard}
                      onChange={(e) => handleThresholdChange('revenue', 'dashboard', e.target.checked)}
                      className="rounded"
                    />
                    Dashboard
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.revenue.email}
                      onChange={(e) => handleThresholdChange('revenue', 'email', e.target.checked)}
                      className="rounded"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.revenue.sms}
                      onChange={(e) => handleThresholdChange('revenue', 'sms', e.target.checked)}
                      className="rounded"
                    />
                    SMS
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Alert Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Alert Summary</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>• {Object.values(alertSettings).filter(s => s.enabled).length} alert categories enabled</p>
              <p>• Email notifications: {Object.values(alertSettings).filter(s => s.enabled && s.email).length} categories</p>
              <p>• SMS notifications: {Object.values(alertSettings).filter(s => s.enabled && s.sms).length} categories</p>
              <p>• Dashboard alerts: {Object.values(alertSettings).filter(s => s.enabled && s.dashboard).length} categories</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertConfiguration;
