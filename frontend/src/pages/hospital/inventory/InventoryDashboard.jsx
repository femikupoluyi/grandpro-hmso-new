import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BeakerIcon,
  ExclamationTriangleIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/hospital/inventory'
});

export default function InventoryDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showLowStock, setShowLowStock] = useState(false);
  
  const hospitalId = localStorage.getItem('hospitalId') || 'default';

  // Fetch inventory items
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory', hospitalId, filterType, showLowStock, searchTerm],
    queryFn: async () => {
      const response = await api.get('/items', {
        params: {
          hospital_id: hospitalId,
          item_type: filterType === 'ALL' ? undefined : filterType,
          low_stock: showLowStock,
          search: searchTerm || undefined
        }
      });
      return response.data.data;
    }
  });

  // Fetch expiring items
  const { data: expiringData } = useQuery({
    queryKey: ['expiringItems', hospitalId],
    queryFn: async () => {
      const response = await api.get('/reports/expiring', {
        params: { hospital_id: hospitalId, days: 90 }
      });
      return response.data.data;
    }
  });

  // Fetch inventory valuation
  const { data: valuationData } = useQuery({
    queryKey: ['inventoryValuation', hospitalId],
    queryFn: async () => {
      const response = await api.get('/reports/valuation', {
        params: { hospital_id: hospitalId }
      });
      return response.data.data;
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const stats = [
    {
      name: 'Total Items',
      value: inventoryData?.length || 0,
      icon: BeakerIcon,
      color: 'bg-blue-500',
      subtext: 'In inventory'
    },
    {
      name: 'Low Stock',
      value: inventoryData?.filter(item => item.current_stock <= item.reorder_level).length || 0,
      icon: ArrowTrendingDownIcon,
      color: 'bg-yellow-500',
      subtext: 'Need reorder'
    },
    {
      name: 'Out of Stock',
      value: inventoryData?.filter(item => item.current_stock === 0).length || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      subtext: 'Critical'
    },
    {
      name: 'Inventory Value',
      value: formatCurrency(valuationData?.summary?.total_value),
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      subtext: `${valuationData?.summary?.total_items || 0} items`
    }
  ];

  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Out of Stock</span>;
    } else if (item.current_stock <= item.reorder_level) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Stock</span>;
    }
  };

  const getItemTypeColor = (type) => {
    switch (type) {
      case 'DRUG':
        return 'bg-blue-100 text-blue-800';
      case 'CONSUMABLE':
        return 'bg-purple-100 text-purple-800';
      case 'EQUIPMENT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage drugs, consumables, and equipment inventory
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Create PO
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center">
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.subtext}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expiring Items Alert */}
      {expiringData && (expiringData.expired.length > 0 || expiringData.expiring_soon.length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">{expiringData.summary.expired_count}</span> items have expired and 
                <span className="font-semibold"> {expiringData.summary.expiring_soon_count}</span> items are expiring within 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Inventory Items</h2>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Types</option>
                <option value="DRUG">Drugs</option>
                <option value="CONSUMABLE">Consumables</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>

              {/* Low Stock Filter */}
              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`px-4 py-2 rounded-md border ${
                  showLowStock 
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-700' 
                    : 'border-gray-300 text-gray-700'
                } hover:bg-yellow-50 flex items-center`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Low Stock
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
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
              {inventoryData?.slice(0, 10).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.item_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.item_name}</div>
                      {item.generic_name && (
                        <div className="text-gray-500 text-xs">{item.generic_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getItemTypeColor(item.item_type)}`}>
                      {item.item_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className={`font-semibold ${
                        item.current_stock === 0 ? 'text-red-600' :
                        item.current_stock <= item.reorder_level ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {item.current_stock}
                      </span>
                      <span className="ml-1 text-gray-500">
                        {item.unit_of_measure}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reorder_level} {item.unit_of_measure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.selling_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStockStatus(item)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      View
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inventoryData && inventoryData.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing 10 of {inventoryData.length} items
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Items</h3>
          <div className="space-y-3">
            {inventoryData?.filter(item => item.current_stock <= item.reorder_level && item.current_stock > 0)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-xs text-gray-500">{item.current_stock} remaining</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-900">
                    Reorder
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Out of Stock</h3>
          <div className="space-y-3">
            {inventoryData?.filter(item => item.current_stock === 0)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-xs text-red-500">Out of stock</p>
                  </div>
                  <button className="text-xs text-red-600 hover:text-red-900">
                    Urgent
                  </button>
                </div>
              ))}
            {inventoryData?.filter(item => item.current_stock === 0).length === 0 && (
              <p className="text-sm text-gray-500">No items out of stock</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expiring Soon</h3>
          <div className="space-y-3">
            {expiringData?.expiring_soon?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                  <p className="text-xs text-yellow-500">
                    Expires in {item.days_to_expiry} days
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {item.batch_number}
                </span>
              </div>
            ))}
            {(!expiringData?.expiring_soon || expiringData.expiring_soon.length === 0) && (
              <p className="text-sm text-gray-500">No items expiring soon</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
