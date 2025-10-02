import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown,
  ShoppingCart,
  Calendar,
  Truck,
  BarChart3,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Pill,
  Syringe,
  Stethoscope,
  Activity
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiringItems: 0,
    pendingOrders: 0,
    totalValue: 0
  });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryData();
    const interval = setInterval(fetchInventoryData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [filterCategory]);

  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, alertsRes, expiringRes, movementsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/inventory/stats`, { headers }),
        axios.get(`${API_URL}/hospital/inventory/alerts/low-stock`, { headers }),
        axios.get(`${API_URL}/hospital/inventory/alerts/expiring`, { headers }),
        axios.get(`${API_URL}/hospital/inventory/movements/recent`, { headers }),
        axios.get(`${API_URL}/hospital/inventory/orders/pending`, { headers })
      ]);

      setStats(statsRes.data.stats || {
        totalItems: 0,
        lowStockItems: 0,
        expiringItems: 0,
        pendingOrders: 0,
        totalValue: 0
      });
      setLowStockAlerts(alertsRes.data.items || []);
      setExpiringItems(expiringRes.data.items || []);
      setRecentMovements(movementsRes.data.movements || []);
      setPendingOrders(ordersRes.data.orders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchInventoryData();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/inventory/search`, {
        params: { query: searchTerm, category: filterCategory !== 'all' ? filterCategory : undefined },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.items) {
        // Update the view with search results
        navigate('/hospital/inventory/items', { state: { searchResults: response.data.items } });
      }
    } catch (error) {
      console.error('Error searching inventory:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'medication': return <Pill className="h-5 w-5" />;
      case 'consumable': return <Syringe className="h-5 w-5" />;
      case 'equipment': return <Stethoscope className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getMovementTypeColor = (type) => {
    switch(type) {
      case 'in': return 'text-green-600';
      case 'out': return 'text-red-600';
      case 'adjustment': return 'text-blue-600';
      case 'transfer': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Monitor stock levels, expiry dates, and supply orders</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by item name, code, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="medication">Medications</option>
            <option value="consumable">Consumables</option>
            <option value="equipment">Equipment</option>
          </select>
          <button
            onClick={() => navigate('/hospital/inventory/add-item')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
          <button
            onClick={() => navigate('/hospital/inventory/purchase-order')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            New Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
            </div>
            <Package className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStockItems}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.expiringItems}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pendingOrders}</p>
            </div>
            <Truck className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Value</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <BarChart3 className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </h2>
            <button
              onClick={() => navigate('/hospital/inventory/alerts')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="p-4">
            {lowStockAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No low stock alerts</p>
            ) : (
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 5).map((item) => (
                  <div 
                    key={item.id}
                    className="border border-orange-200 rounded-lg p-3 bg-orange-50 hover:bg-orange-100 cursor-pointer"
                    onClick={() => navigate(`/hospital/inventory/item/${item.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {getCategoryIcon(item.category)}
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Code: {item.code}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-orange-700 font-semibold">
                              Stock: {item.current_quantity} {item.unit}
                            </span>
                            <span className="text-sm text-gray-600">
                              Min: {item.reorder_level} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hospital/inventory/reorder/${item.id}`);
                        }}
                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expiring Items */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              Expiring Soon
            </h2>
            <button
              onClick={() => navigate('/hospital/inventory/expiring')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="p-4">
            {expiringItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiringItems.slice(0, 5).map((item) => {
                  const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
                  const isExpired = daysUntilExpiry < 0;
                  const isCritical = daysUntilExpiry <= 30;
                  
                  return (
                    <div 
                      key={item.id}
                      className={`border rounded-lg p-3 cursor-pointer ${
                        isExpired ? 'border-red-300 bg-red-50' : 
                        isCritical ? 'border-yellow-300 bg-yellow-50' : 
                        'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => navigate(`/hospital/inventory/item/${item.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Batch: {item.batch_number} • Qty: {item.quantity} {item.unit}
                          </p>
                          <p className={`text-sm mt-1 font-semibold ${
                            isExpired ? 'text-red-700' : 
                            isCritical ? 'text-yellow-700' : 
                            'text-gray-700'
                          }`}>
                            {isExpired 
                              ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                              : `Expires in ${daysUntilExpiry} days`
                            }
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.expiry_date).toLocaleDateString('en-NG')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Stock Movements
            </h2>
            <button
              onClick={() => navigate('/hospital/inventory/movements')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="p-4">
            {recentMovements.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent movements</p>
            ) : (
              <div className="space-y-3">
                {recentMovements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 ${getMovementTypeColor(movement.type)}`}>
                        {movement.type === 'in' ? '↓' : movement.type === 'out' ? '↑' : '↔'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{movement.item_name}</p>
                        <p className="text-xs text-gray-600">
                          {movement.type === 'in' && 'Stock Added'}
                          {movement.type === 'out' && 'Stock Removed'}
                          {movement.type === 'adjustment' && 'Stock Adjusted'}
                          {movement.type === 'transfer' && 'Stock Transferred'}
                          {' • '}{movement.quantity} {movement.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {movement.reason || 'No reason provided'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(movement.movement_date).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Purchase Orders */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Pending Orders
            </h2>
            <button
              onClick={() => navigate('/hospital/inventory/orders')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="p-4">
            {pendingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending orders</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hospital/inventory/order/${order.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          PO-{order.order_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.supplier_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.items_count} items • {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(order.order_date).toLocaleDateString('en-NG')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Pill className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-gray-900">Medications</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {stats.medicationCount || 0}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Value: {formatCurrency(stats.medicationValue || 0)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Syringe className="h-6 w-6 text-purple-600" />
                <span className="font-medium text-gray-900">Consumables</span>
              </div>
              <span className="text-2xl font-bold text-purple-700">
                {stats.consumableCount || 0}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Value: {formatCurrency(stats.consumableValue || 0)}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-green-600" />
                <span className="font-medium text-gray-900">Equipment</span>
              </div>
              <span className="text-2xl font-bold text-green-700">
                {stats.equipmentCount || 0}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Value: {formatCurrency(stats.equipmentValue || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/hospital/inventory/stock-take')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="h-5 w-5" />
            Stock Take
          </button>
          <button
            onClick={() => navigate('/hospital/inventory/suppliers')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Truck className="h-5 w-5" />
            Manage Suppliers
          </button>
          <button
            onClick={() => navigate('/hospital/inventory/reports')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <BarChart3 className="h-5 w-5" />
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
