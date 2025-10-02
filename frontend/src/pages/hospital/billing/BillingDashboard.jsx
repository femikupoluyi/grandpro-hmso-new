import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CurrencyDollarIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/hospital/billing'
});

export default function BillingDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const hospitalId = localStorage.getItem('hospitalId') || 'default';

  // Fetch billing summary
  const { data: summaryData } = useQuery({
    queryKey: ['billingSummary', selectedDate, hospitalId],
    queryFn: async () => {
      const response = await api.get('/reports/summary', {
        params: {
          hospital_id: hospitalId,
          start_date: selectedDate,
          end_date: selectedDate
        }
      });
      return response.data.data;
    }
  });

  // Fetch outstanding bills
  const { data: outstandingBills } = useQuery({
    queryKey: ['outstandingBills', hospitalId],
    queryFn: async () => {
      const response = await api.get('/reports/outstanding', {
        params: { hospital_id: hospitalId, min_days: 30 }
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
      name: 'Total Billed Today',
      value: formatCurrency(summaryData?.summary?.total_billed),
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      subtext: `${summaryData?.summary?.total_bills || 0} bills`
    },
    {
      name: 'Collected Today',
      value: formatCurrency(summaryData?.summary?.total_collected),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      subtext: `${summaryData?.summary?.paid_bills || 0} paid`
    },
    {
      name: 'Outstanding',
      value: formatCurrency(summaryData?.summary?.total_outstanding),
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      subtext: `${summaryData?.summary?.unpaid_bills || 0} unpaid`
    },
    {
      name: 'Partial Payments',
      value: summaryData?.summary?.partial_bills || 0,
      icon: CreditCardIcon,
      color: 'bg-purple-500',
      subtext: 'bills'
    }
  ];

  // Mock recent bills data
  const recentBills = [
    {
      id: 1,
      bill_number: 'BILL2025000123',
      patient_name: 'Adebayo Ogundimu',
      patient_number: 'GP2025000145',
      total_amount: 25000,
      paid_amount: 25000,
      balance: 0,
      status: 'PAID',
      date: '2025-10-02'
    },
    {
      id: 2,
      bill_number: 'BILL2025000122',
      patient_name: 'Fatima Abdullahi',
      patient_number: 'GP2025000144',
      total_amount: 15000,
      paid_amount: 10000,
      balance: 5000,
      status: 'PARTIAL',
      date: '2025-10-02'
    },
    {
      id: 3,
      bill_number: 'BILL2025000121',
      patient_name: 'Chinedu Okafor',
      patient_number: 'GP2025000143',
      total_amount: 8500,
      paid_amount: 0,
      balance: 8500,
      status: 'UNPAID',
      date: '2025-10-01'
    }
  ];

  const filteredBills = recentBills.filter(bill => {
    const matchesSearch = bill.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bill.patient_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Paid</span>;
      case 'PARTIAL':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Partial</span>;
      case 'UNPAID':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Unpaid</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage bills, payments, and financial transactions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center">
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Generate Bill
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

      {/* Department Revenue */}
      {summaryData?.department_revenue && summaryData.department_revenue.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Revenue by Department</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {summaryData.department_revenue.slice(0, 5).map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {dept.department || 'General'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({dept.bills} bills)
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(dept.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Bills Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Bills</h2>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search bills..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bill.bill_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">{bill.patient_name}</div>
                      <div className="text-gray-500">{bill.patient_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.paid_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(bill.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      View
                    </button>
                    {bill.status !== 'PAID' && (
                      <button className="text-green-600 hover:text-green-900">
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding Bills Alert */}
      {outstandingBills?.bills && outstandingBills.bills.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have <span className="font-semibold">{outstandingBills.summary.total_bills}</span> outstanding bills 
                totaling <span className="font-semibold">{formatCurrency(outstandingBills.summary.total_outstanding)}</span> that 
                are over 30 days old.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
